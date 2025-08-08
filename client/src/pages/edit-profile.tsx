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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Camera,
  X,
  User,
  DollarSign,
  Target,
  Clock,
  TrendingUp,
  Building,
  Lightbulb,
  Shield,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  Upload,
  AlertTriangle,
  Trash2,
  Download
} from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";

// Extended schema for all user types
const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100, "Name is too long"),
  bio: z.string().max(500, "Bio is too long").optional(),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(10, "Valid phone number is required").regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  avatar: z.string().optional(),
  
  // Investment preferences (for investors)
  investmentAmount: z.string().optional(),
  riskTolerance: z.string().optional(),
  preferredSectors: z.array(z.string()).max(10, "Maximum 10 sectors allowed").optional(),
  investmentHorizon: z.string().optional(),
  experienceLevel: z.string().optional(),
  investmentGoals: z.array(z.string()).max(5, "Maximum 5 goals allowed").optional(),
  
  // Business interests (for entrepreneurs)
  businessInterests: z.array(z.string()).max(10, "Maximum 10 interests allowed").optional(),
  businessStage: z.string().optional(),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

const sectors = [
  "Tech Startups", "Fintech", "Healthtech", "EdTech", "Food & Beverage",
  "Agriculture", "Manufacturing", "Services", "Retail", "E-commerce",
  "Real Estate", "Transportation", "Energy", "Entertainment", "Sports",
  "Fashion", "Beauty", "Travel", "Education", "Healthcare"
];

const businessStages = [
  "Idea Stage", "MVP Development", "Early Traction", "Growth Stage", 
  "Scaling", "Established Business", "Mature Business"
];

const experienceLevels = [
  "Beginner", "Intermediate", "Advanced", "Expert"
];

const riskTolerances = [
  "Low", "Moderate", "High", "Very High"
];

const investmentHorizons = [
  "1-2 years", "2-4 years", "4-6 years", "6-8 years", "8+ years"
];

const investmentAmounts = [
  "50K-1L", "1L-5L", "5L-10L", "10L-25L", "25L-50L", "50L-1Cr", "1Cr+"
];

const investmentGoals = [
  "Capital Appreciation", "Regular Income", "Portfolio Diversification",
  "Supporting Innovation", "Social Impact", "Tax Benefits", "Learning Experience"
];

const businessInterests = [
  "SaaS", "Mobile Apps", "E-commerce", "Marketplace", "AI/ML", "Blockchain",
  "IoT", "Clean Energy", "Healthcare", "Education", "Food & Beverage",
  "Fashion", "Real Estate", "Transportation", "Entertainment", "Sports"
];

