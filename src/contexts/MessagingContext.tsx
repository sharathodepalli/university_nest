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
          try {
            const parsed = JSON.parse(storedConversations);
            setConversations(
              parsed.map((conv: any) => ({
                ...conv,
                updatedAt: new Date(conv.updatedAt),
                messages: conv.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                })),
                lastMessage: conv.lastMessage
                  ? {
                      ...conv.lastMessage,
                      timestamp: new Date(conv.lastMessage.timestamp),
                    }
                  : undefined,
              }))
            );
          } catch (parseError) {
            console.error("Failed to parse stored conversations:", parseError);
            setConversations([]);
          }
        } else {
          setConversations([]);
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

      if (conversationsError) {
        console.error("Failed to fetch conversations:", conversationsError);
        setConversations([]);
        return;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        return;
      }

      // Fetch messages for each conversation
      const conversationsWithMessages = await Promise.all(
        conversationsData.map(async (conv) => {
          try {
            const { data: messagesData, error: messagesError } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: true });

            if (messagesError) {
              console.error(
                `Failed to fetch messages for conversation ${conv.id}:`,
                messagesError
              );
              return null;
            }

            const messages: Message[] = (messagesData || []).map((msg) => ({
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

            if (!otherParticipant) {
              console.error(
                `Missing participant profile for conversation ${conv.id}`
              );
              return null;
            }

            const participants: User[] = [
              {
                id: user.id,
                name: user.name,
                email: user.email,
                university: user.university,
                year: user.year,
                bio: user.bio,
                verified: user.verified, // Keep legacy field for backward compatibility
                student_verified: user.student_verified,
                student_email: user.student_email,
                verification_status: user.verification_status,
                verification_method: user.verification_method,
                verified_at: user.verified_at,
                createdAt: user.createdAt,
              },
              {
                id: otherParticipant.id,
                name: otherParticipant.name,
                email: "", // Email not exposed
                university: otherParticipant.university,
                year: otherParticipant.year,
                bio: otherParticipant.bio,
                verified: otherParticipant.verified, // Keep legacy field for backward compatibility
                student_verified: otherParticipant.student_verified,
                student_email: otherParticipant.student_email,
                verification_status: otherParticipant.verification_status,
                verification_method: otherParticipant.verification_method,
                verified_at: otherParticipant.verified_at,
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
          } catch (error) {
            console.error(`Error processing conversation ${conv.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null conversations (failed to load)
      const validConversations = conversationsWithMessages.filter(
        (conv): conv is Conversation => conv !== null
      );

      setConversations(validConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupabaseReady]);

  // Real-time message handler for instant updates
  const handleNewMessageRealTime = useCallback(
    (messageData: any) => {
      if (!user) return;

      const conversationId = messageData.conversation_id;
      const newMessage: Message = {
        id: messageData.id,
        senderId: messageData.sender_id,
        receiverId: messageData.receiver_id || "",
        listingId: messageData.listing_id || "",
        content: messageData.content,
        timestamp: new Date(messageData.created_at),
        read: messageData.read,
        type: messageData.message_type as "text" | "image" | "system",
      };

      console.log("[MessagingContext] Processing new message:", newMessage);

      // Update conversations state with new message
      setConversations((prev) => {
        const existingConvIndex = prev.findIndex(
          (c) => c.id === conversationId
        );

        if (existingConvIndex === -1) {
          // If conversation doesn't exist, we'll need to refresh to get it
          console.log(
            "[MessagingContext] Conversation not found, triggering refresh..."
          );
          // Use a timeout to avoid immediate state updates
          setTimeout(() => {
            refreshConversations();
          }, 500);
          return prev;
        }

        const updatedConversations = [...prev];
        const existingConv = updatedConversations[existingConvIndex];

        // Check if message already exists or is an optimistic message being replaced
        const existingMessageIndex = existingConv.messages.findIndex(
          (m) =>
            m.id === newMessage.id ||
            (m.content === newMessage.content &&
              m.senderId === newMessage.senderId &&
              Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) <
                5000)
        );

        if (existingMessageIndex !== -1) {
          // Replace existing/optimistic message with real one
          const updatedMessages = [...existingConv.messages];
          updatedMessages[existingMessageIndex] = newMessage;

          const updatedConv = {
            ...existingConv,
            messages: updatedMessages,
            lastMessage: newMessage,
            unreadCount:
              messageData.sender_id !== user.id
                ? existingConv.unreadCount +
                  (existingConv.messages[existingMessageIndex].senderId ===
                  user.id
                    ? 1
                    : 0)
                : existingConv.unreadCount,
            updatedAt: new Date(messageData.created_at),
          };

          updatedConversations[existingConvIndex] = updatedConv;
        } else {
          // Add new message
          const updatedConv = {
            ...existingConv,
            messages: [...existingConv.messages, newMessage],
            lastMessage: newMessage,
            unreadCount:
              messageData.sender_id !== user.id
                ? existingConv.unreadCount + 1
                : existingConv.unreadCount,
            updatedAt: new Date(messageData.created_at),
          };

          updatedConversations[existingConvIndex] = updatedConv;
        }

        // Sort conversations by latest activity
        updatedConversations.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );

        // Store in localStorage for development mode
        if (!isSupabaseReady) {
          localStorage.setItem(
            `uninest_conversations_${user.id}`,
            JSON.stringify(updatedConversations)
          );
        }

        console.log(
          "[MessagingContext] Conversations updated with new message"
        );
        return updatedConversations;
      });

      // Update active conversation if it matches
      setActiveConversationState((prev) => {
        if (!prev || prev.id !== conversationId) return prev;

        // Check if message already exists or is replacing an optimistic message
        const existingMessageIndex = prev.messages.findIndex(
          (m) =>
            m.id === newMessage.id ||
            (m.content === newMessage.content &&
              m.senderId === newMessage.senderId &&
              Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) <
                5000)
        );

        if (existingMessageIndex !== -1) {
          // Replace existing/optimistic message
          const updatedMessages = [...prev.messages];
          updatedMessages[existingMessageIndex] = newMessage;

          return {
            ...prev,
            messages: updatedMessages,
            lastMessage: newMessage,
            updatedAt: new Date(messageData.created_at),
          };
        } else {
          // Add new message
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: newMessage,
            updatedAt: new Date(messageData.created_at),
          };
        }
      });
    },
    [user, isSupabaseReady, refreshConversations]
  );

  // Real-time message update handler (for read status, etc.)
  const handleMessageUpdateRealTime = useCallback(
    (messageData: any) => {
      if (!user) return;

      const conversationId = messageData.conversation_id;

      console.log("[MessagingContext] Processing message update:", messageData);

      // Update conversations state
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageData.id
                  ? { ...msg, read: messageData.read }
                  : msg
              ),
            };
          }
          return conv;
        })
      );

      // Update active conversation if it matches
      setActiveConversationState((prev) =>
        prev && prev.id === conversationId
          ? {
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === messageData.id
                  ? { ...msg, read: messageData.read }
                  : msg
              ),
            }
          : prev
      );
    },
    [user]
  );

  // Initial load effect
  useEffect(() => {
    if (user) {
      refreshConversations();
    }
  }, [user, refreshConversations]);

  // Real-time subscriptions effect (separate to avoid circular dependencies)
  useEffect(() => {
    if (!user || !isSupabaseReady) return;

    console.log(
      "[MessagingContext] Setting up real-time subscriptions for user:",
      user.id
    );

    // Subscribe to all messages (simpler approach)
    const messageSubscription = supabase
      .channel(`user-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("[MessagingContext] New message received:", payload);
          handleNewMessageRealTime(payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("[MessagingContext] Message updated:", payload);
          handleMessageUpdateRealTime(payload.new);
        }
      )
      .subscribe();

    return () => {
      console.log("[MessagingContext] Cleaning up real-time subscriptions");
      messageSubscription.unsubscribe();
    };
  }, [
    user,
    isSupabaseReady,
    handleMessageUpdateRealTime,
    handleNewMessageRealTime,
  ]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user) return;

      // Generate optimistic message ID for instant UI update
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      const timestamp = new Date();

      // Create optimistic message for instant UI update
      const optimisticMessage: Message = {
        id: optimisticId,
        senderId: user.id,
        receiverId:
          conversations
            .find((c) => c.id === conversationId)
            ?.participants.find((p) => p.id !== user.id)?.id || "",
        listingId:
          conversations.find((c) => c.id === conversationId)?.listing.id || "",
        content,
        timestamp,
        read: false,
        type: "text",
      };

      // Instantly update UI with optimistic message
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, optimisticMessage],
              lastMessage: optimisticMessage,
              updatedAt: timestamp,
            };
          }
          return conv;
        });

        if (!isSupabaseReady) {
          localStorage.setItem(
            `uninest_conversations_${user.id}`,
            JSON.stringify(updated)
          );
        }

        return updated;
      });

      // Also update active conversation instantly
      if (activeConversation?.id === conversationId) {
        setActiveConversationState((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, optimisticMessage],
                lastMessage: optimisticMessage,
                updatedAt: timestamp,
              }
            : null
        );
      }

      if (!isSupabaseReady) {
        return; // In development mode, stop here
      }

      try {
        // Send message to database
        const { data: insertedMessage, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
            message_type: "text",
            read: false,
          })
          .select()
          .single();

        if (error) throw error;

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        // Replace optimistic message with real message ID
        const realMessage: Message = {
          ...optimisticMessage,
          id: insertedMessage.id,
          timestamp: new Date(insertedMessage.created_at),
        };

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === optimisticId ? realMessage : msg
                ),
                lastMessage: realMessage,
              };
            }
            return conv;
          })
        );

        if (activeConversation?.id === conversationId) {
          setActiveConversationState((prev) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.map((msg) =>
                    msg.id === optimisticId ? realMessage : msg
                  ),
                  lastMessage: realMessage,
                }
              : null
          );
        }
      } catch (error) {
        console.error("Error sending message:", error);

        // Remove optimistic message on error
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              const filteredMessages = conv.messages.filter(
                (msg) => msg.id !== optimisticId
              );
              return {
                ...conv,
                messages: filteredMessages,
                lastMessage: filteredMessages[filteredMessages.length - 1],
              };
            }
            return conv;
          })
        );

        if (activeConversation?.id === conversationId) {
          setActiveConversationState((prev) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.filter(
                    (msg) => msg.id !== optimisticId
                  ),
                }
              : null
          );
        }
      }
    },
    [user, isSupabaseReady, conversations, activeConversation]
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
