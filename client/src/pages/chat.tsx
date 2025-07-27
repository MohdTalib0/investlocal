import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, MoreVertical, Paperclip, Smile, Send, Download, FileText } from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  id: string;
  fullName: string;
  avatar?: string;
  userType: string;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getUser();
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(params.userId || null);

  const { register, handleSubmit, reset, watch } = useForm<{ message: string }>({
    defaultValues: { message: "" }
  });

  // Fetch conversations list
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/messages/conversations");
      return response.json();
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const response = await authenticatedApiRequest("GET", `/api/messages/${selectedUserId}`);
      return response.json();
    },
    enabled: !!selectedUserId,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!selectedUserId) throw new Error("No user selected");
      const response = await authenticatedApiRequest("POST", "/api/messages", {
        receiverId: selectedUserId,
        content: data.message,
      });
      return response.json();
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async (userId: string) => {
      const response = await authenticatedApiRequest("PUT", `/api/messages/${userId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (selectedUserId && messages.length > 0) {
      markAsRead.mutate(selectedUserId);
    }
  }, [selectedUserId, messages.length]);

  const onSubmit = (data: { message: string }) => {
    if (!data.message.trim()) return;
    sendMessage.mutate(data);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // If no user is selected, show conversations list
  if (!selectedUserId) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 pt-12 pb-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Messages</h2>
              <p className="text-sm text-neutral-500">Your conversations</p>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="px-6 py-4">
          {isLoadingConversations ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-4 bg-white rounded-xl animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No conversations yet</h3>
              <p className="text-neutral-600">Start by expressing interest in opportunities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation: Conversation) => (
                <div
                  key={conversation.user.id}
                  className="flex items-center space-x-3 p-4 bg-white rounded-xl cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedUserId(conversation.user.id);
                    setLocation(`/chat/${conversation.user.id}`);
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {conversation.user.avatar ? (
                      <img 
                        src={conversation.user.avatar} 
                        alt={conversation.user.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-primary">
                        {conversation.user.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-neutral-900">
                        {conversation.user.fullName}
                      </h3>
                      <span className="text-xs text-neutral-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-600 line-clamp-1">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Find the selected user from conversations
  const selectedUser = conversations.find((conv: Conversation) => conv.user.id === selectedUserId)?.user;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-12 pb-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setSelectedUserId(null);
              setLocation("/chat");
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {selectedUser?.avatar ? (
              <img 
                src={selectedUser.avatar} 
                alt={selectedUser.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-semibold text-primary">
                {selectedUser?.fullName?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">
              {selectedUser?.fullName || "User"}
            </h3>
            <p className="text-sm text-neutral-500">
              {selectedUser?.userType === 'entrepreneur' ? 'Entrepreneur' : 'Investor'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="bg-gray-200 rounded-2xl px-4 py-3 max-w-xs animate-pulse">
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Start the conversation</h3>
            <p className="text-neutral-600">Send your first message to get started</p>
          </div>
        ) : (
          <>
            {/* Date Separator */}
            <div className="text-center">
              <span className="bg-neutral-100 text-neutral-500 text-xs px-3 py-1 rounded-full">
                {messages.length > 0 && formatDate(messages[0].createdAt)}
              </span>
            </div>

            {messages.map((message: Message) => {
              const isFromCurrentUser = message.senderId === currentUser?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    isFromCurrentUser ? "justify-end" : ""
                  }`}
                >
                  {!isFromCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                      {selectedUser?.fullName?.charAt(0) || "U"}
                    </div>
                  )}
                  
                  <div className="flex-1 max-w-xs">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isFromCurrentUser
                          ? "bg-primary text-white rounded-tr-md ml-auto"
                          : "bg-neutral-100 text-neutral-900 rounded-tl-md"
                      }`}
                    >
                      {message.messageType === "file" && message.fileUrl ? (
                        <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-lg border">
                          <FileText className="h-5 w-5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Document</p>
                            <p className="text-xs opacity-75">Click to download</p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    <p
                      className={`text-xs text-neutral-500 mt-1 ${
                        isFromCurrentUser ? "text-right mr-3" : "ml-3"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-3">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center bg-neutral-100 rounded-full px-4 py-2">
            <Input
              {...register("message")}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0"
              autoComplete="off"
            />
            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            type="submit" 
            size="icon"
            className="rounded-full"
            disabled={!watch("message")?.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
