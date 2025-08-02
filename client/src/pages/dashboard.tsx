import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Filter, Search, Star } from "lucide-react";
import { authService } from "@/lib/auth";
import { authenticatedApiRequest } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";
import OpportunityCard from "@/components/opportunity-card";

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

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const user = authService.getUser();

  const { data: listings = [], isLoading } = useQuery({
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
      const response = await authenticatedApiRequest("GET", "/api/users/me/listings");
      const listings = await response.json();
      return {
        activeListings: listings.length,
        totalViews: listings.reduce((sum: number, listing: any) => sum + listing.views, 0),
        activeChats: 0, // TODO: Implement chat count
      };
    },
    enabled: !!user,
  });

  const categories = ["All", "Tech Startups", "Food & Beverage", "Retail", "Education", "Healthcare"];

  const filteredListings = listings.filter((listing: BusinessListing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
              {/* Top Navigation */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              Welcome, {user?.fullName || "User"}
            </h1>
            <p className="text-sm text-gray-400">{user?.city}, UP</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-gray-800">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                {user?.fullName?.charAt(0) || "U"}
              </div>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {user?.userType === 'entrepreneur' && userStats && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{userStats.activeListings}</p>
              <p className="text-xs text-neutral-600">Active Listings</p>
            </div>
            <div className="bg-secondary/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-secondary">{userStats.totalViews}</p>
              <p className="text-xs text-neutral-600">Total Views</p>
            </div>
            <div className="bg-accent/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-accent">{userStats.activeChats}</p>
              <p className="text-xs text-neutral-600">Active Chats</p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex space-x-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="flex-1 overflow-y-auto">
        {/* Featured Opportunity */}
        {filteredListings.length > 0 && (
          <div className="bg-gradient-to-r from-primary to-blue-600 mx-6 mt-4 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary" className="bg-white/20 text-white">
                ⭐ Featured
              </Badge>
              <span className="text-sm font-medium">
                ₹{(filteredListings[0].fundingMin / 100000).toFixed(1)}L-{(filteredListings[0].fundingMax / 100000).toFixed(1)}L
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">{filteredListings[0].title}</h3>
            <p className="text-blue-100 text-sm mb-3 line-clamp-2">
              {filteredListings[0].description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                  E
                </div>
                <span className="text-sm">Entrepreneur</span>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-green-300 mr-1" />
                </div>
              </div>
              <Button 
                size="sm"
                className="bg-white text-primary hover:bg-gray-100"
                onClick={() => setLocation(`/opportunity/${filteredListings[0].id}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Regular Opportunities */}
        <div className="px-6 space-y-4 mt-4">
          {filteredListings.slice(1).map((listing: BusinessListing) => (
            <OpportunityCard
              key={listing.id}
              listing={listing}
              onClick={() => setLocation(`/opportunity/${listing.id}`)}
            />
          ))}

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No opportunities found</h3>
              <p className="text-neutral-600">
                {searchQuery || selectedCategory !== "All" 
                  ? "Try adjusting your search or filters" 
                  : "Be the first to post an opportunity!"}
              </p>
              {user?.userType === 'entrepreneur' && (
                <Button 
                  className="mt-4"
                  onClick={() => setLocation("/create-listing")}
                >
                  Post Opportunity
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation activeTab="home" />
    </div>
  );
}
