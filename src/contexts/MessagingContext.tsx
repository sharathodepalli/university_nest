import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { Conversation, Message, User, Listing } from "../types";

interface MessagingContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (
    listing: Listing,
    participant: User
  ) => Promise<Conversation>;
  markAsRead: (conversationId: string) => Promise<void>;
  unreadCount: number;
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(
  undefined
);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({
  children,
}) => {
  const { user, isSupabaseReady } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized setter to prevent infinite re-renders
  const setActiveConversation = useCallback(
    (conversation: Conversation | null) => {
      setActiveConversationState(conversation);
    },
    []
  );

  useEffect(() => {
    if (user) {
      refreshConversations();

      if (isSupabaseReady) {
        // Subscribe to new messages
        const subscription = supabase
          .channel("messages")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },
            () => {
              refreshConversations();
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    }
  }, [user, isSupabaseReady]);

  const refreshConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (!isSupabaseReady) {
        // Load conversations from localStorage for development
        const storedConversations = localStorage.getItem(
          `uninest_conversations_${user.id}`
        );
        if (storedConversations) {
          const parsed = JSON.parse(storedConversations);
          setConversations(
            parsed.map((conv: any) => ({
              ...conv,
              updatedAt: new Date(conv.updatedAt),
              messages: conv.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
              lastMessage: {
                ...conv.lastMessage,
                timestamp: new Date(conv.lastMessage.timestamp),
              },
            }))
          );
        }
        setIsLoading(false);
        return;
      }

      // Fetch conversations where user is a participant
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select(
            `
          *,
          listings (*),
          participant_1_profile:profiles!conversations_participant_1_fkey (*),
          participant_2_profile:profiles!conversations_participant_2_fkey (*)
        `
          )
          .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
          .order("updated_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch messages for each conversation
      const conversationsWithMessages = await Promise.all(
        conversationsData.map(async (conv) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

          if (messagesError) throw messagesError;

          const messages: Message[] = messagesData.map((msg) => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId:
              conv.participant_1 === msg.sender_id
                ? conv.participant_2
                : conv.participant_1,
            listingId: conv.listing_id,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            read: msg.read,
            type: msg.message_type as "text" | "image" | "system",
          }));

          const otherParticipant =
            conv.participant_1 === user.id
              ? conv.participant_2_profile
              : conv.participant_1_profile;

          const participants: User[] = [
            {
              id: user.id,
              name: user.name,
              email: user.email,
              university: user.university,
              year: user.year,
              bio: user.bio,
              verified: user.verified,
              createdAt: user.createdAt,
            },
            {
              id: otherParticipant.id,
              name: otherParticipant.name,
              email: "", // Email not exposed
              university: otherParticipant.university,
              year: otherParticipant.year,
              bio: otherParticipant.bio,
              verified: otherParticipant.verified,
              createdAt: new Date(otherParticipant.created_at),
            },
          ];

          const listing: Listing = {
            id: conv.listings.id,
            title: conv.listings.title,
            description: conv.listings.description,
            price: conv.listings.price,
            location: conv.listings.location,
            roomType: conv.listings.room_type,
            amenities: conv.listings.amenities,
            images: conv.listings.images,
            availableFrom: new Date(conv.listings.available_from),
            availableTo: conv.listings.available_to
              ? new Date(conv.listings.available_to)
              : undefined,
            maxOccupants: conv.listings.max_occupants,
            hostId: conv.listings.host_id,
            host: participants.find((p) => p.id === conv.listings.host_id)!,
            createdAt: new Date(conv.listings.created_at),
            updatedAt: new Date(conv.listings.updated_at),
            status: conv.listings.status,
            preferences: conv.listings.preferences,
            rules: conv.listings.rules,
            deposit: conv.listings.deposit,
            utilities: conv.listings.utilities,
          };

          const unreadCount = messages.filter(
            (msg) => msg.senderId !== user.id && !msg.read
          ).length;

          const conversation: Conversation = {
            id: conv.id,
            participants,
            listing,
            messages,
            lastMessage: messages[messages.length - 1],
            updatedAt: new Date(conv.updated_at),
            unreadCount,
          };

          return conversation;
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupabaseReady]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user) return;

      if (!isSupabaseReady) {
        // Mock send message for development
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: user.id,
          receiverId:
            conversations
              .find((c) => c.id === conversationId)
              ?.participants.find((p) => p.id !== user.id)?.id || "",
          listingId:
            conversations.find((c) => c.id === conversationId)?.listing.id ||
            "",
          content,
          timestamp: new Date(),
          read: false,
          type: "text",
        };

        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: newMessage,
                updatedAt: new Date(),
              };
            }
            return conv;
          });
          localStorage.setItem(
            `uninest_conversations_${user.id}`,
            JSON.stringify(updated)
          );
          return updated;
        });

        if (activeConversation?.id === conversationId) {
          setActiveConversationState((prev) =>
            prev
              ? {
                  ...prev,
                  messages: [...prev.messages, newMessage],
                  lastMessage: newMessage,
                  updatedAt: new Date(),
                }
              : null
          );
        }
        return;
      }

      try {
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: "text",
          read: false,
        });

        if (error) throw error;

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        await refreshConversations();
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [
      user,
      isSupabaseReady,
      conversations,
      activeConversation,
      refreshConversations,
    ]
  );

  const createConversation = useCallback(
    async (listing: Listing, participant: User): Promise<Conversation> => {
      if (!user) throw new Error("User must be logged in");

      if (!isSupabaseReady) {
        // Mock create conversation for development
        const existingConv = conversations.find(
          (conv) =>
            conv.listing.id === listing.id &&
            conv.participants.some((p) => p.id === participant.id)
        );

        if (existingConv) {
          return existingConv;
        }

        const initialMessage: Message = {
          id: Date.now().toString(),
          senderId: user.id,
          receiverId: participant.id,
          listingId: listing.id,
          content: `Hi! I'm interested in your listing: ${listing.title}`,
          timestamp: new Date(),
          read: false,
          type: "text",
        };

        const newConversation: Conversation = {
          id: Date.now().toString(),
          participants: [user, participant],
          listing,
          messages: [initialMessage],
          lastMessage: initialMessage,
          updatedAt: new Date(),
          unreadCount: 0,
        };

        setConversations((prev) => {
          const updated = [newConversation, ...prev];
          localStorage.setItem(
            `uninest_conversations_${user.id}`,
            JSON.stringify(updated)
          );
          return updated;
        });

        return newConversation;
      }

      try {
        // Check if conversation already exists
        const { data: existingConv, error: checkError } = await supabase
          .from("conversations")
          .select("*")
          .eq("listing_id", listing.id)
          .or(
            `and(participant_1.eq.${user.id},participant_2.eq.${participant.id}),and(participant_1.eq.${participant.id},participant_2.eq.${user.id})`
          )
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existingConv) {
          // Return existing conversation
          const existingConversation = conversations.find(
            (c) => c.id === existingConv.id
          );
          if (existingConversation) {
            return existingConversation;
          }
        }

        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            listing_id: listing.id,
            participant_1: user.id,
            participant_2: participant.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Send initial message
        const initialMessage = `Hi! I'm interested in your listing: ${listing.title}`;
        await supabase.from("messages").insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: initialMessage,
          message_type: "text",
          read: false,
        });

        await refreshConversations();

        const newConversation = conversations.find((c) => c.id === newConv.id);
        if (!newConversation) {
          throw new Error("Failed to create conversation");
        }

        return newConversation;
      } catch (error: any) {
        throw new Error(error.message || "Failed to create conversation");
      }
    },
    [user, isSupabaseReady, conversations, refreshConversations]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;

      if (!isSupabaseReady) {
        // Mock mark as read for development
        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unreadCount: 0,
                messages: conv.messages.map((msg) => ({ ...msg, read: true })),
              };
            }
            return conv;
          });
          localStorage.setItem(
            `uninest_conversations_${user.id}`,
            JSON.stringify(updated)
          );
          return updated;
        });
        return;
      }

      try {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id);

        if (error) throw error;

        await refreshConversations();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    [user, isSupabaseReady, refreshConversations]
  );

  const unreadCount = conversations.reduce(
    (total, conv) => total + conv.unreadCount,
    0
  );

  const value: MessagingContextType = {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    createConversation,
    markAsRead,
    unreadCount,
    isLoading,
    refreshConversations,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
