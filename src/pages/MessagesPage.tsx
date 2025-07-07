import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  Search,
  MoreVertical,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
} from "lucide-react";
import { useMessaging } from "../contexts/MessagingContext";
import { useAuth } from "../contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    markAsRead,
    isLoading,
  } = useMessaging();
  const location = useLocation();

  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Handle active conversation from navigation state (e.g., when routed from ListingDetailPage)
    if (location.state?.activeConversation) {
      setActiveConversation(location.state.activeConversation);
    }
  }, [location.state, setActiveConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or active conversation changes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages]);

  useEffect(() => {
    // Mark conversation as read when it becomes the active conversation
    if (activeConversation) {
      markAsRead(activeConversation.id);
      // Auto-focus message input when conversation becomes active
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }
  }, [activeConversation, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation || isSending) return;

    const messageToSend = messageText.trim();
    setMessageText(""); // Clear input immediately for better UX
    setIsSending(true);

    try {
      await sendMessage(activeConversation.id, messageToSend);
      // Keep focus on input for continuous messaging
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message text on error
      setMessageText(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm"); // e.g., 14:35
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d"); // e.g., Jul 5
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants.find((p) => p.id !== user?.id);
    return (
      conv.listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (otherUser?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const otherParticipant = activeConversation?.participants.find(
    (p) => p.id !== user?.id
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations List (Sidebar) */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${
          isMobileView && activeConversation ? "hidden md:flex" : "flex" // Hide list on mobile if active chat is open
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {/* Loading skeleton */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">
                Start Browse listings to connect with hosts
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => {
                const otherUser = conversation.participants.find(
                  (p) => p.id !== user?.id
                );
                const isActive = activeConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setActiveConversation(conversation);
                      setIsMobileView(true); // Switch to mobile chat view
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      isActive ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`Conversation with ${otherUser?.name} about ${conversation.listing.title}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {otherUser?.name.charAt(0) || "?"}
                          </span>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {conversation.unreadCount > 9
                                ? "9+"
                                : conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`text-sm font-medium truncate ${
                              conversation.unreadCount > 0
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {otherUser?.name || "Unknown User"}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {conversation.lastMessage
                              ? formatMessageTime(
                                  conversation.lastMessage.timestamp
                                )
                              : ""}
                          </span>
                        </div>

                        <p className="text-xs text-blue-600 mb-1 truncate font-medium">
                          {conversation.listing.title}
                        </p>

                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm truncate flex-1 ${
                              conversation.unreadCount > 0
                                ? "text-gray-900 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {conversation.lastMessage?.content ||
                              "No messages yet."}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          !activeConversation ? "hidden md:flex" : "flex" // Hide chat area on mobile if no active chat
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setIsMobileView(false); // Switch back to mobile list view
                    setActiveConversation(null); // Clear active conversation
                  }}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {otherParticipant?.name.charAt(0) || "?"}
                  </span>
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    {otherParticipant?.name || "Unknown User"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeConversation.listing.title}
                  </p>
                </div>
              </div>

              <button
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activeConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start the conversation
                    </h3>
                    <p className="text-gray-600">
                      Send a message to get the conversation started
                    </p>
                  </div>
                </div>
              ) : (
                activeConversation.messages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const prevMessage = activeConversation.messages[index - 1];
                  const showTimestamp =
                    !prevMessage ||
                    message.timestamp.getTime() -
                      prevMessage.timestamp.getTime() >
                      5 * 60 * 1000; // 5 minutes

                  return (
                    <div key={message.id}>
                      {showTimestamp && (
                        <div className="flex justify-center mb-4">
                          <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                            {isToday(message.timestamp)
                              ? format(message.timestamp, "HH:mm")
                              : isYesterday(message.timestamp)
                              ? `Yesterday ${format(
                                  message.timestamp,
                                  "HH:mm"
                                )}`
                              : format(message.timestamp, "MMM d, HH:mm")}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        } mb-2`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                            isOwn
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <div
                            className={`flex items-center justify-end mt-1 space-x-1 ${
                              isOwn ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            <span className="text-xs">
                              {format(message.timestamp, "HH:mm")}
                            </span>
                            {isOwn && (
                              <div className="flex items-center">
                                {message.read ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end space-x-3"
              >
                <textarea
                  ref={messageInputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                  rows={1}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[48px] max-h-32 overflow-y-auto"
                  aria-label="Message input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  onInput={(e) => {
                    // Auto-resize textarea based on content
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(
                      target.scrollHeight,
                      128
                    )}px`;
                  }}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px] flex-shrink-0"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
              {messageText.trim() && (
                <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
