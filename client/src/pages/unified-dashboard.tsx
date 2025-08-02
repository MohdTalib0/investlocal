import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bell, Plus, MessageSquare, DollarSign, Heart, Eye, Share2, MoreHorizontal, ThumbsUp, MessageCircle, Send } from "lucide-react";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import BottomNavigation from "@/components/bottom-navigation";

import { Post } from "@shared/schema";

export default function UnifiedDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("investment");
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();

  // Fetch posts (investment and community)
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", activeTab],
    queryFn: async () => {
      console.log('Fetching posts for tab:', activeTab);
      const response = await fetch(`/api/posts?postType=${activeTab}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      console.log('Fetched posts:', data);
      
      // Debug: Check each post's author data
      data.forEach((post: any) => {
        console.log(`Post ${post.id}:`, {
          authorId: post.authorId,
          author: post.author,
          authorName: post.author?.fullName || 'No fullName',
          authorEmail: post.author?.email || 'No email',
          allAuthorKeys: post.author ? Object.keys(post.author) : 'No author',
          rawAuthor: JSON.stringify(post.author)
        });
      });
      
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
          console.error(`Failed to fetch likes for post ${post.id}:`, error);
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
          console.error(`Failed to fetch comments for post ${post.id}:`, error);
        }
      }
      return commentsData;
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

  const InvestmentPostCard = ({ post }: { post: Post }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700 hover:border-gray-600"
      onClick={() => setLocation(`/post/${post.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 text-white">{post.title || 'Investment Opportunity'}</CardTitle>
            <CardDescription className="text-sm text-gray-400">
              {post.content.substring(0, 120)}...
            </CardDescription>
          </div>
          <Badge variant="default" className="bg-blue-600">
            Investment
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
         
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{post.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>₹{post.fundingMin?.toLocaleString()}-{post.fundingMax?.toLocaleString()}</span>
            </div>
          </div>
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
        </div>
        {post.category && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
              {post.category}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CommunityPostCard = ({ post }: { post: Post }) => {
    const isLiked = postLikes[post.id]?.some((like: any) => like.userId === user?.id);
    const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : '';
    const comments = postComments[post.id] || [];
    const likeCount = postLikes[post.id]?.length || 0;
    
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
      <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {authorInitial}
              </div>
            </div>
            
            {/* Post Header */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {authorName}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {post.author?.userType === 'entrepreneur' ? 'Entrepreneur' : 'Investor'} • {timeAgo}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-1 gap-2">
                {post.images.map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">📷 Image {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Badge */}
          {post.category && (
            <div className="mb-4">
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300 bg-gray-800">
                {post.category}
              </Badge>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 bg-blue-500 rounded-full border border-gray-900"></div>
                  <div className="w-5 h-5 bg-green-500 rounded-full border border-gray-900"></div>
                  <div className="w-5 h-5 bg-purple-500 rounded-full border border-gray-900"></div>
                </div>
                <span>{likeCount} likes</span>
              </div>
              <span>•</span>
              
              <span>•</span>
              <span>{comments.length} comments</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-2 text-sm ${
                isLiked ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike(post.id);
              }}
              disabled={likeMutation.isPending}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>Like</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                toggleComments(post.id);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                // Handle share
                toast({
                  title: "Share",
                  description: "Share functionality coming soon!",
                });
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                // Handle send
                toast({
                  title: "Send",
                  description: "Send functionality coming soon!",
                });
              }}
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
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
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {commentAuthorInitial}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-blue-400 text-xs font-medium">{commentAuthorName}</p>
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

  if (postsLoading) {
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
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">InvestLocal</h1>
            <p className="text-sm text-gray-400">
              {user?.userType === 'entrepreneur' ? 'Share opportunities' : 'Discover investments'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-gray-800">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </Button>
            <Button 
              onClick={() => setLocation("/create-post")}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </div>
        </div>
      </div>

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

      <BottomNavigation activeTab="home" />
    </div>
  );
}