export default function EditProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me");
      return response.json();
    },
  });

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      city: "",
      phone: "",
      investmentAmount: "",
      riskTolerance: "",
      preferredSectors: [],
      investmentHorizon: "",
      experienceLevel: "",
      investmentGoals: [],
      businessInterests: [],
      businessStage: "",
    },
  });

  // Update form defaults when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        city: profile.city || "",
        phone: profile.phone || "",
        investmentAmount: profile.investmentAmount || "",
        riskTolerance: profile.riskTolerance || "",
        preferredSectors: profile.preferredSectors || [],
        investmentHorizon: profile.investmentHorizon || "",
        experienceLevel: profile.experienceLevel || "",
        investmentGoals: profile.investmentGoals || [],
        businessInterests: profile.businessInterests || [],
        businessStage: profile.businessStage || "",
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
      setLocation("/profile");
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoUpload = async (): Promise<string | null> => {
    if (!selectedPhoto) return null;
    
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedPhoto);
      
      const response = await authenticatedApiRequest("POST", "/api/upload", formData);
      const result = await response.json();
      
      if (result.url) {
        return result.url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Photo upload failed",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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

  const addSector = (sector: string) => {
    const current = form.getValues("preferredSectors") || [];
    if (!current.includes(sector)) {
      form.setValue("preferredSectors", [...current, sector]);
    }
  };

  const removeSector = (sector: string) => {
    const current = form.getValues("preferredSectors") || [];
    form.setValue("preferredSectors", current.filter(s => s !== sector));
  };

  const addGoal = (goal: string) => {
    const current = form.getValues("investmentGoals") || [];
    if (!current.includes(goal)) {
      form.setValue("investmentGoals", [...current, goal]);
    }
  };

  const removeGoal = (goal: string) => {
    const current = form.getValues("investmentGoals") || [];
    form.setValue("investmentGoals", current.filter(g => g !== goal));
  };

  const addBusinessInterest = (interest: string) => {
    const current = form.getValues("businessInterests") || [];
    if (!current.includes(interest)) {
      form.setValue("businessInterests", [...current, interest]);
    }
  };

  const removeBusinessInterest = (interest: string) => {
    const current = form.getValues("businessInterests") || [];
    form.setValue("businessInterests", current.filter(i => i !== interest));
  };

  // Account management functions
  const handleDownloadData = () => {
    const userData = {
      profile: profile,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investlocal-profile-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Downloaded",
      description: "Your profile data has been downloaded successfully.",
    });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // This would typically call an API endpoint to delete the account
      toast({
        title: "Account Deletion",
        description: "Account deletion feature will be available soon. Please contact support for assistance.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/profile")}
              className="text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Edit Profile</h1>
              <p className="text-sm text-gray-400">Update your information</p>
            </div>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateProfile.isPending || isUploadingPhoto}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateProfile.isPending || isUploadingPhoto ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-600 bg-gray-700 flex items-center justify-center overflow-hidden">
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
                      <span className="text-4xl font-bold text-gray-400">
                        {profile?.fullName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload button overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    disabled={isUploadingPhoto}
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                  
                  {/* Remove button */}
                  {(photoPreview || profile?.avatar) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-0 right-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                      disabled={isUploadingPhoto}
                    >
                      <X className="h-4 w-4 text-white" />
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
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
                    disabled={isUploadingPhoto}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                  </button>
                  <p className="text-gray-400 text-xs mt-1">
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-white">Full Name</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    className="mt-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Enter your full name"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-red-400 mt-1">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    className="mt-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    placeholder="Enter your phone number"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-400 mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="city" className="text-white">City</Label>
                <Select onValueChange={(value) => form.setValue("city", value)} defaultValue={form.getValues("city")}>
                  <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-gray-700 border-gray-600">
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
                    <SelectItem value="Lucknow">Lucknow, Uttar Pradesh</SelectItem>
                    <SelectItem value="Kanpur">Kanpur, Uttar Pradesh</SelectItem>
                    <SelectItem value="Nagpur">Nagpur, Maharashtra</SelectItem>
                    <SelectItem value="Indore">Indore, Madhya Pradesh</SelectItem>
                    <SelectItem value="Thane">Thane, Maharashtra</SelectItem>
                    <SelectItem value="Bhopal">Bhopal, Madhya Pradesh</SelectItem>
                    <SelectItem value="Visakhapatnam">Visakhapatnam, Andhra Pradesh</SelectItem>
                    <SelectItem value="Pimpri-Chinchwad">Pimpri-Chinchwad, Maharashtra</SelectItem>
                    <SelectItem value="Patna">Patna, Bihar</SelectItem>
                    <SelectItem value="Vadodara">Vadodara, Gujarat</SelectItem>
                    <SelectItem value="Ghaziabad">Ghaziabad, Uttar Pradesh</SelectItem>
                    <SelectItem value="Ludhiana">Ludhiana, Punjab</SelectItem>
                    <SelectItem value="Agra">Agra, Uttar Pradesh</SelectItem>
                    <SelectItem value="Nashik">Nashik, Maharashtra</SelectItem>
                    <SelectItem value="Faridabad">Faridabad, Haryana</SelectItem>
                    <SelectItem value="Meerut">Meerut, Uttar Pradesh</SelectItem>
                    <SelectItem value="Rajkot">Rajkot, Gujarat</SelectItem>
                    <SelectItem value="Kalyan-Dombivali">Kalyan-Dombivali, Maharashtra</SelectItem>
                    <SelectItem value="Vasai-Virar">Vasai-Virar, Maharashtra</SelectItem>
                    <SelectItem value="Varanasi">Varanasi, Uttar Pradesh</SelectItem>
                    <SelectItem value="Srinagar">Srinagar, Jammu & Kashmir</SelectItem>
                    <SelectItem value="Aurangabad">Aurangabad, Maharashtra</SelectItem>
                    <SelectItem value="Dhanbad">Dhanbad, Jharkhand</SelectItem>
                    <SelectItem value="Amritsar">Amritsar, Punjab</SelectItem>
                    <SelectItem value="Allahabad">Allahabad, Uttar Pradesh</SelectItem>
                    <SelectItem value="Ranchi">Ranchi, Jharkhand</SelectItem>
                    <SelectItem value="Howrah">Howrah, West Bengal</SelectItem>
                    <SelectItem value="Coimbatore">Coimbatore, Tamil Nadu</SelectItem>
                    <SelectItem value="Jabalpur">Jabalpur, Madhya Pradesh</SelectItem>
                    <SelectItem value="Gwalior">Gwalior, Madhya Pradesh</SelectItem>
                    <SelectItem value="Vijayawada">Vijayawada, Andhra Pradesh</SelectItem>
                    <SelectItem value="Jodhpur">Jodhpur, Rajasthan</SelectItem>
                    <SelectItem value="Madurai">Madurai, Tamil Nadu</SelectItem>
                    <SelectItem value="Raipur">Raipur, Chhattisgarh</SelectItem>
                    <SelectItem value="Kota">Kota, Rajasthan</SelectItem>
                    <SelectItem value="Guwahati">Guwahati, Assam</SelectItem>
                    <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                    <SelectItem value="Solapur">Solapur, Maharashtra</SelectItem>
                    <SelectItem value="Hubli-Dharwad">Hubli-Dharwad, Karnataka</SelectItem>
                    <SelectItem value="Bareilly">Bareilly, Uttar Pradesh</SelectItem>
                    <SelectItem value="Moradabad">Moradabad, Uttar Pradesh</SelectItem>
                    <SelectItem value="Mysore">Mysore, Karnataka</SelectItem>
                    <SelectItem value="Gurgaon">Gurgaon, Haryana</SelectItem>
                    <SelectItem value="Aligarh">Aligarh, Uttar Pradesh</SelectItem>
                    <SelectItem value="Jalandhar">Jalandhar, Punjab</SelectItem>
                    <SelectItem value="Tiruchirappalli">Tiruchirappalli, Tamil Nadu</SelectItem>
                    <SelectItem value="Bhubaneswar">Bhubaneswar, Odisha</SelectItem>
                    <SelectItem value="Salem">Salem, Tamil Nadu</SelectItem>
                    <SelectItem value="Warangal">Warangal, Telangana</SelectItem>
                    <SelectItem value="Guntur">Guntur, Andhra Pradesh</SelectItem>
                    <SelectItem value="Bhiwandi">Bhiwandi, Maharashtra</SelectItem>
                    <SelectItem value="Saharanpur">Saharanpur, Uttar Pradesh</SelectItem>
                    <SelectItem value="Gorakhpur">Gorakhpur, Uttar Pradesh</SelectItem>
                    <SelectItem value="Bikaner">Bikaner, Rajasthan</SelectItem>
                    <SelectItem value="Amravati">Amravati, Maharashtra</SelectItem>
                    <SelectItem value="Noida">Noida, Uttar Pradesh</SelectItem>
                    <SelectItem value="Jamshedpur">Jamshedpur, Jharkhand</SelectItem>
                    <SelectItem value="Bhilai">Bhilai, Chhattisgarh</SelectItem>
                    <SelectItem value="Cuttack">Cuttack, Odisha</SelectItem>
                    <SelectItem value="Firozabad">Firozabad, Uttar Pradesh</SelectItem>
                    <SelectItem value="Kochi">Kochi, Kerala</SelectItem>
                    <SelectItem value="Nellore">Nellore, Andhra Pradesh</SelectItem>
                    <SelectItem value="Bhavnagar">Bhavnagar, Gujarat</SelectItem>
                    <SelectItem value="Dehradun">Dehradun, Uttarakhand</SelectItem>
                    <SelectItem value="Durgapur">Durgapur, West Bengal</SelectItem>
                    <SelectItem value="Asansol">Asansol, West Bengal</SelectItem>
                    <SelectItem value="Rourkela">Rourkela, Odisha</SelectItem>
                    <SelectItem value="Nanded">Nanded, Maharashtra</SelectItem>
                    <SelectItem value="Kolhapur">Kolhapur, Maharashtra</SelectItem>
                    <SelectItem value="Ajmer">Ajmer, Rajasthan</SelectItem>
                    <SelectItem value="Akola">Akola, Maharashtra</SelectItem>
                    <SelectItem value="Gulbarga">Gulbarga, Karnataka</SelectItem>
                    <SelectItem value="Jamnagar">Jamnagar, Gujarat</SelectItem>
                    <SelectItem value="Ujjain">Ujjain, Madhya Pradesh</SelectItem>
                    <SelectItem value="Loni">Loni, Uttar Pradesh</SelectItem>
                    <SelectItem value="Siliguri">Siliguri, West Bengal</SelectItem>
                    <SelectItem value="Jhansi">Jhansi, Uttar Pradesh</SelectItem>
                    <SelectItem value="Ulhasnagar">Ulhasnagar, Maharashtra</SelectItem>
                    <SelectItem value="Jammu">Jammu, Jammu & Kashmir</SelectItem>
                    <SelectItem value="Sangli-Miraj">Sangli-Miraj, Maharashtra</SelectItem>
                    <SelectItem value="Mangalore">Mangalore, Karnataka</SelectItem>
                    <SelectItem value="Erode">Erode, Tamil Nadu</SelectItem>
                    <SelectItem value="Belgaum">Belgaum, Karnataka</SelectItem>
                    <SelectItem value="Ambattur">Ambattur, Tamil Nadu</SelectItem>
                    <SelectItem value="Tirunelveli">Tirunelveli, Tamil Nadu</SelectItem>
                    <SelectItem value="Malegaon">Malegaon, Maharashtra</SelectItem>
                    <SelectItem value="Gaya">Gaya, Bihar</SelectItem>
                    <SelectItem value="Jalgaon">Jalgaon, Maharashtra</SelectItem>
                    <SelectItem value="Udaipur">Udaipur, Rajasthan</SelectItem>
                    <SelectItem value="Maheshtala">Maheshtala, West Bengal</SelectItem>
                    <SelectItem value="Tirupur">Tirupur, Tamil Nadu</SelectItem>
                    <SelectItem value="Davanagere">Davanagere, Karnataka</SelectItem>
                    <SelectItem value="Kozhikode">Kozhikode, Kerala</SelectItem>
                    <SelectItem value="Kurnool">Kurnool, Andhra Pradesh</SelectItem>
                    <SelectItem value="Rajpur">Rajpur, West Bengal</SelectItem>
                    <SelectItem value="Bokaro">Bokaro, Jharkhand</SelectItem>
                    <SelectItem value="South Dumdum">South Dumdum, West Bengal</SelectItem>
                    <SelectItem value="Bellary">Bellary, Karnataka</SelectItem>
                    <SelectItem value="Patiala">Patiala, Punjab</SelectItem>
                    <SelectItem value="Gopalpur">Gopalpur, West Bengal</SelectItem>
                    <SelectItem value="Agartala">Agartala, Tripura</SelectItem>
                    <SelectItem value="Bhagalpur">Bhagalpur, Bihar</SelectItem>
                    <SelectItem value="Muzaffarnagar">Muzaffarnagar, Uttar Pradesh</SelectItem>
                    <SelectItem value="Bhatpara">Bhatpara, West Bengal</SelectItem>
                    <SelectItem value="Panihati">Panihati, West Bengal</SelectItem>
                    <SelectItem value="Latur">Latur, Maharashtra</SelectItem>
                    <SelectItem value="Dhule">Dhule, Maharashtra</SelectItem>
                    <SelectItem value="Rohtak">Rohtak, Haryana</SelectItem>
                    <SelectItem value="Korba">Korba, Chhattisgarh</SelectItem>
                    <SelectItem value="Bhilwara">Bhilwara, Rajasthan</SelectItem>
                    <SelectItem value="Brahmapur">Brahmapur, Odisha</SelectItem>
                    <SelectItem value="Muzaffarpur">Muzaffarpur, Bihar</SelectItem>
                    <SelectItem value="Ahmednagar">Ahmednagar, Maharashtra</SelectItem>
                    <SelectItem value="Mathura">Mathura, Uttar Pradesh</SelectItem>
                    <SelectItem value="Kollam">Kollam, Kerala</SelectItem>
                    <SelectItem value="Avadi">Avadi, Tamil Nadu</SelectItem>
                    <SelectItem value="Kadapa">Kadapa, Andhra Pradesh</SelectItem>
                    <SelectItem value="Anantapuram">Anantapuram, Andhra Pradesh</SelectItem>
                    <SelectItem value="Tiruvottiyur">Tiruvottiyur, Tamil Nadu</SelectItem>
                    <SelectItem value="Barddhaman">Barddhaman, West Bengal</SelectItem>
                    <SelectItem value="Kamarhati">Kamarhati, West Bengal</SelectItem>
                    <SelectItem value="Saharsa">Saharsa, Bihar</SelectItem>
                    <SelectItem value="Dewas">Dewas, Madhya Pradesh</SelectItem>
                    <SelectItem value="Satna">Satna, Madhya Pradesh</SelectItem>
                    <SelectItem value="Bikaner">Bikaner, Rajasthan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.city && (
                  <p className="text-sm text-red-400 mt-1">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <Textarea
                  id="bio"
                  {...form.register("bio")}
                  className="mt-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">
                    {form.watch("bio")?.length || 0}/500 characters
                  </p>
                  {form.formState.errors.bio && (
                    <p className="text-sm text-red-400">{form.formState.errors.bio.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific sections */}
          {user?.userType === 'investor' && (
            <>
              {/* Investment Preferences */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Investment Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="investmentAmount" className="text-white">Investment Amount Range</Label>
                      <Select onValueChange={(value) => form.setValue("investmentAmount", value)} defaultValue={form.getValues("investmentAmount")}>
                        <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select investment range" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {investmentAmounts.map((amount) => (
                            <SelectItem key={amount} value={amount}>{amount}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="riskTolerance" className="text-white">Risk Tolerance</Label>
                      <Select onValueChange={(value) => form.setValue("riskTolerance", value)} defaultValue={form.getValues("riskTolerance")}>
                        <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {riskTolerances.map((risk) => (
                            <SelectItem key={risk} value={risk}>{risk}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="investmentHorizon" className="text-white">Investment Horizon</Label>
                      <Select onValueChange={(value) => form.setValue("investmentHorizon", value)} defaultValue={form.getValues("investmentHorizon")}>
                        <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select time horizon" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {investmentHorizons.map((horizon) => (
                            <SelectItem key={horizon} value={horizon}>{horizon}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="experienceLevel" className="text-white">Experience Level</Label>
                      <Select onValueChange={(value) => form.setValue("experienceLevel", value)} defaultValue={form.getValues("experienceLevel")}>
                        <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {experienceLevels.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Preferred Sectors</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(form.getValues("preferredSectors") || []).map((sector) => (
                          <Badge
                            key={sector}
                            variant="secondary"
                            className="bg-blue-600/20 text-blue-300 border-blue-600/30"
                          >
                            {sector}
                            <button
                              type="button"
                              onClick={() => removeSector(sector)}
                              className="ml-1 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <Select onValueChange={addSector} disabled={(form.getValues("preferredSectors") || []).length >= 10}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Add preferred sectors" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {sectors.map((sector) => (
                              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400">
                          {(form.getValues("preferredSectors") || []).length}/10
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Investment Goals</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(form.getValues("investmentGoals") || []).map((goal) => (
                          <Badge
                            key={goal}
                            variant="secondary"
                            className="bg-green-600/20 text-green-300 border-green-600/30"
                          >
                            {goal}
                            <button
                              type="button"
                              onClick={() => removeGoal(goal)}
                              className="ml-1 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <Select onValueChange={addGoal} disabled={(form.getValues("investmentGoals") || []).length >= 5}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Add investment goals" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {investmentGoals.map((goal) => (
                              <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400">
                          {(form.getValues("investmentGoals") || []).length}/5
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {user?.userType === 'entrepreneur' && (
            <>
              {/* Business Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="businessStage" className="text-white">Business Stage</Label>
                    <Select onValueChange={(value) => form.setValue("businessStage", value)} defaultValue={form.getValues("businessStage")}>
                      <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select business stage" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {businessStages.map((stage) => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Business Interests</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(form.getValues("businessInterests") || []).map((interest) => (
                          <Badge
                            key={interest}
                            variant="secondary"
                            className="bg-purple-600/20 text-purple-300 border-purple-600/30"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => removeBusinessInterest(interest)}
                              className="ml-1 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <Select onValueChange={addBusinessInterest} disabled={(form.getValues("businessInterests") || []).length >= 10}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Add business interests" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {businessInterests.map((interest) => (
                              <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400">
                          {(form.getValues("businessInterests") || []).length}/10
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>

        {/* Account Management Section */}
        <div className="space-y-6 mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
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
                  className="w-full justify-between h-auto p-3 border-red-700 hover:bg-red-900/20 bg-gray-700"
                  onClick={handleDeleteAccount}
                >
                  <div className="flex items-center space-x-3">
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">Delete Account</span>
                  </div>
                  <span className="text-red-400">→</span>
                </Button>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-1">Important Notice</h4>
                    <p className="text-yellow-300 text-sm">
                      Deleting your account will permanently remove all your data, including profile information, 
                      posts, and connections. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />
    </div>
  );
}
