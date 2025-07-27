import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Filter, Search, Star, Plus, MessageSquare, DollarSign, TrendingUp, Heart, Eye } from "lucide-react";
import { authService } from "@/lib/auth";
import { authenticatedApiRequest } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";
import OpportunityCard from "@/components/opportunity-card";
import { Post } from "@shared/schema";

interface BusinessListing {
  id: string;
  title: string;
  description: string;
  category: string;
  fundingMin: number;
  fundingMax: number;
  images: string[];
  entrepreneurId: string;
  views: number;
  createdAt: string;
}

export default function UnifiedDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("investment");
  const user = authService.getUser();

  // Fetch posts (investment and community)
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/posts?postType=${activeTab}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Keep legacy listings for backward compatibility
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/listings"],
    queryFn: async () => {
      const response = await fetch("/api/listings");
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/me/stats"],
    queryFn: async () => {
      try {
        const [postsResponse, listingsResponse] = await Promise.all([
          authenticatedApiRequest("GET", "/api/users/me/posts"),
          authenticatedApiRequest("GET", "/api/users/me/listings")
        ]);
        
        const userPosts = await postsResponse.json();
        const userListings = await listingsResponse.json();
        
        return {
          activePosts: userPosts.length,
          activeListings: userListings.length,
          totalViews: [...userPosts, ...userListings].reduce((sum: number, item: any) => sum + (item.views || 0), 0),
          activeChats: 0, // TODO: Implement chat count
        };
      } catch (error) {
        return {
          activePosts: 0,
          activeListings: 0,
          totalViews: 0,
          activeChats: 0,
        };
      }
    },
    enabled: !!user,
  });

  const categories = ["All", "Tech Startups", "Food & Beverage", "Retail", "Education", "Healthcare", "Manufacturing", "Agriculture", "Services"];

  // Filter function for posts
  const filteredPosts = posts.filter((post: Post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter function for legacy listings
  const filteredListings = listings.filter((listing: BusinessListing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const PostCard = ({ post }: { post: Post }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setLocation(`/post/${post.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{post.title}</CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {post.content.substring(0, 120)}...
            </CardDescription>
          </div>
          <Badge variant={post.postType === 'investment' ? 'default' : 'secondary'}>
            {post.postType === 'investment' ? 'Investment' : 'Community'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.views || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{post.likes || 0}</span>
            </div>
            {post.postType === 'investment' && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>₹{post.fundingMin?.toLocaleString()}-{post.fundingMax?.toLocaleString()}</span>
              </div>
            )}
          </div>
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
        </div>
        {post.category && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {post.category}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (postsLoading || listingsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">InvestLocal</h1>
            <p className="text-sm text-neutral-600">
              {user?.userType === 'entrepreneur' ? 'Share opportunities' : 'Discover investments'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </Button>
            <Button 
              onClick={() => setLocation("/create-post")}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {user && userStats && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-neutral-900">{userStats.activePosts + userStats.activeListings}</p>
              <p className="text-xs text-neutral-600">Active Posts</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Eye className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-neutral-900">{userStats.totalViews}</p>
              <p className="text-xs text-neutral-600">Total Views</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <MessageSquare className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-neutral-900">{userStats.activeChats}</p>
              <p className="text-xs text-neutral-600">Active Chats</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-neutral-900">4.8</p>
              <p className="text-xs text-neutral-600">Rating</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="px-6 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="investment" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Investment
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Legacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investment" className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover investment opportunities from local entrepreneurs
            </p>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600 mb-4">No investment opportunities found</p>
                {user?.userType === 'entrepreneur' && (
                  <Button onClick={() => setLocation("/create-post")}>
                    Create Investment Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post: Post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Join community discussions and share insights
            </p>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600 mb-4">No community posts found</p>
                <Button onClick={() => setLocation("/create-post")}>
                  Create Community Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post: Post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="legacy" className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse existing business listings (legacy format)
            </p>
            {filteredListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600 mb-4">No listings found</p>
                {user?.userType === 'entrepreneur' && (
                  <Button onClick={() => setLocation("/create-listing")}>
                    Create Business Listing
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing: BusinessListing) => (
                  <OpportunityCard 
                    key={listing.id} 
                    listing={listing} 
                    onClick={() => setLocation(`/opportunity/${listing.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="h-20"></div>
      <BottomNavigation activeTab="dashboard" />
    </div>
  );
}