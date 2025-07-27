import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileCheck, 
  AlertTriangle, 
  BarChart3, 
  Shield, 
  Settings, 
  UserCog,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  pendingReviews: number;
  totalInterests: number;
}

interface BusinessListing {
  id: string;
  title: string;
  description: string;
  category: string;
  entrepreneurId: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  userType: string;
  isVerified: boolean;
  city: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();

  // Redirect if not admin
  if (user?.userType !== 'admin') {
    setLocation("/dashboard");
    return null;
  }

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/admin/stats");
      return response.json();
    },
  });

  const { data: pendingListings = [], isLoading: isLoadingListings } = useQuery({
    queryKey: ["/api/admin/pending-listings"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/admin/pending-listings");
      return response.json();
    },
  });

  const { data: pendingUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/admin/pending-users");
      return response.json();
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/admin/reports?status=pending");
      return response.json();
    },
  });

  const approveListing = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await authenticatedApiRequest("PUT", `/api/listings/${listingId}`, {
        status: "approved"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing approved",
        description: "The business listing has been approved and is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve listing",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const rejectListing = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await authenticatedApiRequest("PUT", `/api/listings/${listingId}`, {
        status: "rejected"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing rejected",
        description: "The business listing has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject listing",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const verifyUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await authenticatedApiRequest("PUT", "/api/users/me", {
        isVerified: true
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User verified",
        description: "The user has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to verify user",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (isLoadingStats) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Admin Header */}
      <div className="bg-neutral-900 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-neutral-300">InvestLocal Management</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={() => setLocation("/profile")}
          >
            <UserCog className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-neutral-300 text-sm">Total Users</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{stats.pendingReviews}</p>
              <p className="text-neutral-300 text-sm">Pending Reviews</p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Content */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Overview Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">Total Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold text-neutral-900">{stats.totalListings}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600">Total Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  <span className="text-2xl font-bold text-neutral-900">{stats.totalInterests}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Reviews Section */}
        {(pendingListings.length > 0 || pendingUsers.length > 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-amber-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Pending Reviews
                </CardTitle>
                <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                  {pendingListings.length + pendingUsers.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Pending KYC Verifications */}
              {pendingUsers.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-neutral-900">KYC Verifications</p>
                        <p className="text-sm text-neutral-600">{pendingUsers.length} pending applications</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingUsers.slice(0, 3).map((user: User) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{user.fullName}</p>
                          <p className="text-xs text-neutral-600">{user.email} • {user.city}</p>
                          <p className="text-xs text-neutral-500">Applied {formatDate(user.createdAt)}</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => verifyUser.mutate(user.id)}
                          disabled={verifyUser.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Business Listings */}
              {pendingListings.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileCheck className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-neutral-900">Business Listings</p>
                        <p className="text-sm text-neutral-600">{pendingListings.length} pending approvals</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingListings.slice(0, 3).map((listing: BusinessListing) => (
                      <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{listing.title}</p>
                          <p className="text-xs text-neutral-600 line-clamp-1">{listing.description}</p>
                          <p className="text-xs text-neutral-500">
                            {listing.category} • Submitted {formatDate(listing.createdAt)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => approveListing.mutate(listing.id)}
                            disabled={approveListing.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => rejectListing.mutate(listing.id)}
                            disabled={rejectListing.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Management Options */}
        <div className="grid grid-cols-1 gap-3">
          
          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-neutral-900">User Management</p>
                <p className="text-sm text-neutral-600">View and manage all users</p>
              </div>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-secondary" />
              <div className="text-left">
                <p className="font-medium text-neutral-900">Analytics</p>
                <p className="text-sm text-neutral-600">Platform statistics and insights</p>
              </div>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-accent" />
              <div className="text-left">
                <p className="font-medium text-neutral-900">Content Moderation</p>
                <p className="text-sm text-neutral-600">Review reported content</p>
              </div>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-neutral-600" />
              <div className="text-left">
                <p className="font-medium text-neutral-900">System Settings</p>
                <p className="text-sm text-neutral-600">Platform configuration</p>
              </div>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-neutral-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-neutral-600">New user registration</span>
                <span className="text-neutral-400 ml-auto">5 min ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-neutral-600">Listing approved</span>
                <span className="text-neutral-400 ml-auto">15 min ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                <span className="text-neutral-600">KYC submitted</span>
                <span className="text-neutral-400 ml-auto">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
