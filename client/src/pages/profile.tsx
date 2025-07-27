import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Edit, 
  List, 
  PieChart, 
  Bookmark, 
  Settings, 
  HelpCircle, 
  LogOut,
  CheckCircle,
  Star
} from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  bio: z.string().optional(),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(10, "Valid phone number is required"),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me");
      return response.json();
    },
  });

  const { data: userListings = [] } = useQuery({
    queryKey: ["/api/users/me/listings"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/listings");
      return response.json();
    },
    enabled: user?.userType === 'entrepreneur',
  });

  const { data: userInterests = [] } = useQuery({
    queryKey: ["/api/users/me/interests"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/interests");
      return response.json();
    },
    enabled: user?.userType === 'investor',
  });

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile?.fullName || "",
      bio: profile?.bio || "",
      city: profile?.city || "",
      phone: profile?.phone || "",
    },
  });

  // Update form defaults when profile data loads
  useState(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        bio: profile.bio || "",
        city: profile.city,
        phone: profile.phone,
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      const response = await authenticatedApiRequest("PUT", "/api/users/me", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfileForm) => {
    updateProfile.mutate(data);
  };

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of InvestLocal",
    });
    setLocation("/onboarding");
  };

  const calculateStats = () => {
    if (user?.userType === 'entrepreneur') {
      const totalViews = userListings.reduce((sum: number, listing: any) => sum + (listing.views || 0), 0);
      return {
        primary: userListings.length,
        primaryLabel: "Listings",
        secondary: totalViews,
        secondaryLabel: "Total Views",
        tertiary: 85,
        tertiaryLabel: "Success Rate",
      };
    } else {
      return {
        primary: userInterests.length,
        primaryLabel: "Investments",
        secondary: 85,
        secondaryLabel: "Success Rate",
        tertiary: "₹12L",
        tertiaryLabel: "Portfolio",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-blue-600 px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Edit className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    className="mt-1"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...form.register("bio")}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    className="mt-1"
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    className="mt-1"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Info */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white bg-white/10 flex items-center justify-center">
            {profile?.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {profile?.fullName?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {profile?.fullName || "User"}
          </h2>
          <p className="text-blue-100 capitalize mb-1">
            {profile?.userType || "User"}
          </p>
          <p className="text-blue-100 text-sm mb-3">
            {profile?.city}, UP
          </p>
          
          {/* Verification Status */}
          <div className="flex items-center justify-center space-x-2">
            <Badge 
              variant="secondary" 
              className={`${
                profile?.isVerified 
                  ? "bg-green-500 bg-opacity-20 text-green-100" 
                  : "bg-yellow-500 bg-opacity-20 text-yellow-100"
              }`}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {profile?.isVerified ? "KYC Verified" : "Verification Pending"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.primary}</p>
            <p className="text-xs text-neutral-600">{stats.primaryLabel}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{stats.secondary}</p>
            <p className="text-xs text-neutral-600">{stats.secondaryLabel}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.tertiary}</p>
            <p className="text-xs text-neutral-600">{stats.tertiaryLabel}</p>
          </div>
        </div>

        {/* About Section */}
        {profile?.bio && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">About</h3>
            <p className="text-neutral-700 text-sm leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Investment Preferences for Investors */}
        {user?.userType === 'investor' && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Investment Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Investment Range</span>
                <span className="font-medium text-neutral-900">₹1L - ₹10L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Preferred Sectors</span>
                <div className="flex space-x-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    Tech
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    Food
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Risk Appetite</span>
                <span className="font-medium text-neutral-900">Moderate</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Options */}
        <div className="space-y-3">
          
          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
            onClick={() => setLocation("/dashboard")}
          >
            <div className="flex items-center space-x-3">
              <List className="h-5 w-5 text-neutral-600" />
              <span className="text-neutral-900">
                {user?.userType === 'entrepreneur' ? 'My Listings' : 'My Interests'}
              </span>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <PieChart className="h-5 w-5 text-neutral-600" />
              <span className="text-neutral-900">
                {user?.userType === 'entrepreneur' ? 'Analytics' : 'Investment Portfolio'}
              </span>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <Bookmark className="h-5 w-5 text-neutral-600" />
              <span className="text-neutral-900">Saved Opportunities</span>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-neutral-600" />
              <span className="text-neutral-900">Settings & Privacy</span>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-5 w-5 text-neutral-600" />
              <span className="text-neutral-900">Help & Support</span>
            </div>
            <span className="text-neutral-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <div className="flex items-center space-x-3">
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="text-red-500">Logout</span>
            </div>
          </Button>
        </div>

        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-neutral-500 text-sm">InvestLocal v1.0.0</p>
          <p className="text-neutral-400 text-xs mt-1">Made with ❤️ for local entrepreneurs</p>
        </div>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
}
