import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share, Bookmark, Calendar, TrendingUp, Users, Trophy, FileText, Shield, Star } from "lucide-react";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

interface BusinessListing {
  id: string;
  title: string;
  description: string;
  category: string;
  fundingMin: number;
  fundingMax: number;
  useOfFunds: string;
  timeline?: string;
  expectedRoi?: string;
  teamSize?: number;
  images: string[];
  views: number;
  entrepreneurId: string;
}

export default function OpportunityDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["/api/listings", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
  });

  const expressInterest = useMutation({
    mutationFn: async () => {
      const response = await authenticatedApiRequest("POST", "/api/interests", {
        listingId: params.id,
        message: "I'm interested in learning more about this opportunity.",
      });
      return response.json();
    },
    onSuccess: () => {
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

  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading opportunity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-white mb-2">Opportunity not found</h2>
          <p className="text-gray-400 mb-4">The listing you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Image Header */}
      <div className="relative h-64 bg-gray-200">
        {listing.images.length > 0 ? (
          <img 
            src={listing.images[0]} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Navigation */}
        <div className="absolute top-12 left-6 right-6 flex items-center justify-between">
          <Button 
            variant="secondary"
            size="icon"
            className="bg-gray-900 bg-opacity-90 text-white hover:bg-gray-800"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex space-x-2">
            <Button variant="secondary" size="icon" className="bg-gray-900 bg-opacity-90 text-white hover:bg-gray-800">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="bg-gray-900 bg-opacity-90 text-white hover:bg-gray-800">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Info Overlay */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="bg-gray-900 bg-opacity-95 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">{listing.title}</h1>
                <p className="text-sm text-gray-400">Barabanki, UP</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-400">
                  {formatAmount(listing.fundingMin)}-{formatAmount(listing.fundingMax)}
                </p>
                <p className="text-sm text-gray-400">Investment Range</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Entrepreneur Info */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-400">E</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Entrepreneur</h3>
              <div className="flex items-center text-green-400">
                <Star className="h-3 w-3 mr-1" />
                <span className="text-sm">Verified</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">5+ years experience • {listing.category}</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-400 ml-1">4.8 (12 reviews)</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">
            View Profile
          </Button>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Timeline</p>
            <p className="font-semibold text-white">{listing.timeline || "6-12 months"}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Expected ROI</p>
            <p className="font-semibold text-white">{listing.expectedRoi || "20-25%"}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <Users className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Team Size</p>
            <p className="font-semibold text-white">{listing.teamSize || 8} members</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <Trophy className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Success Rate</p>
            <p className="font-semibold text-white">85%</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-white mb-3">About This Opportunity</h3>
          <p className="text-gray-300 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Business Plan */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-400" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-300">Business Plan Available</h4>
              <p className="text-sm text-blue-200">Detailed financial projections and market analysis</p>
            </div>
            <Button variant="outline" size="sm" className="text-blue-400 border-blue-400 hover:bg-blue-600/20">
              Download
            </Button>
          </div>
        </div>

        {/* Funding Breakdown */}
        <div>
          <h3 className="font-semibold text-white mb-3">Use of Funds</h3>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-300 leading-relaxed">
              {listing.useOfFunds}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => expressInterest.mutate()}
            disabled={expressInterest.isPending}
          >
            {expressInterest.isPending ? "Expressing Interest..." : "Express Interest"}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
              onClick={() => setLocation(`/chat/${listing.entrepreneurId}`)}
            >
              Message
            </Button>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              Schedule Call
            </Button>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-300 font-medium mb-1">Investment Safety</p>
              <p className="text-sm text-amber-200">
                This entrepreneur is KYC verified. Always do your due diligence before investing. InvestLocal acts as a connector only.
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNavigation activeTab="home" />
    </div>
  );
}
