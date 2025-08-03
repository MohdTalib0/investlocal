import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, Building, Calendar, Star, MessageCircle, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  userType: 'entrepreneur' | 'investor';
  city: string;
  bio?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  investmentPreferences?: string[];
  businessInterests?: string[];
}

export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = authService.getUser();
  
  // Get user ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading, error } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      
      const token = authService.getToken();
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user's posts
  const { data: userPosts = [] } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await fetch(`/api/posts?authorId=${userId}&limit=5`);
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: !!userId,
  });

  const handleBack = () => {
    setLocation("/dashboard");
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    toast({
      title: "Coming Soon",
      description: "Messaging feature will be available soon!",
    });
  };

  const handleChat = () => {
    setLocation(`/chat/${userId}`);
  };

  const handleViewPosts = () => {
    // TODO: Navigate to filtered posts view
    toast({
      title: "Coming Soon",
      description: "Post filtering feature will be available soon!",
    });
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-gray-400 mb-6">The user profile you're looking for doesn't exist.</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-32 mb-6"></div>
          <div className="h-64 bg-gray-800 rounded mb-6"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">Unable to load this user's profile.</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    
    if (diffInMonths > 12) {
      const years = Math.floor(diffInMonths / 12);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays > 0) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return 'Today';
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
             {/* Header */}
       <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3 sm:space-x-4">
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={handleBack}
               className="text-white hover:bg-gray-800"
             >
               <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
             </Button>
             <div>
               <h1 className="text-base sm:text-lg font-semibold text-white">User Profile</h1>
               <p className="text-xs sm:text-sm text-gray-400">Viewing {userProfile.fullName}'s profile</p>
             </div>
           </div>
           <Logo size="sm" />
         </div>
       </div>

             <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Profile Header */}
                 <Card className="bg-gray-900 border-gray-700">
           <CardContent className="p-4 sm:p-6">
             <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                             {/* Profile Picture */}
               <div className="flex-shrink-0 flex justify-center sm:justify-start">
                 <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white/10 flex items-center justify-center">
                   {userProfile.avatar ? (
                     <img 
                       src={userProfile.avatar} 
                       alt={userProfile.fullName}
                       className="w-full h-full rounded-full object-cover"
                     />
                   ) : (
                     <span className="text-2xl sm:text-3xl font-bold text-white">
                       {userProfile.fullName?.charAt(0) || "U"}
                     </span>
                   )}
                 </div>
               </div>

                             {/* Profile Info */}
               <div className="flex-1 text-center sm:text-left">
                 <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                   <h2 className="text-xl sm:text-2xl font-bold text-white">
                     {userProfile.fullName}
                   </h2>
                   <Badge 
                     variant="secondary" 
                     className={`${
                       userProfile.isVerified 
                         ? "bg-green-500 bg-opacity-20 text-green-100" 
                         : "bg-yellow-500 bg-opacity-20 text-yellow-100"
                     }`}
                   >
                     {userProfile.isVerified ? "KYC Verified" : "Verification Pending"}
                   </Badge>
                 </div>

                                 <div className="flex flex-col space-y-2 text-gray-400 mb-4">
                   <div className="flex items-center space-x-1">
                     <MapPin className="h-4 w-4" />
                     <span>{userProfile.city}</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <Building className="h-4 w-4" />
                     <span className="capitalize">{userProfile.userType}</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <Calendar className="h-4 w-4" />
                     <span>Joined {getTimeAgo(userProfile.createdAt)}</span>
                   </div>
                 </div>

                {userProfile.bio && (
                  <p className="text-gray-300 mb-4">{userProfile.bio}</p>
                )}

                                                                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <Button 
                      onClick={handleChat}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>

                                   {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-700">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="community" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
                Community & Investment
              </TabsTrigger>
            </TabsList>

                       <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
             {/* User Type Specific Info */}
             {userProfile.userType === 'investor' && userProfile.investmentPreferences && (
               <Card className="bg-gray-900 border-gray-700">
                 <CardHeader>
                   <CardTitle className="text-white flex items-center space-x-2">
                     <Star className="h-5 w-5" />
                     <span>Investment Preferences</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-wrap gap-2">
                     {userProfile.investmentPreferences.map((preference, index) => (
                       <Badge key={index} variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                         {preference}
                       </Badge>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             )}

             {userProfile.userType === 'entrepreneur' && userProfile.businessInterests && (
               <Card className="bg-gray-900 border-gray-700">
                 <CardHeader>
                   <CardTitle className="text-white flex items-center space-x-2">
                     <Building className="h-5 w-5" />
                     <span>Business Interests</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-wrap gap-2">
                     {userProfile.businessInterests.map((interest, index) => (
                       <Badge key={index} variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                         {interest}
                       </Badge>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             )}

             {/* Bio Section */}
             {userProfile.bio && (
               <Card className="bg-gray-900 border-gray-700">
                 <CardHeader>
                   <CardTitle className="text-white">About</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-gray-300">{userProfile.bio}</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

                                               <TabsContent value="community" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* User Activity Stats */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Activity Overview</CardTitle>
                </CardHeader>
                                 <CardContent>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="text-center">
                       <div className="text-xl sm:text-2xl font-bold text-blue-400">{userPosts.length}</div>
                       <div className="text-xs sm:text-sm text-gray-400">Total Posts</div>
                     </div>
                     <div className="text-center">
                       <div className="text-xl sm:text-2xl font-bold text-green-400">
                         {userPosts.filter((post: any) => post.postType === 'investment').length}
                       </div>
                       <div className="text-xs sm:text-sm text-gray-400">Investment Posts</div>
                     </div>
                     <div className="text-center">
                       <div className="text-xl sm:text-2xl font-bold text-purple-400">
                         {userPosts.filter((post: any) => post.postType === 'community').length}
                       </div>
                       <div className="text-xs sm:text-sm text-gray-400">Community Posts</div>
                     </div>
                   </div>
                 </CardContent>
              </Card>

              {/* Recent Posts */}
              {userPosts.length > 0 && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userPosts.map((post: any) => (
                        <div key={post.id} className="p-4 bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {post.postType === 'investment' ? 'Investment' : 'Community'}
                            </Badge>
                            <span className="text-gray-400 text-sm">
                              {getTimeAgo(post.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white mb-1">
                            {post.title || 'No title'}
                          </h3>
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

             {userPosts.length === 0 && (
               <Card className="bg-gray-900 border-gray-700">
                 <CardContent className="p-6 text-center">
                   <p className="text-gray-400">No posts yet</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>
                  </Tabs>
       </div>

       {/* Floating Chat Button */}
       <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50">
         <Button
           onClick={handleChat}
           size="lg"
           className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg animate-pulse"
         >
           <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
         </Button>
         <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-bounce"></div>
       </div>
     </div>
   );
 } 