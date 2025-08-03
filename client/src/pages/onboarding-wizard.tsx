import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  User, 
  Building2, 
  TrendingUp, 
  Target, 
  Users, 
  Globe,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  Camera,
  Star
} from "lucide-react";
import { authService } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import Logo from "@/components/logo";

const profileCompletionSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be less than 500 characters"),
  investmentAmount: z.string().optional(),
  riskTolerance: z.string().optional(),
  preferredSectors: z.array(z.string()).optional(),
  investmentGoals: z.array(z.string()).optional(),
  businessInterests: z.array(z.string()).optional(),
  businessStage: z.string().optional(),
});

type ProfileCompletionForm = z.infer<typeof profileCompletionSchema>;

const sectors = [
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'retail', name: 'Retail', icon: '🛍️' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
];

const goals = [
  { id: 'wealth-building', name: 'Wealth Building', icon: '📈' },
  { id: 'passive-income', name: 'Passive Income', icon: '💸' },
  { id: 'portfolio-diversification', name: 'Portfolio Diversification', icon: '🎯' },
  { id: 'social-impact', name: 'Social Impact', icon: '🌍' },
];

const businessInterests = [
  { id: 'funding', name: 'Funding', icon: '💰' },
  { id: 'mentorship', name: 'Mentorship', icon: '🎓' },
  { id: 'networking', name: 'Networking', icon: '🤝' },
  { id: 'partnerships', name: 'Partnerships', icon: '🤲' },
];

export default function OnboardingWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getUser();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 4;
  const { markOnboardingCompleted, markProfileCompleted, markPreferencesCompleted } = useOnboarding();

  const form = useForm<ProfileCompletionForm>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      bio: "",
      preferredSectors: [],
      investmentGoals: [],
      businessInterests: [],
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileCompletionForm) => {
      const response = await authenticatedApiRequest("PUT", "/api/users/me", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Profile updated!",
        description: "Your profile has been completed successfully.",
      });
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      const response = await authenticatedApiRequest("PUT", "/api/users/me", {
        isOnboardingComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      // Update localStorage with the new onboarding status
      const currentUser = authService.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, isOnboardingComplete: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      // Navigate to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    },
  });

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate bio field
      const isValid = await form.trigger(['bio']);
      if (!isValid) {
        toast({
          title: "Please complete your profile",
          description: "Please add a bio (at least 10 characters).",
          variant: "destructive",
        });
        return;
      }
      // Mark profile step as completed and advance
      markProfileCompleted();
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // Validate preferences based on user type
      const formValues = form.getValues();
      if (currentUser?.userType === 'investor') {
        if (!formValues.investmentAmount || !formValues.preferredSectors?.length) {
          toast({
            title: "Please complete your preferences",
            description: "Please select investment amount and at least one preferred sector.",
            variant: "destructive",
          });
          return;
        }
      } else if (currentUser?.userType === 'entrepreneur') {
        if (!formValues.businessInterests?.length) {
          toast({
            title: "Please complete your preferences",
            description: "Please select at least one business interest.",
            variant: "destructive",
          });
          return;
        }
      }
      // Mark preferences step as completed and advance
      markPreferencesCompleted();
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      setIsLoading(true);
      try {
        await updateProfile.mutateAsync(form.getValues());
        await completeOnboarding.mutateAsync();
        setCurrentStep(4);
      } catch (error) {
        // Onboarding completion error handled silently
        toast({
          title: "Error completing setup",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    window.location.href = "/dashboard";
  };

  const toggleSector = (sectorId: string) => {
    const current = form.watch('preferredSectors') || [];
    const updated = current.includes(sectorId)
      ? current.filter(id => id !== sectorId)
      : [...current, sectorId];
    form.setValue('preferredSectors', updated);
  };

  const toggleGoal = (goalId: string) => {
    const current = form.watch('investmentGoals') || [];
    const updated = current.includes(goalId)
      ? current.filter(id => id !== goalId)
      : [...current, goalId];
    form.setValue('investmentGoals', updated);
  };

  const toggleBusinessInterest = (interestId: string) => {
    const current = form.watch('businessInterests') || [];
    const updated = current.includes(interestId)
      ? current.filter(id => id !== interestId)
      : [...current, interestId];
    form.setValue('businessInterests', updated);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-semibold">Welcome to InvestLocal</h1>
              <p className="text-sm text-gray-400">Let's get you started</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSkip} className="text-gray-400 hover:text-white">
            Skip
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-400">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Step Content */}
        {currentStep === 1 && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="bio" className="text-white">About You</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your background, and what you're looking for..."
                  {...form.register("bio")}
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  rows={4}
                />
                {form.formState.errors.bio && (
                  <p className="text-sm text-red-400 mt-1">{form.formState.errors.bio.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && currentUser.userType === 'investor' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Investment Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white">Investment Amount Range</Label>
                <Select onValueChange={(value) => form.setValue("investmentAmount", value)}>
                  <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select investment range" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="1-5L" className="text-white hover:bg-gray-700">₹1L - ₹5L</SelectItem>
                    <SelectItem value="5-10L" className="text-white hover:bg-gray-700">₹5L - ₹10L</SelectItem>
                    <SelectItem value="10-25L" className="text-white hover:bg-gray-700">₹10L - ₹25L</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Preferred Sectors</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sectors.map((sector) => (
                    <div
                      key={sector.id}
                      onClick={() => toggleSector(sector.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        (form.watch('preferredSectors') || []).includes(sector.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{sector.icon}</span>
                        <span className="text-sm font-medium">{sector.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && currentUser.userType === 'entrepreneur' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Business Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white">What Support Are You Looking For?</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {businessInterests.map((interest) => (
                    <div
                      key={interest.id}
                      onClick={() => toggleBusinessInterest(interest.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        (form.watch('businessInterests') || []).includes(interest.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{interest.icon}</span>
                        <span className="text-sm font-medium">{interest.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Discover Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Direct Messaging</h3>
                      <p className="text-gray-400 text-sm">Connect with users through secure chat</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Like & Interest</h3>
                      <p className="text-gray-400 text-sm">Show interest in opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Bookmark className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Save Posts</h3>
                      <p className="text-gray-400 text-sm">Bookmark interesting content</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <Share2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Share & Network</h3>
                      <p className="text-gray-400 text-sm">Share with your network</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 4 && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to InvestLocal!</h3>
                <p className="text-gray-400">Your profile is complete and you're ready to start connecting.</p>
              </div>
              
                                                           <Button 
                  onClick={() => window.location.href = "/dashboard"}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Go to Dashboard
                </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex space-x-3 mt-8">
            {currentStep > 1 && (
              <Button 
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button 
              onClick={handleNextStep}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : currentStep === 3 ? "Complete Setup" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 