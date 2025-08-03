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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEmailPreferencesOpen, setIsEmailPreferencesOpen] = useState(false);
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      investmentAlerts: true,
      communityUpdates: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true
    },
    appearance: {
      darkMode: true,
      compactView: false
    },
    investment: {
      autoMatch: true,
      riskLevel: 'moderate',
      investmentRange: '1L-10L',
      preferredSectors: ['tech', 'food'],
      showAdvancedMetrics: false
    }
  });
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
      setIsEditModalOpen(false);
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

  // Settings handlers
  const handleNotificationToggle = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
    
    toast({
      title: "Notification Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.notifications[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handlePrivacyToggle = (key: keyof typeof settings.privacy) => {
    if (key === 'profileVisibility') return; // Handle separately
    
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
    
    toast({
      title: "Privacy Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.privacy[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleProfileVisibilityChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        profileVisibility: value
      }
    }));
    
    toast({
      title: "Profile Visibility Updated",
      description: `Your profile is now ${value}.`,
    });
  };

  const handleAppearanceToggle = (key: keyof typeof settings.appearance) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: !prev.appearance[key]
      }
    }));
    
    toast({
      title: "Appearance Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.appearance[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleInvestmentToggle = (key: keyof typeof settings.investment) => {
    setSettings(prev => ({
      ...prev,
      investment: {
        ...prev.investment,
        [key]: !prev.investment[key]
      }
    }));
    
    toast({
      title: "Investment Settings Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.investment[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleRiskLevelChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      investment: {
        ...prev.investment,
        riskLevel: value
      }
    }));
    
    toast({
      title: "Risk Level Updated",
      description: `Risk level set to ${value}`,
      variant: "default",
    });
  };

  const handleInvestmentRangeChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      investment: {
        ...prev.investment,
        investmentRange: value
      }
    }));
    
    toast({
      title: "Investment Range Updated",
      description: `Investment range set to ${value}`,
      variant: "default",
    });
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
      settings: settings,
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
          <Dialog open={isEditModalOpen} onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              // Reset photo state when modal closes
              setSelectedPhoto(null);
              setPhotoPreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
                <Edit className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-600 bg-gray-800 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : profile?.avatar ? (
                        <img 
                          src={profile.avatar} 
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-gray-400">
                          {profile?.fullName?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    
                    {/* Upload button overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                      disabled={isUploadingPhoto}
                    >
                      <Camera className="h-4 w-4 text-white" />
                    </button>
                    
                    {/* Remove button */}
                    {(photoPreview || profile?.avatar) && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-0 right-0 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        disabled={isUploadingPhoto}
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                    </button>
                    <p className="text-gray-400 text-xs mt-1">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fullName" className="text-white">Full Name</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-red-400 mt-1">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    {...form.register("bio")}
                    className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-white">City</Label>
                  <Select onValueChange={(value) => form.setValue("city", value)} defaultValue={form.getValues("city")}>
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-gray-800 border-gray-600">
                      {/* Major Metropolitan Cities */}
                      <SelectItem value="Mumbai">Mumbai, Maharashtra</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Bangalore">Bangalore, Karnataka</SelectItem>
                      <SelectItem value="Hyderabad">Hyderabad, Telangana</SelectItem>
                      <SelectItem value="Chennai">Chennai, Tamil Nadu</SelectItem>
                      <SelectItem value="Kolkata">Kolkata, West Bengal</SelectItem>
                      <SelectItem value="Pune">Pune, Maharashtra</SelectItem>
                      <SelectItem value="Ahmedabad">Ahmedabad, Gujarat</SelectItem>
                      <SelectItem value="Jaipur">Jaipur, Rajasthan</SelectItem>
                      <SelectItem value="Surat">Surat, Gujarat</SelectItem>
                      
                      {/* Uttar Pradesh */}
                      <SelectItem value="Lucknow">Lucknow, Uttar Pradesh</SelectItem>
                      <SelectItem value="Kanpur">Kanpur, Uttar Pradesh</SelectItem>
                      <SelectItem value="Varanasi">Varanasi, Uttar Pradesh</SelectItem>
                      <SelectItem value="Prayagraj">Prayagraj (Allahabad), Uttar Pradesh</SelectItem>
                      <SelectItem value="Ghaziabad">Ghaziabad, Uttar Pradesh</SelectItem>
                      <SelectItem value="Noida">Noida, Uttar Pradesh</SelectItem>
                      <SelectItem value="Agra">Agra, Uttar Pradesh</SelectItem>
                      <SelectItem value="Bareilly">Bareilly, Uttar Pradesh</SelectItem>
                      <SelectItem value="Aligarh">Aligarh, Uttar Pradesh</SelectItem>
                      <SelectItem value="Meerut">Meerut, Uttar Pradesh</SelectItem>
                      <SelectItem value="Barabanki">Barabanki, Uttar Pradesh</SelectItem>
                      
                      {/* Maharashtra */}
                      <SelectItem value="Nagpur">Nagpur, Maharashtra</SelectItem>
                      <SelectItem value="Thane">Thane, Maharashtra</SelectItem>
                      <SelectItem value="Nashik">Nashik, Maharashtra</SelectItem>
                      <SelectItem value="Aurangabad">Aurangabad, Maharashtra</SelectItem>
                      <SelectItem value="Solapur">Solapur, Maharashtra</SelectItem>
                      <SelectItem value="Kolhapur">Kolhapur, Maharashtra</SelectItem>
                      
                      {/* Karnataka */}
                      <SelectItem value="Mysore">Mysore, Karnataka</SelectItem>
                      <SelectItem value="Hubli">Hubli, Karnataka</SelectItem>
                      <SelectItem value="Mangalore">Mangalore, Karnataka</SelectItem>
                      <SelectItem value="Belgaum">Belgaum, Karnataka</SelectItem>
                      
                      {/* Tamil Nadu */}
                      <SelectItem value="Coimbatore">Coimbatore, Tamil Nadu</SelectItem>
                      <SelectItem value="Madurai">Madurai, Tamil Nadu</SelectItem>
                      <SelectItem value="Salem">Salem, Tamil Nadu</SelectItem>
                      <SelectItem value="Tiruchirappalli">Tiruchirappalli, Tamil Nadu</SelectItem>
                      
                      {/* Gujarat */}
                      <SelectItem value="Vadodara">Vadodara, Gujarat</SelectItem>
                      <SelectItem value="Rajkot">Rajkot, Gujarat</SelectItem>
                      <SelectItem value="Bhavnagar">Bhavnagar, Gujarat</SelectItem>
                      <SelectItem value="Jamnagar">Jamnagar, Gujarat</SelectItem>
                      
                      {/* Rajasthan */}
                      <SelectItem value="Jodhpur">Jodhpur, Rajasthan</SelectItem>
                      <SelectItem value="Kota">Kota, Rajasthan</SelectItem>
                      <SelectItem value="Bikaner">Bikaner, Rajasthan</SelectItem>
                      <SelectItem value="Ajmer">Ajmer, Rajasthan</SelectItem>
                      <SelectItem value="Udaipur">Udaipur, Rajasthan</SelectItem>
                      
                      {/* Telangana */}
                      <SelectItem value="Warangal">Warangal, Telangana</SelectItem>
                      <SelectItem value="Karimnagar">Karimnagar, Telangana</SelectItem>
                      <SelectItem value="Nizamabad">Nizamabad, Telangana</SelectItem>
                      
                      {/* Andhra Pradesh */}
                      <SelectItem value="Visakhapatnam">Visakhapatnam, Andhra Pradesh</SelectItem>
                      <SelectItem value="Vijayawada">Vijayawada, Andhra Pradesh</SelectItem>
                      <SelectItem value="Guntur">Guntur, Andhra Pradesh</SelectItem>
                      <SelectItem value="Nellore">Nellore, Andhra Pradesh</SelectItem>
                      
                      {/* Kerala */}
                      <SelectItem value="Kochi">Kochi, Kerala</SelectItem>
                      <SelectItem value="Thiruvananthapuram">Thiruvananthapuram, Kerala</SelectItem>
                      <SelectItem value="Kozhikode">Kozhikode, Kerala</SelectItem>
                      <SelectItem value="Thrissur">Thrissur, Kerala</SelectItem>
                      
                      {/* West Bengal */}
                      <SelectItem value="Howrah">Howrah, West Bengal</SelectItem>
                      <SelectItem value="Durgapur">Durgapur, West Bengal</SelectItem>
                      <SelectItem value="Asansol">Asansol, West Bengal</SelectItem>
                      <SelectItem value="Siliguri">Siliguri, West Bengal</SelectItem>
                      
                      {/* Madhya Pradesh */}
                      <SelectItem value="Indore">Indore, Madhya Pradesh</SelectItem>
                      <SelectItem value="Bhopal">Bhopal, Madhya Pradesh</SelectItem>
                      <SelectItem value="Jabalpur">Jabalpur, Madhya Pradesh</SelectItem>
                      <SelectItem value="Gwalior">Gwalior, Madhya Pradesh</SelectItem>
                      <SelectItem value="Ujjain">Ujjain, Madhya Pradesh</SelectItem>
                      
                      {/* Punjab */}
                      <SelectItem value="Ludhiana">Ludhiana, Punjab</SelectItem>
                      <SelectItem value="Amritsar">Amritsar, Punjab</SelectItem>
                      <SelectItem value="Jalandhar">Jalandhar, Punjab</SelectItem>
                      <SelectItem value="Patiala">Patiala, Punjab</SelectItem>
                      <SelectItem value="Bathinda">Bathinda, Punjab</SelectItem>
                      
                      {/* Haryana */}
                      <SelectItem value="Gurgaon">Gurgaon, Haryana</SelectItem>
                      <SelectItem value="Faridabad">Faridabad, Haryana</SelectItem>
                      <SelectItem value="Panipat">Panipat, Haryana</SelectItem>
                      <SelectItem value="Yamunanagar">Yamunanagar, Haryana</SelectItem>
                      
                      {/* Bihar */}
                      <SelectItem value="Patna">Patna, Bihar</SelectItem>
                      <SelectItem value="Gaya">Gaya, Bihar</SelectItem>
                      <SelectItem value="Bhagalpur">Bhagalpur, Bihar</SelectItem>
                      <SelectItem value="Muzaffarpur">Muzaffarpur, Bihar</SelectItem>
                      
                      {/* Odisha */}
                      <SelectItem value="Bhubaneswar">Bhubaneswar, Odisha</SelectItem>
                      <SelectItem value="Cuttack">Cuttack, Odisha</SelectItem>
                      <SelectItem value="Rourkela">Rourkela, Odisha</SelectItem>
                      <SelectItem value="Brahmapur">Brahmapur, Odisha</SelectItem>
                      
                      {/* Assam */}
                      <SelectItem value="Guwahati">Guwahati, Assam</SelectItem>
                      <SelectItem value="Silchar">Silchar, Assam</SelectItem>
                      <SelectItem value="Dibrugarh">Dibrugarh, Assam</SelectItem>
                      
                      {/* Jharkhand */}
                      <SelectItem value="Ranchi">Ranchi, Jharkhand</SelectItem>
                      <SelectItem value="Jamshedpur">Jamshedpur, Jharkhand</SelectItem>
                      <SelectItem value="Dhanbad">Dhanbad, Jharkhand</SelectItem>
                      <SelectItem value="Bokaro">Bokaro, Jharkhand</SelectItem>
                      
                      {/* Chhattisgarh */}
                      <SelectItem value="Raipur">Raipur, Chhattisgarh</SelectItem>
                      <SelectItem value="Bhilai">Bhilai, Chhattisgarh</SelectItem>
                      <SelectItem value="Bilaspur">Bilaspur, Chhattisgarh</SelectItem>
                      
                      {/* Uttarakhand */}
                      <SelectItem value="Dehradun">Dehradun, Uttarakhand</SelectItem>
                      <SelectItem value="Haridwar">Haridwar, Uttarakhand</SelectItem>
                      <SelectItem value="Roorkee">Roorkee, Uttarakhand</SelectItem>
                      
                      {/* Himachal Pradesh */}
                      <SelectItem value="Shimla">Shimla, Himachal Pradesh</SelectItem>
                      <SelectItem value="Mandi">Mandi, Himachal Pradesh</SelectItem>
                      <SelectItem value="Solan">Solan, Himachal Pradesh</SelectItem>
                      
                      {/* Jammu & Kashmir */}
                      <SelectItem value="Srinagar">Srinagar, Jammu & Kashmir</SelectItem>
                      <SelectItem value="Jammu">Jammu, Jammu & Kashmir</SelectItem>
                      
                      {/* Goa */}
                      <SelectItem value="Panaji">Panaji, Goa</SelectItem>
                      <SelectItem value="Margao">Margao, Goa</SelectItem>
                      <SelectItem value="Vasco da Gama">Vasco da Gama, Goa</SelectItem>
                      
                      {/* North Eastern States */}
                      <SelectItem value="Imphal">Imphal, Manipur</SelectItem>
                      <SelectItem value="Aizawl">Aizawl, Mizoram</SelectItem>
                      <SelectItem value="Shillong">Shillong, Meghalaya</SelectItem>
                      <SelectItem value="Agartala">Agartala, Tripura</SelectItem>
                      <SelectItem value="Kohima">Kohima, Nagaland</SelectItem>
                      <SelectItem value="Itanagar">Itanagar, Arunachal Pradesh</SelectItem>
                      
                      {/* Union Territories */}
                      <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                      <SelectItem value="Puducherry">Puducherry</SelectItem>
                      <SelectItem value="Port Blair">Port Blair, Andaman & Nicobar</SelectItem>
                      <SelectItem value="Kavaratti">Kavaratti, Lakshadweep</SelectItem>
                      
                      {/* Other */}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-400 mt-1">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Phone</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    className="mt-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-400 mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 border-gray-600 text-black hover:bg-gray-800"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={updateProfile.isPending || isUploadingPhoto}
                  >
                    {updateProfile.isPending || isUploadingPhoto ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Settings Dialog */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Settings & Privacy</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Account Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Account
                  </h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Edit className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Edit Profile</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handleChangePassword}
                    >
                      <div className="flex items-center space-x-3">
                        <Lock className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Change Password</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handleEmailPreferences}
                    >
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Email Preferences</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Chat Notifications</p>
                        <p className="text-gray-400 text-sm">New message alerts</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.enabled}
                        onCheckedChange={(checked) => updateNotificationSettings({ enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Notification Sound</p>
                        <p className="text-gray-400 text-sm">Play sound for new messages</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.sound}
                        onCheckedChange={(checked) => updateNotificationSettings({ sound: checked })}
                        disabled={!notificationSettings.enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Browser Notifications</p>
                        <p className="text-gray-400 text-sm">Desktop notifications</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.browserNotifications}
                        onCheckedChange={(checked) => updateNotificationSettings({ browserNotifications: checked })}
                        disabled={!notificationSettings.enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Vibration</p>
                        <p className="text-gray-400 text-sm">Vibrate on new messages</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.vibration}
                        onCheckedChange={(checked) => updateNotificationSettings({ vibration: checked })}
                        disabled={!notificationSettings.enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-gray-400 text-sm">Get notified about new opportunities</p>
                      </div>
                      <Switch 
                        checked={settings.notifications.push}
                        onCheckedChange={() => handleNotificationToggle('push')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-gray-400 text-sm">Receive updates via email</p>
                      </div>
                      <Switch 
                        checked={settings.notifications.email}
                        onCheckedChange={() => handleNotificationToggle('email')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Investment Alerts</p>
                        <p className="text-gray-400 text-sm">New investment opportunities</p>
                      </div>
                      <Switch 
                        checked={settings.notifications.investmentAlerts}
                        onCheckedChange={() => handleNotificationToggle('investmentAlerts')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Community Updates</p>
                        <p className="text-gray-400 text-sm">Posts and comments from your network</p>
                      </div>
                      <Switch 
                        checked={settings.notifications.communityUpdates}
                        onCheckedChange={() => handleNotificationToggle('communityUpdates')}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Privacy */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Privacy
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Profile Visibility</p>
                        <p className="text-gray-400 text-sm">Who can see your profile</p>
                      </div>
                      <Select value={settings.privacy.profileVisibility} onValueChange={handleProfileVisibilityChange}>
                        <SelectTrigger className="w-24 bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="connections">Connections</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Show Online Status</p>
                        <p className="text-gray-400 text-sm">Let others see when you're active</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.showOnlineStatus}
                        onCheckedChange={() => handlePrivacyToggle('showOnlineStatus')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Allow Messages</p>
                        <p className="text-gray-400 text-sm">Receive messages from other users</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.allowMessages}
                        onCheckedChange={() => handlePrivacyToggle('allowMessages')}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Appearance */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Appearance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Dark Mode</p>
                        <p className="text-gray-400 text-sm">Use dark theme</p>
                      </div>
                      <Switch 
                        checked={settings.appearance.darkMode}
                        onCheckedChange={() => handleAppearanceToggle('darkMode')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Compact View</p>
                        <p className="text-gray-400 text-sm">Show more content per screen</p>
                      </div>
                      <Switch 
                        checked={settings.appearance.compactView}
                        onCheckedChange={() => handleAppearanceToggle('compactView')}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Investment Settings - Only for Investors */}
                {user?.userType === 'investor' && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Investment Preferences
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Auto-Match Opportunities</p>
                            <p className="text-gray-400 text-sm">Automatically match with relevant opportunities</p>
                          </div>
                          <Switch 
                            checked={settings.investment.autoMatch}
                            onCheckedChange={() => handleInvestmentToggle('autoMatch')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Advanced Metrics</p>
                            <p className="text-gray-400 text-sm">Show detailed financial metrics</p>
                          </div>
                          <Switch 
                            checked={settings.investment.showAdvancedMetrics}
                            onCheckedChange={() => handleInvestmentToggle('showAdvancedMetrics')}
                          />
                        </div>
                        
                        <div>
                          <p className="text-white font-medium mb-2">Risk Level</p>
                          <Select value={settings.investment.riskLevel} onValueChange={handleRiskLevelChange}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="conservative">Conservative</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="aggressive">Aggressive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <p className="text-white font-medium mb-2">Investment Range</p>
                          <Select value={settings.investment.investmentRange} onValueChange={handleInvestmentRangeChange}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="10K-50K">₹10K - ₹50K</SelectItem>
                              <SelectItem value="50K-1L">₹50K - ₹1L</SelectItem>
                              <SelectItem value="1L-5L">₹1L - ₹5L</SelectItem>
                              <SelectItem value="1L-10L">₹1L - ₹10L</SelectItem>
                              <SelectItem value="5L-25L">₹5L - ₹25L</SelectItem>
                              <SelectItem value="10L-50L">₹10L - ₹50L</SelectItem>
                              <SelectItem value="50L+">₹50L+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-gray-700" />
                  </>
                )}

                {/* Data & Storage */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Data & Storage
                  </h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handleDownloadData}
                    >
                      <div className="flex items-center space-x-3">
                        <Download className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Download My Data</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handleClearCache}
                    >
                      <div className="flex items-center space-x-3">
                        <Trash2 className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Clear Cache</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* About */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    About
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">App Version</p>
                        <p className="text-gray-400 text-sm">v1.0.0</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handleHelpSupport}
                    >
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Help & Support</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handlePrivacyPolicy}
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Privacy Policy</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-800 bg-gray-800"
                      onClick={handleTermsOfService}
                    >
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-white">Terms of Service</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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

        {/* Investment Preferences for Investors */}
        {user?.userType === 'investor' && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Investment Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Investment Range</span>
                <span className="font-medium text-white">₹{settings.investment.investmentRange}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Preferred Sectors</span>
                <div className="flex space-x-1">
                  {settings.investment.preferredSectors.map((sector, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-600/20 text-blue-400 text-xs border-blue-600/30">
                      {sector.charAt(0).toUpperCase() + sector.slice(1)}
                  </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Risk Appetite</span>
                <span className="font-medium text-white capitalize">{settings.investment.riskLevel}</span>
              </div>
            </div>
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
            onClick={() => setIsSettingsOpen(true)}
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
