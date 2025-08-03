import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Bookmark, Heart, MessageSquare, Eye, DollarSign, Filter, Search, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";

export default function SavedOpportunitiesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Fetch saved opportunities
  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ["/api/users/me/saved"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/saved");
      return response.json();
    },
  });

  const data = savedItems || [];

  // Remove from saved
  const removeFromSaved = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await authenticatedApiRequest("DELETE", `/api/users/me/saved/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/saved"] });
      toast({
        title: "Removed from Saved",
        description: "Item has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from saved list.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromSaved = (itemId: string) => {
    removeFromSaved.mutate(itemId);
  };

  const handleBack = () => {
    setLocation("/profile");
  };

  const handleViewItem = (item: any) => {
    setLocation(`/opportunity/${item.id}`);
  };

  const handleShare = (item: any) => {
    const shareUrl = window.location.origin + `/opportunity/${item.id}`;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out this ${item.type} opportunity on InvestLocal`,
        url: shareUrl
      }).catch(() => {
        // Fallback to copy link
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Opportunity link has been copied to clipboard.",
        });
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Opportunity link has been copied to clipboard.",
      });
    }
  };

  // Filter and sort data
  const filteredData = data
    .filter((item: any) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "recent") {
        return new Date(b.savedAt || b.createdAt).getTime() - new Date(a.savedAt || a.createdAt).getTime();
      } else if (sortBy === "popular") {
        return (b.views || 0) - (a.views || 0);
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const saved = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - saved.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading saved opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-blue-700"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">Saved</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Saved Opportunities</h1>
            <p className="text-blue-100">
              {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <Logo size="sm" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search saved items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
        
        <div className="flex space-x-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="flex-1 bg-gray-800 border-gray-600 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="post">Investment Posts</SelectItem>
              <SelectItem value="business">Business Listings</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No saved items</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? "No items match your search." : "Start saving interesting opportunities to see them here."}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setLocation("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Explore Opportunities
              </Button>
            )}
          </div>
        ) : (
          filteredData.map((item: any) => (
            <Card 
              key={item.id} 
              className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer"
              onClick={() => handleViewItem(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`${
                          item.type === 'post' 
                            ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' 
                            : 'bg-green-600/20 text-green-400 border-green-600/30'
                        }`}
                      >
                        {item.type === 'post' ? 'Investment' : 'Business'}
                      </Badge>
                      {item.category && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {item.category}
                        </Badge>
                      )}
                      {item.status && (
                        <Badge 
                          variant="secondary" 
                          className={`${
                            item.status === 'accepted' 
                              ? 'bg-green-600/20 text-green-400 border-green-600/30'
                              : item.status === 'pending'
                              ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                              : 'bg-red-600/20 text-red-400 border-red-600/30'
                          }`}
                        >
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <span>{getTimeAgo(item.savedAt || item.createdAt)}</span>
                      {item.fundingMin && item.fundingMax && (
                        <>
                          <span>•</span>
                          <span>₹{item.fundingMin?.toLocaleString()}-{item.fundingMax?.toLocaleString()}</span>
                        </>
                      )}
                      {item.expectedRoi && (
                        <>
                          <span>•</span>
                          <span>{item.expectedRoi}% ROI</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {item.views !== undefined && (
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{item.views}</span>
                      </div>
                    )}
                    {item.likes !== undefined && (
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{item.likes}</span>
                      </div>
                    )}
                    {item.comments !== undefined && (
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{item.comments}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromSaved(item.id);
                      }}
                      disabled={removeFromSaved.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
} 