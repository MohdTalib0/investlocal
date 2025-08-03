import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Share2, Bookmark, MoreHorizontal, ThumbsUp, MessageCircle, Send, Copy, Flag, Trash2, Heart, ChevronLeft, ChevronRight, X } from "lucide-react";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import { Post } from "@shared/schema";

export default function PostDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch post details
  const { data: post, isLoading } = useQuery({
    queryKey: ["/api/posts", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch post");
      return response.json();
    },
  });

  // Fetch likes for the post
  const { data: postLikes = [] } = useQuery({
    queryKey: ["post-likes", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${params.id}/likes`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!params.id,
  });

  // Fetch comments for the post
  const { data: comments = [] } = useQuery({
    queryKey: ["post-comments", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${params.id}/comments`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!params.id,
  });

  // Fetch interests for the post
  const { data: postInterests = [] } = useQuery({
    queryKey: ["post-interests", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${params.id}/interests`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!params.id,
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
      queryClient.invalidateQueries({ queryKey: ["post-likes", params.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Comment mutation
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
      queryClient.invalidateQueries({ queryKey: ["post-comments", params.id] });
      setCommentText("");
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
      const response = await fetch(`/api/posts/${postId}/interests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to express interest');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-interests", params.id] });
      toast({
        title: "Interest Expressed!",
        description: "Your interest has been recorded.",
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
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Helper function to format amounts (K, M, B)
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

  const isLiked = postLikes.some((like: any) => like.userId === user?.id);
  const likeCount = postLikes.length;

  const handleLike = () => {
    likeMutation.mutate({ 
      postId: params.id!, 
      action: isLiked ? 'unlike' : 'like' 
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate({ postId: params.id!, content: commentText.trim() });
  };

  const handleInterest = () => {
    expressInterestMutation.mutate(params.id!);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deletePostMutation.mutate(params.id!);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Post from InvestLocal',
        text: post?.content.substring(0, 100) + '...',
        url: window.location.href
      }).catch(() => {
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
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

  const nextImage = () => {
    if (post?.images && currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-white mb-2">Post not found</h2>
          <p className="text-gray-400 mb-4">The post you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-gray-800"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            
            <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={handleCopyLink}
                  className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleShare}
                  className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-600" />
                {post.authorId === user?.id ? (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-400 hover:bg-gray-700 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
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

      {/* Post Content */}
      <div className="p-4">
        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4">
          <button 
            onClick={() => setLocation(`/user?id=${post.authorId}`)}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg hover:scale-105 transition-transform cursor-pointer shadow-lg"
          >
            {authorInitial}
          </button>
          
          <div className="flex-1">
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
             <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-3 py-1">
               🏷️ {post.category}
             </Badge>
           )}
        </div>

        {/* Post Title */}
        {post.title && (
          <h1 className="text-2xl font-bold text-white mb-3">{post.title}</h1>
        )}

                 {/* Post Content */}
         <div className="text-gray-300 text-base leading-relaxed mb-4">
           {post.content.split('\n').map((line, index) => {
             const trimmedLine = line.trim();
             
             // Check if it's a numbered list item (1. 2. 3. etc.)
             const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
             if (numberedMatch) {
               return (
                 <div key={index} className="flex items-start space-x-2 mb-2">
                   <span className="text-blue-400 font-medium min-w-[20px]">{numberedMatch[1]}.</span>
                   <span>{numberedMatch[2]}</span>
                 </div>
               );
             }
             
             // Check if it's a bullet point (•)
             if (trimmedLine.startsWith('•')) {
               return (
                 <div key={index} className="flex items-start space-x-2 mb-2">
                   <span className="text-blue-400 font-medium min-w-[20px]">•</span>
                   <span>{trimmedLine.substring(1).trim()}</span>
                 </div>
               );
             }
             
             // Check if it's a dash bullet point (-)
             if (trimmedLine.startsWith('-')) {
               return (
                 <div key={index} className="flex items-start space-x-2 mb-2">
                   <span className="text-blue-400 font-medium min-w-[20px]">-</span>
                   <span>{trimmedLine.substring(1).trim()}</span>
                 </div>
               );
             }
             
             // Regular paragraph
             if (trimmedLine) {
               return <p key={index} className="mb-2">{trimmedLine}</p>;
             }
             
             // Empty line
             return <div key={index} className="h-2"></div>;
           })}
         </div>

                 {/* Investment Stats */}
         {post.postType === 'investment' && (
           <div className="flex items-center gap-2 mb-4 flex-wrap">
             {/* Funding Amount */}
             <div className="flex items-center gap-1 bg-green-900/30 px-2 py-1 rounded-lg border border-green-500/20">
               <svg className="h-3 w-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
               </svg>
               <span className="font-medium text-green-300 text-xs">
                 ₹{formatAmount(post.fundingMin || 0)}-{formatAmount(post.fundingMax || 0)}
               </span>
             </div>
             
             {/* ROI */}
             {post.expectedRoi && (
               <div className="flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded-lg border border-blue-500/20">
                 <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                 </svg>
                 <span className="font-medium text-blue-300 text-xs">{post.expectedRoi}% ROI</span>
               </div>
             )}
             
             {/* Team Size */}
             {post.teamSize && (
               <div className="flex items-center gap-1 bg-purple-900/30 px-2 py-1 rounded-lg border border-purple-500/20">
                 <svg className="h-3 w-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                 </svg>
                 <span className="font-medium text-purple-300 text-xs">{post.teamSize} Team</span>
               </div>
             )}
             
             {/* Timeline */}
             {post.timeline && (
               <div className="flex items-center gap-1 bg-orange-900/30 px-2 py-1 rounded-lg border border-orange-500/20">
                 <svg className="h-3 w-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span className="font-medium text-orange-300 text-xs">{post.timeline}</span>
               </div>
             )}
           </div>
         )}

        {/* Image Gallery */}
        {post.images && post.images.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <img 
                src={post.images[currentImageIndex]} 
                alt={`Post image ${currentImageIndex + 1}`}
                className="w-full h-96 object-cover rounded-lg cursor-pointer"
                onClick={() => setShowImageModal(true)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Fallback placeholder */}
              <div className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center hidden border border-gray-700">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Image Preview</p>
                </div>
              </div>

              {/* Navigation arrows */}
              {post.images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  )}
                  
                  {currentImageIndex < post.images.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  )}
                </>
              )}

              {/* Image counter */}
              {post.images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail navigation */}
            {post.images.length > 1 && (
              <div className="flex space-x-2 mt-3 overflow-x-auto">
                {post.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-blue-500' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="font-medium">{likeCount} likes</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              <span className="font-medium">{comments.length} comments</span>
            </div>
          </div>
        </div>

                 {/* Action Buttons */}
         <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 mb-6">
           <Button 
             variant="ghost" 
             size="sm" 
             className={`flex items-center gap-2 rounded-lg transition-all duration-200 ${
               isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
             }`}
             onClick={handleLike}
             disabled={likeMutation.isPending}
           >
             <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
             <span className="text-sm font-medium">{likeCount}</span>
           </Button>
           
           {post.postType === 'investment' && (
             <Button 
               variant="ghost" 
               size="sm" 
               className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200"
               onClick={handleInterest}
               disabled={expressInterestMutation.isPending}
             >
               <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
               </svg>
               <span className="text-sm font-medium">{postInterests.length}</span>
             </Button>
           )}
           
           <Button 
             variant="ghost" 
             size="sm" 
             className="flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200"
             onClick={() => setShowComments(!showComments)}
           >
             <MessageCircle className="h-5 w-5" />
           </Button>
           
           <Button 
             variant="ghost" 
             size="sm" 
             className="flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
             onClick={handleShare}
           >
             <Share2 className="h-5 w-5" />
           </Button>
           
           <Button 
             variant="ghost" 
             size="sm" 
             className="flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-200"
           >
             <Bookmark className="h-5 w-5" />
           </Button>
         </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-gray-700/50 pt-4">
            {/* Comment Input */}
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleComment();
                  }
                }}
              />
              <Button
                onClick={handleComment}
                disabled={!commentText.trim() || commentMutation.isPending}
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
      </div>

      {/* Image Modal */}
      {showImageModal && post.images && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <img 
              src={post.images[currentImageIndex]} 
              alt={`Post image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {post.images.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                )}
                
                {currentImageIndex < post.images.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
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