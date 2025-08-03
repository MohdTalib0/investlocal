import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Phone, MoreVertical, Paperclip, Smile, Send, Download, FileText, User, Flag, Ban, Volume2, VolumeX, Image, File, PhoneCall, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";

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
  const { clearNotifications } = useNotificationContext();
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(params.userId || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Clear notifications for this conversation
      clearNotifications(selectedUserId);
    }
  }, [selectedUserId, messages.length, clearNotifications]);

  const onSubmit = (data: { message: string }) => {
    if (!data.message.trim()) return;
    sendMessage.mutate(data);
  };

  const handleViewProfile = () => {
    if (selectedUserId) {
      setLocation(`/user?id=${selectedUserId}`);
    }
  };

  const handleReportUser = () => {
    toast({
      title: "Report User",
      description: "Report functionality will be implemented soon.",
      variant: "default",
    });
  };

  const handleBlockUser = () => {
    toast({
      title: "Block User",
      description: "Block functionality will be implemented soon.",
      variant: "default",
    });
  };

  const handleMuteNotifications = () => {
    toast({
      title: "Mute Notifications",
      description: "Notification mute functionality will be implemented soon.",
      variant: "default",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} is ready to send`,
        variant: "default",
      });
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = watch("message") || "";
    const newMessage = currentMessage + emoji;
    reset({ message: newMessage });
    setIsEmojiPickerOpen(false);
  };

  const handleSendFile = () => {
    if (selectedFile) {
      // For now, just show a toast. In a real app, you'd upload the file
      toast({
        title: "File Upload",
        description: `File upload functionality will be implemented soon. Selected: ${selectedFile.name}`,
        variant: "default",
      });
      setSelectedFile(null);
    }
  };

  const handleStartCall = () => {
    setIsCallActive(true);
    toast({
      title: "Call Started",
      description: `Calling ${selectedUser?.fullName || "User"}...`,
      variant: "default",
    });
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    toast({
      title: "Call Ended",
      description: "Call has been ended",
      variant: "default",
    });
  };

  const handleAnswerCall = () => {
    setIsIncomingCall(false);
    setIsCallActive(true);
    toast({
      title: "Call Answered",
      description: "Call connected",
      variant: "default",
    });
  };

  const handleRejectCall = () => {
    setIsIncomingCall(false);
    toast({
      title: "Call Rejected",
      description: "Call was rejected",
      variant: "default",
    });
  };

  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧",
    "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
    "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "💀",
    "☠️", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽"
  ];

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
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 pt-12 pb-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">Messages</h2>
              <p className="text-sm text-gray-400">Your conversations</p>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="px-6 py-4">
          {isLoadingConversations ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-4 bg-gray-900 rounded-xl animate-pulse">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
              <p className="text-gray-400">Start by expressing interest in opportunities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation: Conversation) => (
                <div
                  key={conversation.user.id}
                  className="flex items-center space-x-3 p-4 bg-gray-900 rounded-xl cursor-pointer hover:bg-gray-800"
                  onClick={() => {
                    setSelectedUserId(conversation.user.id);
                    setLocation(`/chat/${conversation.user.id}`);
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                    {conversation.user.avatar ? (
                      <img 
                        src={conversation.user.avatar} 
                        alt={conversation.user.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-blue-400">
                        {conversation.user.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white">
                        {conversation.user.fullName}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 line-clamp-1">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
    <div className="min-h-screen bg-black flex flex-col pb-20">
      {/* Chat Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 pt-12 pb-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setSelectedUserId(null);
              setLocation("/chat");
            }}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
            {selectedUser?.avatar ? (
              <img 
                src={selectedUser.avatar} 
                alt={selectedUser.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-semibold text-blue-400">
                {selectedUser?.fullName?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">
              {selectedUser?.fullName || "User"}
            </h3>
            <p className="text-sm text-gray-400">
              {selectedUser?.userType === 'entrepreneur' ? 'Entrepreneur' : 'Investor'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-gray-800"
              onClick={handleStartCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
                <DropdownMenuItem
                  onClick={handleViewProfile}
                  className="text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleMuteNotifications}
                  className="text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  <VolumeX className="h-4 w-4 mr-2" />
                  Mute Notifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleReportUser}
                  className="text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleBlockUser}
                  className="text-red-400 hover:bg-gray-800 cursor-pointer"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Call Interface Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
            {/* Call Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                {selectedUser?.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-blue-400">
                    {selectedUser?.fullName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedUser?.fullName || "User"}
              </h3>
              <p className="text-gray-400">Call in progress...</p>
            </div>

            {/* Call Controls */}
            <div className="flex justify-center space-x-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                className={`w-12 h-12 rounded-full ${
                  isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`w-12 h-12 rounded-full ${
                  !isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}
              </Button>
            </div>

            {/* End Call Button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Overlay */}
      {isIncomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                {selectedUser?.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-blue-400">
                    {selectedUser?.fullName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedUser?.fullName || "User"}
              </h3>
              <p className="text-gray-400 mb-6">Incoming call...</p>
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700"
                  onClick={handleAnswerCall}
                >
                  <PhoneCall className="h-6 w-6 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                  onClick={handleRejectCall}
                >
                  <PhoneOff className="h-6 w-6 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="bg-gray-700 rounded-2xl px-4 py-3 max-w-xs animate-pulse">
                  <div className="h-4 bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-white mb-2">Start the conversation</h3>
            <p className="text-gray-400">Send your first message to get started</p>
          </div>
        ) : (
          <>
            {/* Date Separator */}
            <div className="text-center">
              <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
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
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm flex-shrink-0 text-blue-400">
                      {selectedUser?.fullName?.charAt(0) || "U"}
                    </div>
                  )}
                  
                  <div className="flex-1 max-w-xs">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isFromCurrentUser
                          ? "bg-blue-600 text-white rounded-tr-md ml-auto"
                          : "bg-gray-800 text-white rounded-tl-md"
                      }`}
                    >
                      {message.messageType === "file" && message.fileUrl ? (
                        <div className="flex items-center space-x-3 p-3 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
                          <FileText className="h-5 w-5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Document</p>
                            <p className="text-xs opacity-75">Click to download</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-600">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    <p
                      className={`text-xs text-gray-400 mt-1 ${
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
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        {/* Selected file preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSendFile}
                  className="text-green-400 hover:bg-green-400/20"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-400 hover:bg-red-400/20"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-3">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-gray-800"
            onClick={handleFileUpload}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 flex items-center bg-gray-800 rounded-full px-4 py-2">
            <Input
              {...register("message")}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none focus-visible:ring-0 text-white placeholder:text-gray-400"
              autoComplete="off"
            />
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                align="end" 
                className="w-80 h-64 bg-gray-900 border-gray-700 p-4 overflow-y-auto"
              >
                <div className="grid grid-cols-10 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 text-xl hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            type="submit" 
            size="icon"
            className="rounded-full bg-blue-600 hover:bg-blue-700"
            disabled={(!watch("message")?.trim() && !selectedFile) || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      <BottomNavigation activeTab="chat" />
    </div>
  );
}
