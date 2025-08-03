import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Heart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Eye,
  Users,
  MapPin
} from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";

export default function InterestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user interests
  const { data: interests = [], isLoading } = useQuery({
    queryKey: ["/api/users/me/interests"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/interests");
      return response.json();
    },
    enabled: user?.userType === 'investor',
  });

  // Fetch investment stats
  const { data: investmentStats } = useQuery({
    queryKey: ["/api/users/me/investment-stats"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/investment-stats");
      return response.json();
    },
    enabled: user?.userType === 'investor',
  });

  // Withdraw interest mutation
  const withdrawInterest = useMutation({
    mutationFn: async (interestId: string) => {
      const response = await authenticatedApiRequest("DELETE", `/api/interests/${interestId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/interests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/investment-stats"] });
      toast({
        title: "Interest Withdrawn",
        description: "Your interest has been withdrawn successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to withdraw interest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWithdrawInterest = (interestId: string) => {
    withdrawInterest.mutate(interestId);
  };

  const handleViewPost = (postId: string) => {
    setLocation(`/opportunity/${postId}`);
  };

  const handleMessageEntrepreneur = (entrepreneurId: string) => {
    setLocation(`/chat/${entrepreneurId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Pending</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-600/30">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-600/20 text-gray-400 border-gray-600/30">Unknown</Badge>;
    }
  };

  const filteredInterests = interests.filter((interest: any) => {
    if (activeTab === "all") return true;
    return interest.status === activeTab;
  });

  const stats = {
    total: interests.length,
    pending: interests.filter((i: any) => i.status === 'pending').length,
    accepted: interests.filter((i: any) => i.status === 'accepted').length,
    rejected: interests.filter((i: any) => i.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your interests...</p>
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
            onClick={() => setLocation("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">My Interests</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Investment Interests</h1>
            <p className="text-blue-100">Track your investment opportunities</p>
          </div>
          <Logo size="sm" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-400">{stats.accepted}</p>
            <p className="text-xs text-gray-400">Accepted</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-400">{stats.rejected}</p>
            <p className="text-xs text-gray-400">Rejected</p>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      {investmentStats && (
        <div className="px-6 py-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Invested</p>
                  <p className="text-white font-bold">₹{(investmentStats.portfolioValue / 100000).toFixed(1)}L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-white font-bold">{investmentStats.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-700">
            <TabsTrigger value="all" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Accepted ({stats.accepted})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredInterests.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {activeTab === "all" ? "No Interests Yet" : `No ${activeTab} Interests`}
                </h3>
                <p className="text-gray-400 mb-6">
                  {activeTab === "all" 
                    ? "Start exploring investment opportunities to express your interests."
                    : `You don't have any ${activeTab} interests at the moment.`
                  }
                </p>
                <Button 
                  onClick={() => setLocation("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Explore Opportunities
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterests.map((interest: any) => (
                  <Card key={interest.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(interest.status)}
                            <h3 className="text-white font-medium">
                              {interest.postId ? 'Investment Opportunity' : 'Business Listing'}
                            </h3>
                            {getStatusBadge(interest.status)}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            {interest.message || 'No message provided'}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-300">
                                {new Date(interest.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-300">₹2.5L</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-600 hover:bg-gray-800"
                          onClick={() => handleViewPost(interest.postId || interest.listingId)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        
                        {interest.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-600 hover:bg-gray-800"
                            onClick={() => handleMessageEntrepreneur(interest.postId || interest.listingId)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        )}

                        {interest.status === 'accepted' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-green-600 hover:bg-green-900/20 text-green-400"
                            onClick={() => handleMessageEntrepreneur(interest.postId || interest.listingId)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        )}

                        {interest.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-600 hover:bg-red-900/20 text-red-400"
                            onClick={() => handleWithdrawInterest(interest.id)}
                            disabled={withdrawInterest.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
} 