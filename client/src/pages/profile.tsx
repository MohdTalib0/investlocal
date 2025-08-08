import { useState, useEffect, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Star,
  DollarSign,
  Bell,
  Shield,
  Eye,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Lock,
  User,
  Globe,
  Download,
  Trash2,
  Monitor,
  Camera,
  X
} from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";
import { useNotificationContext } from "@/contexts/NotificationContext";

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  bio: z.string().optional(),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  avatar: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailPreferencesSchema = z.object({
  marketingEmails: z.boolean(),
  investmentAlerts: z.boolean(),
  communityUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
type EmailPreferencesForm = z.infer<typeof emailPreferencesSchema>;

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEmailPreferencesOpen, setIsEmailPreferencesOpen] = useState(false);
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings: notificationSettings, updateSettings: updateNotificationSettings } = useNotificationContext();
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
    enabled: !!user, // Enable for all users
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["/api/users/me/posts"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/posts");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: investmentStats } = useQuery({
    queryKey: ["/api/users/me/investment-stats"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/investment-stats");
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

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<EmailPreferencesForm>({
    resolver: zodResolver(emailPreferencesSchema),
    defaultValues: {
      marketingEmails: true,
      investmentAlerts: true,
      communityUpdates: false,
      securityAlerts: true,
      weeklyDigest: false,
    },
  });

  // Update form defaults when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        bio: profile.bio || "",
        city: profile.city,
        phone: profile.phone,
      });
    }
  }, [profile, form]);

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
      // Reset photo state after successful update
      setSelectedPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const response = await authenticatedApiRequest("PUT", "/api/users/me/password", data);
      return response.json();
    },
    onSuccess: () => {
      setIsChangePasswordOpen(false);
      passwordForm.reset();
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Please check your current password.",
        variant: "destructive",
      });
    },
  });

  const updateEmailPreferences = useMutation({
    mutationFn: async (data: EmailPreferencesForm) => {
      const response = await authenticatedApiRequest("PUT", "/api/users/me/email-preferences", data);
      return response.json();
    },
    onSuccess: () => {
      setIsEmailPreferencesOpen(false);
      toast({
        title: "Email Preferences Updated",
        description: "Your email preferences have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UpdateProfileForm) => {
    // Upload photo first if selected
    let avatarUrl = data.avatar;
    if (selectedPhoto) {
      const uploadedUrl = await handlePhotoUpload();
      if (!uploadedUrl) {
        return; // Don't proceed if photo upload failed
      }
      avatarUrl = uploadedUrl;
    }
    
    // Update profile with new avatar URL
    updateProfile.mutate({
      ...data,
      avatar: avatarUrl,
    });
  };

  const onPasswordSubmit = (data: ChangePasswordForm) => {
    changePassword.mutate(data);
  };

  const onEmailPreferencesSubmit = (data: EmailPreferencesForm) => {
    updateEmailPreferences.mutate(data);
  };

  // Photo upload handlers
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async (): Promise<string | null> => {
    if (!selectedPhoto) return null;
    
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedPhoto);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of InvestLocal",
    });
    setLocation("/onboarding");
  };



  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handleEmailPreferences = () => {
    setIsEmailPreferencesOpen(true);
  };

  const handleDownloadData = () => {
    // Create a JSON file with user data
    const userData = {
      profile: profile,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investlocal-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Downloaded",
      description: "Your data has been downloaded successfully.",
    });
  };

  const handleClearCache = () => {
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    toast({
      title: "Cache Cleared",
      description: "App cache has been cleared successfully.",
    });
  };

  const handleHelpSupport = () => {
    setLocation("/help");
  };

  const handlePrivacyPolicy = () => {
    toast({
      title: "Privacy Policy",
      description: "Privacy policy will be available soon!",
    });
  };

  const handleTermsOfService = () => {
    toast({
      title: "Terms of Service",
      description: "Terms of service will be available soon!",
    });
  };

  const calculateStats = () => {
    if (user?.userType === 'entrepreneur') {
      // Calculate real stats for entrepreneurs
      const totalViews = userListings.reduce((sum: number, listing: any) => sum + (listing.views || 0), 0);
      
      // Calculate success rate based on accepted interests vs total interests
      const totalInterests = userInterests.length;
      const acceptedInterests = userInterests.filter((interest: any) => interest.status === 'accepted').length;
      const successRate = totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0;
      
      // Show listings count, total views, and success rate
      return {
        primary: userListings.length,
        primaryLabel: "Listings",
        secondary: totalViews,
        secondaryLabel: "Total Views",
        tertiary: successRate,
        tertiaryLabel: "Success Rate",
      };
    } else {
      // Calculate real stats for investors
      const totalInterests = userInterests.length;
      const acceptedInterests = userInterests.filter((interest: any) => interest.status === 'accepted').length;
      const successRate = totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0;
      
      // Calculate portfolio value based on accepted investments
      const portfolioValue = acceptedInterests > 0 ? `₹${acceptedInterests * 2.5}L` : "₹0";
      
      return {
        primary: totalInterests,
        primaryLabel: "Investments",
        secondary: successRate,
        secondaryLabel: "Success Rate",
        tertiary: portfolioValue,
        tertiaryLabel: "Portfolio",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-blue-700"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-blue-700"
              onClick={() => setLocation("/edit-profile")}
            >
              <Edit className="h-5 w-5" />
            </Button>



          {/* Change Password Dialog */}
          <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Change Password</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                    className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Enter your current password"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-400 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-white">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                    className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Enter your new password"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-400 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                    className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Confirm your new password"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-400 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                    onClick={() => setIsChangePasswordOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={changePassword.isPending}
                  >
                    {changePassword.isPending ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Email Preferences Dialog */}
          <Dialog open={isEmailPreferencesOpen} onOpenChange={setIsEmailPreferencesOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Email Preferences</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={emailForm.handleSubmit(onEmailPreferencesSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Marketing Emails</p>
                      <p className="text-gray-400 text-sm">Receive promotional content and updates</p>
                    </div>
                    <Switch 
                      checked={emailForm.watch("marketingEmails")}
                      onCheckedChange={(checked) => emailForm.setValue("marketingEmails", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Investment Alerts</p>
                      <p className="text-gray-400 text-sm">New investment opportunities</p>
                    </div>
                    <Switch 
                      checked={emailForm.watch("investmentAlerts")}
                      onCheckedChange={(checked) => emailForm.setValue("investmentAlerts", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Community Updates</p>
                      <p className="text-gray-400 text-sm">Posts and comments from your network</p>
                    </div>
                    <Switch 
                      checked={emailForm.watch("communityUpdates")}
                      onCheckedChange={(checked) => emailForm.setValue("communityUpdates", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Security Alerts</p>
                      <p className="text-gray-400 text-sm">Important security notifications</p>
                    </div>
                    <Switch 
                      checked={emailForm.watch("securityAlerts")}
                      onCheckedChange={(checked) => emailForm.setValue("securityAlerts", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Weekly Digest</p>
                      <p className="text-gray-400 text-sm">Weekly summary of your activity</p>
                    </div>
                    <Switch 
                      checked={emailForm.watch("weeklyDigest")}
                      onCheckedChange={(checked) => emailForm.setValue("weeklyDigest", checked)}
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                    onClick={() => setIsEmailPreferencesOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={updateEmailPreferences.isPending}
                  >
                    {updateEmailPreferences.isPending ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>


        </div>

        {/* Profile Info */}
        <div className="flex items-center space-x-4">
          {/* Left Side - Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-4 border-white bg-white/10 flex items-center justify-center">
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
          </div>
          
          {/* Right Side - Name, City, Role */}
          <div className="flex-1 text-left">
          <h2 className="text-xl font-bold text-white mb-1">
            {profile?.fullName || "User"}
          </h2>
            <p className="text-blue-100 text-sm mb-1">
              {profile?.city}
            </p>
            <p className="text-blue-100 capitalize text-sm mb-3">
            {profile?.userType || "User"}
          </p>
          
          {/* Verification Status */}
            <div className="flex items-center space-x-2">
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
      </div>

      {/* Profile Content */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {isLoading ? "..." : stats.primary}
            </p>
            <p className="text-xs text-gray-400">{stats.primaryLabel}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {isLoading ? "..." : stats.secondary}
            </p>
            <p className="text-xs text-gray-400">{stats.secondaryLabel}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {isLoading ? "..." : stats.tertiary}
            </p>
            <p className="text-xs text-gray-400">{stats.tertiaryLabel}</p>
          </div>
        </div>

        {/* About Section */}
        {profile?.bio && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">About</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}



        {/* Menu Options */}
        <div className="space-y-3">
          
          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={() => setLocation(user?.userType === 'entrepreneur' ? "/dashboard" : "/interests")}
          >
            <div className="flex items-center space-x-3">
              <List className="h-5 w-5 text-gray-400" />
              <span className="text-white">
                {user?.userType === 'entrepreneur' ? 'My Listings' : 'My Interests'}
              </span>
            </div>
            <span className="text-gray-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={() => setLocation("/analytics")}
          >
            <div className="flex items-center space-x-3">
              <PieChart className="h-5 w-5 text-gray-400" />
              <span className="text-white">
                {user?.userType === 'entrepreneur' ? 'Analytics' : 'Investment Portfolio'}
              </span>
            </div>
            <span className="text-gray-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={() => setLocation("/saved")}
          >
            <div className="flex items-center space-x-3">
              <Bookmark className="h-5 w-5 text-gray-400" />
              <span className="text-white">Saved Opportunities</span>
            </div>
            <span className="text-gray-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={() => setLocation("/settings")}
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="text-white">Settings & Privacy</span>
            </div>
            <span className="text-gray-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={handleHelpSupport}
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-5 w-5 text-gray-400" />
              <span className="text-white">Help & Support</span>
            </div>
            <span className="text-gray-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={() => setLocation("/sessions")}
          >
            <div className="flex items-center space-x-3">
              <Monitor className="h-5 w-5 text-gray-400" />
              <span className="text-white">Active Sessions</span>
            </div>
            <span className="text-gray-400">→</span>
          </Button>

          <Button 
            variant="outline"
            className="w-full justify-between h-auto p-4 border-red-800 hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <div className="flex items-center space-x-3">
              <LogOut className="h-5 w-5 text-red-400" />
              <span className="text-red-400">Logout</span>
            </div>
          </Button>
        </div>

        {/* App Info */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center mb-2">
            <Logo size="sm" />
          </div>
          <p className="text-gray-500 text-xs">v1.0.0 • Made with ❤️ for local entrepreneurs</p>
        </div>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
}
