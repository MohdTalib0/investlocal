import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Bell, Plus, MessageSquare, DollarSign, Heart, Eye, Share2, MoreHorizontal, ThumbsUp, MessageCircle, Send, Copy, Bookmark, Flag, Trash2, Lightbulb } from "lucide-react";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useFirstTimeGuidance } from "@/hooks/use-first-time-guidance";

import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";
import FirstTimeGuidance from "@/components/first-time-guidance";
import { useNotificationContext } from "@/contexts/NotificationContext";

import { Post } from "@shared/schema";

export default function UnifiedDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("investment");
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const { unreadCount, notifications } = useNotificationContext();
  const { shouldShowOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { showGuidance, isLoading: guidanceLoading, markGuidanceSeen, setShowGuidance } = useFirstTimeGuidance();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Helper function to get time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  // Handle onboarding redirect
  useEffect(() => {
    if (shouldShowOnboarding() && !onboardingLoading) {
      setShouldRedirect(true);
    }
  }, [shouldShowOnboarding, onboardingLoading, user, user?.isOnboardingComplete]);

  useEffect(() => {
    if (shouldRedirect) {
      setLocation("/onboarding-wizard");
    }
  }, [shouldRedirect, setLocation]);

  // Fetch posts (investment and community)
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", activeTab],
    queryFn: async () => {
      //console.log('Fetching posts for tab:', activeTab);
      const response = await fetch(`/api/posts?postType=${activeTab}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      //console.log('Fetched posts:', data);
      

      
      return data;
    },
  });

  // Fetch likes for all posts
  const { data: postLikes = {} } = useQuery({
    queryKey: ["post-likes"],
    queryFn: async () => {
      const likesData: { [postId: string]: any[] } = {};
      for (const post of posts) {
        try {
          const response = await fetch(`/api/posts/${post.id}/likes`);
          if (response.ok) {
            likesData[post.id] = await response.json();
          }
        } catch (error) {
          //console.error(`Failed to fetch likes for post ${post.id}:`, error);
        }
      }
      return likesData;
    },
    enabled: posts.length > 0,
  });

  // Fetch comments for posts
  const { data: postComments = {} } = useQuery({
    queryKey: ["post-comments"],
    queryFn: async () => {
      const commentsData: { [postId: string]: any[] } = {};
      for (const post of posts) {
        try {
          const response = await fetch(`/api/posts/${post.id}/comments`);
          if (response.ok) {
            commentsData[post.id] = await response.json();
          }
      } catch (error) {
          //console.error(`Failed to fetch comments for post ${post.id}:`, error);
        }
      }
      return commentsData;
    },
    enabled: posts.length > 0,
  });

  // Fetch interests for posts
  const { data: postInterests = {} } = useQuery({
    queryKey: ["post-interests"],
    queryFn: async () => {
      const interestsData: { [postId: string]: any[] } = {};
      for (const post of posts) {
        try {
          const response = await fetch(`/api/posts/${post.id}/interests`);
          if (response.ok) {
            interestsData[post.id] = await response.json();
          }
        } catch (error) {
          //console.error(`Failed to fetch interests for post ${post.id}:`, error);
        }
      }
      return interestsData;
    },
    enabled: posts.length > 0,
  });

  // Like/Unlike mutations
  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      const token = authService.getToken();
      const method = action === 'like' ? 'POST' : 'DELETE';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed to ${action} post`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-likes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Comment mutations
  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const token = authService.getToken();
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
      setCommentText({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const token = authService.getToken();
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: async (postId: string) => {
      const token = authService.getToken();
      const response = await fetch("/api/interests", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: postId,
          message: "I'm interested in learning more about this investment opportunity.",
        }),
      });
      if (!response.ok) throw new Error('Failed to express interest');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-interests"] });
      toast({
        title: "Interest expressed!",
        description: "The entrepreneur has been notified of your interest.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to express interest",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const categories = ["All", "Tech Startups", "Food & Beverage", "Retail", "Education", "Healthcare", "Manufacturing", "Agriculture", "Services"];

  // Filter function for posts
  const filteredPosts = posts.filter((post: Post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesCategory;
  });

  const handleLike = (postId: string) => {
    const isLiked = postLikes[postId]?.some((like: any) => like.userId === user?.id);
    likeMutation.mutate({ 
      postId, 
      action: isLiked ? 'unlike' : 'like' 
    });
  };

  const handleInterest = (postId: string) => {
    expressInterestMutation.mutate(postId);
  };

  const handleComment = (postId: string) => {
    const content = commentText[postId]?.trim();
    if (!content) return;
    
    commentMutation.mutate({ postId, content });
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Handle share functionality
  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Post from InvestLocal',
        text: post.content.substring(0, 100) + '...',
        url: window.location.origin + `/post/${post.id}`
      }).catch((error) => {
        //console.log('Error sharing:', error);
        // Fallback to copy link
        handleCopyLink(post);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink(post);
    }
  };

  // Handle copy link functionality
  const handleCopyLink = (post: Post) => {
    const postUrl = window.location.origin + `/post/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast({
        title: "Link Copied!",
        description: "Post link has been copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  // Handle send functionality
  const handleSend = (post: Post) => {
    toast({
      title: "Send Post",
      description: `Sending post to your connections...`,
    });
    // TODO: Implement actual send functionality
  };

  // Handle bookmark functionality
  const handleBookmark = (post: Post) => {
    toast({
      title: "Bookmarked!",
      description: "Post has been added to your bookmarks.",
    });
    // TODO: Implement actual bookmark functionality
  };

  // Handle report functionality
  const handleReport = (post: Post) => {
    toast({
      title: "Report Post",
      description: "Thank you for reporting. We'll review this post.",
    });
    // TODO: Implement actual report functionality
  };

  // Handle delete functionality (only for own posts)
  const handleDelete = (post: Post) => {
    if (post.authorId === user?.id) {
      setPostToDelete(post);
      setDeleteDialogOpen(true);
    }
  };

  // Confirm delete function
  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id);
    }
  };

  const InvestmentPostCard = ({ post }: { post: Post }) => {
    const isLiked = postLikes[post.id]?.some((like: any) => like.userId === user?.id);
    const likeCount = postLikes[post.id]?.length || 0;
    const [showFullContent, setShowFullContent] = useState(false);
    
    const shouldTruncate = post.content.length > 150;
    const displayContent = showFullContent ? post.content : post.content.substring(0, 150);
    
    // Get author name from post data or use fallback
    let authorName = 'Anonymous User';
    
    if (post.author?.fullName && post.author.fullName !== '') {
      authorName = post.author.fullName;
    } else if (post.author?.email && post.author.email !== '') {
      authorName = post.author.email.split('@')[0];
    } else if (post.authorId) {
      authorName = `User ${post.authorId.slice(-4)}`;
    }
    
    if (authorName.startsWith('User ') && post.author?.email) {
      const emailName = post.author.email.split('@')[0];
      if (emailName && emailName.length > 0) {
        authorName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }
    
    const authorInitial = authorName.charAt(0).toUpperCase();
    const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : '';

    return (
    <Card 
        className="cursor-pointer hover:shadow-xl transition-all duration-300 bg-gray-900 border-gray-700 hover:border-blue-500/30 hover:bg-gray-800/50"
      onClick={() => setLocation(`/post/${post.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={() => {
                  setLocation(`/user?id=${post.authorId}`);
                }}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg hover:scale-105 transition-transform cursor-pointer shadow-lg"
              >
                {authorInitial}
            </div>
            <div className="flex-1">
              <button
                onClick={() => {
                  setLocation(`/user?id=${post.authorId}`);
                }}
                className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors cursor-pointer"
              >
                {authorName}
              </button>
              <p className="text-gray-400 text-xs">
                {post.author?.userType === 'entrepreneur' ? 'Entrepreneur' : 'Investor'} • {timeAgo}
              </p>
          </div>
            {post.category && (
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {post.category}
          </Badge>
            )}
          </div>
                  <DropdownMenu open={openDropdown === post.id} onOpenChange={(open) => setOpenDropdown(open ? post.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        onClick={() => handleShare(post)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleCopyLink(post)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSend(post)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleBookmark(post)}
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Bookmark
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-600" />
                      {post.authorId === user?.id ? (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(post)}
                          className="text-red-400 hover:bg-gray-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleReport(post)}
                          className="text-red-400 hover:bg-gray-700 cursor-pointer"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
        
        <div className="mt-3">
          <CardTitle className="text-xl mb-2 text-white font-bold">{post.title || 'Investment Opportunity'}</CardTitle>
          <CardDescription className="text-sm text-gray-300 leading-relaxed">
            {displayContent}
            {shouldTruncate && !showFullContent && '...'}
            {shouldTruncate && !showFullContent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullContent(true);
                }}
                className="text-blue-400 hover:text-blue-300 font-medium ml-1 cursor-pointer"
              >
                Show more
              </button>
            )}
            {shouldTruncate && showFullContent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullContent(false);
                }}
                className="text-blue-400 hover:text-blue-300 font-medium ml-1 cursor-pointer"
              >
                Show less
              </button>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-400 mb-4">
          {/* First row: Fund and ROI */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-green-900/30 px-2 py-1 rounded-full border border-green-500/20">
              <DollarSign className="h-3 w-3 text-green-400" />
              <span className="font-medium text-green-300 text-xs">₹{formatAmount(post.fundingMin || 0)}-{formatAmount(post.fundingMax || 0)}</span>
            </div>
            {post.expectedRoi && (
              <div className="flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded-full border border-blue-500/20">
                <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-blue-300 text-xs">{post.expectedRoi} ROI</span>
              </div>
            )}
          </div>
          
          {/* Second row: Team and Timeline */}
          <div className="flex items-center gap-2">
            {post.teamSize && (
              <div className="flex items-center gap-1 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/20">
                <svg className="h-3 w-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="font-medium text-purple-300 text-xs">{post.teamSize} Team</span>
              </div>
            )}
            {post.timeline && (
              <div className="flex items-center gap-1 bg-orange-900/30 px-2 py-1 rounded-full border border-orange-500/20">
                <svg className="h-3 w-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-orange-300 text-xs">{post.timeline}</span>
              </div>
            )}
          </div>
        </div>
              
        {/* Post Images - Collage Style */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4">
            <div 
              className="relative group cursor-pointer rounded-lg overflow-hidden"
              onClick={() => setLocation(`/post/${post.id}`)}
            >
              {post.images.length === 1 && (
                <img 
                  src={post.images[0]} 
                  alt="Post image"
                  className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              
                              {post.images.length === 2 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-full">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
              </div>
                          <p className="text-gray-400 text-xs">Image</p>
            </div>
        </div>
            </div>
                    <div className="relative w-full h-full">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
              </div>
                          <p className="text-gray-400 text-xs">Image</p>
          </div>
        </div>
                    </div>
                  </div>
                )}
              
                              {post.images.length === 3 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-full row-span-2">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[2]} 
                        alt="Post image 3"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.images.length === 4 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[2]} 
                        alt="Post image 3"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[3]} 
                        alt="Post image 4"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.images.length > 4 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[2]} 
                        alt="Post image 3"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32 bg-gray-800 flex items-center justify-center">
                      <img 
                        src={post.images[3]} 
                        alt="Post image 4"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{post.images.length - 4}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              
              {/* Fallback placeholder */}
              <div className="w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center hidden border border-gray-700">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-xs">Investment Preview</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 ${
              isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleLike(post.id);
            }}
            disabled={likeMutation.isPending}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
           className="flex items-center gap-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
             handleInterest(post.id);
           }}
           disabled={expressInterestMutation.isPending}
         >
           <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
           </svg>
           <span className="text-sm font-medium">{postInterests[post.id]?.length || 0}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              handleShare(post);
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark(post);
            }}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  };

  const CommunityPostCard = ({ post }: { post: Post }) => {
    const isLiked = postLikes[post.id]?.some((like: any) => like.userId === user?.id);
    const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : '';
    const comments = postComments[post.id] || [];
    const likeCount = postLikes[post.id]?.length || 0;
    const [showFullContent, setShowFullContent] = useState(false);
    
    const shouldTruncate = post.content.length > 150;
    const displayContent = showFullContent ? post.content : post.content.substring(0, 150);
    
    // Get author name from post data or use fallback
    let authorName = 'Anonymous User';
    
    // Try multiple ways to get the author name
    if (post.author?.fullName && post.author.fullName !== '') {
      authorName = post.author.fullName;
    } else if (post.author?.email && post.author.email !== '') {
      authorName = post.author.email.split('@')[0];
    } else if (post.authorId) {
      authorName = `User ${post.authorId.slice(-4)}`;
    }
    
    // If we still have a generic name, try to extract from email
    if (authorName.startsWith('User ') && post.author?.email) {
      const emailName = post.author.email.split('@')[0];
      if (emailName && emailName.length > 0) {
        authorName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }
    
    const authorInitial = authorName.charAt(0).toUpperCase();

    return (
      <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => setLocation(`/user?id=${post.authorId}`)}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg hover:scale-105 transition-transform cursor-pointer"
              >
                {authorInitial}
              </button>
            </div>
            
            {/* Post Header */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <button 
                    onClick={() => setLocation(`/user?id=${post.authorId}`)}
                    className="text-white font-semibold text-base hover:text-blue-400 transition-colors cursor-pointer text-left"
                  >
                    {authorName}
                  </button>
                  <p className="text-gray-400 text-sm">
                    {post.author?.userType === 'entrepreneur' ? 'Entrepreneur' : 'Investor'} • {timeAgo}
                  </p>
                </div>
                {post.category && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    {post.category}
                  </Badge>
                )}
                <DropdownMenu open={openDropdown === post.id} onOpenChange={(open) => setOpenDropdown(open ? post.id : null)}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                    <DropdownMenuItem 
                      onClick={() => handleShare(post)}
                      className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleCopyLink(post)}
                      className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleSend(post)}
                      className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBookmark(post)}
                      className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      Bookmark
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    {post.authorId === user?.id ? (
                      <DropdownMenuItem 
                        onClick={() => handleDelete(post)}
                        className="text-red-400 hover:bg-gray-700 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => handleReport(post)}
                        className="text-red-400 hover:bg-gray-700 cursor-pointer"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {displayContent}
              {shouldTruncate && !showFullContent && '...'}
              {shouldTruncate && !showFullContent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullContent(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium ml-1 cursor-pointer"
                >
                  Show more
                </button>
              )}
              {shouldTruncate && showFullContent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullContent(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium ml-1 cursor-pointer"
                >
                  Show less
                </button>
              )}
            </p>
          </div>

          {/* Post Images - Collage Style */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4">
              <div 
                className="relative group cursor-pointer rounded-lg overflow-hidden"
                onClick={() => setLocation(`/post/${post.id}`)}
              >
                {post.images.length === 1 && (
                  <img 
                    src={post.images[0]} 
                    alt="Post image"
                    className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                )}
                
                {post.images.length === 2 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-full">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                  </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-full">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.images.length === 3 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-full row-span-2">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[2]} 
                        alt="Post image 3"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.images.length === 4 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[2]} 
                        alt="Post image 3"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[3]} 
                        alt="Post image 4"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {post.images.length > 4 && (
                  <div className="grid grid-cols-2 gap-1 h-64">
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[0]} 
                        alt="Post image 1"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[1]} 
                        alt="Post image 2"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32">
                      <img 
                        src={post.images[2]} 
                        alt="Post image 3"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-32 bg-gray-800 flex items-center justify-center">
                      <img 
                        src={post.images[3]} 
                        alt="Post image 4"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{post.images.length - 4}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center hidden border border-gray-700">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fallback placeholder */}
                <div className="w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center hidden border border-gray-700">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-xs">Post Preview</p>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Engagement Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
                <div className="flex -space-x-1 mr-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border border-gray-900"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full border border-gray-900"></div>
                  <div className="w-4 h-4 bg-purple-500 rounded-full border border-gray-900"></div>
                </div>
                <span className="font-medium">{likeCount} likes</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
                <MessageCircle className="h-4 w-4 text-blue-400" />
                <span className="font-medium">{comments.length} comments</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
                isLiked ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike(post.id);
              }}
              disabled={likeMutation.isPending}
            >
              <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                toggleComments(post.id);
              }}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleShare(post);
              }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center justify-center text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleSend(post);
              }}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* Comments Section */}
          {showComments[post.id] && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              {/* Comment Input */}
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Write a comment..."
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText(prev => ({
                    ...prev,
                    [post.id]: e.target.value
                  }))}
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment(post.id);
                    }
                  }}
                />
                <Button
                  onClick={() => handleComment(post.id)}
                  disabled={!commentText[post.id]?.trim() || commentMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Post
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment: any) => {
                  const commentAuthorName = comment.user?.fullName || `User ${comment.userId?.slice(-4)}` || 'Anonymous';
                  const commentAuthorInitial = commentAuthorName.charAt(0).toUpperCase();
                  
                  return (
                    <div key={comment.id} className="flex space-x-3">
                      <button 
                        onClick={() => setLocation(`/user?id=${comment.userId}`)}
                        className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:scale-105 transition-transform cursor-pointer"
                      >
                        {commentAuthorInitial}
                      </button>
                      <div className="flex-1">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <button 
                              onClick={() => setLocation(`/user?id=${comment.userId}`)}
                              className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {commentAuthorName}
                            </button>
                            <p className="text-gray-500 text-xs">
                              {getTimeAgo(new Date(comment.createdAt))}
                            </p>
                          </div>
                          <p className="text-white text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {comments.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (postsLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Logo size="md" />
            <p className="text-xs mt-1 text-yellow-600">
              {user?.userType === 'entrepreneur' ? 'Share opportunities' : 'Discover investments'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGuidance(true)}
              className="text-white hover:bg-blue-500/20"
              title="Show Tips & Guidance"
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-white hover:bg-blue-500/20"
                >
              <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
              </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-gray-900 border-gray-700 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="text-white font-semibold">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-400 text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.slice(0, 5).map((notification) => {
                      // Determine icon and navigation based on notification type
                      let icon, bgColor, textColor, onClickHandler;
                      
                      if (notification.type === 'new_message') {
                        icon = <MessageSquare className="h-4 w-4 text-blue-400" />;
                        bgColor = "bg-blue-600/20";
                        textColor = "text-blue-400";
                        onClickHandler = () => setLocation(`/chat/${notification.senderId}`);
                      } else if (notification.type === 'post_liked') {
                        icon = <Heart className="h-4 w-4 text-red-400" />;
                        bgColor = "bg-red-600/20";
                        textColor = "text-red-400";
                        onClickHandler = () => setLocation(`/post/${notification.postId}`);
                      } else if (notification.type === 'post_commented') {
                        icon = <MessageCircle className="h-4 w-4 text-green-400" />;
                        bgColor = "bg-green-600/20";
                        textColor = "text-green-400";
                        onClickHandler = () => setLocation(`/post/${notification.postId}`);
                      } else {
                        // Default to message icon
                        icon = <MessageSquare className="h-4 w-4 text-blue-400" />;
                        bgColor = "bg-blue-600/20";
                        textColor = "text-blue-400";
                        onClickHandler = () => setLocation(`/chat/${notification.senderId}`);
                      }
                      
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex items-start space-x-3 p-3 hover:bg-gray-800 cursor-pointer"
                          onClick={onClickHandler}
                        >
                          <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {notification.senderName}
                            </p>
                            <p className="text-gray-400 text-xs truncate">
                              {notification.content}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {getTimeAgo(new Date(notification.timestamp))}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    {notifications.length > 5 && (
                      <div className="p-2 border-t border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-blue-400 hover:text-blue-300"
                          onClick={() => setLocation("/chat")}
                        >
                          View all notifications
            </Button>
                      </div>
                    )}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={() => setLocation("/create-post")}
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Post
            </Button>
          </div>
        </div>
      </div>

      {/* First Time Guidance */}
      <FirstTimeGuidance 
        onClose={markGuidanceSeen}
        isVisible={showGuidance && !shouldShowOnboarding() && !shouldRedirect && !guidanceLoading}
      />

      {/* Category Filter */}
        <div className="px-6 py-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="All" className="text-white hover:bg-gray-800">All Categories</SelectItem>
            {categories.slice(1).map((category) => (
              <SelectItem key={category} value={category} className="text-white hover:bg-gray-800">
              {category}
              </SelectItem>
          ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-700">
            <TabsTrigger value="investment" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              Investment
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investment" className="space-y-4 mt-4">
            <p className="text-sm text-gray-400">
              Discover investment opportunities from local entrepreneurs
            </p>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No investment opportunities found</p>
                {user?.userType === 'entrepreneur' && (
                  <Button onClick={() => setLocation("/create-post")} className="bg-blue-600 hover:bg-blue-700">
                    Create Investment Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post: Post) => (
                  <InvestmentPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-4 mt-4">
            <p className="text-sm text-gray-400">
              Join community discussions and share insights
            </p>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No community posts found</p>
                <Button onClick={() => setLocation("/create-post")} className="bg-blue-600 hover:bg-blue-700">
                  Create Community Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post: Post) => (
                  <CommunityPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation activeTab="home" />
    </div>
  );
}