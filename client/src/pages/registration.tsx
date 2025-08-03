import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, DollarSign, TrendingUp, Target, Building2, Users, Globe } from "lucide-react";
import { authService } from "@/lib/auth";
import Logo from "@/components/logo";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  city: z.string().min(1, "City is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.enum(['entrepreneur', 'investor']),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
  // Investment preferences (only for investors)
  investmentAmount: z.string().optional(),
  riskTolerance: z.string().optional(),
  preferredSectors: z.array(z.string()).optional(),
  investmentHorizon: z.string().optional(),
  experienceLevel: z.string().optional(),
  investmentGoals: z.array(z.string()).optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  // Get user type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get('type') as 'entrepreneur' | 'investor' || 'entrepreneur';

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      userType,
      agreeToTerms: false,
      preferredSectors: [],
      investmentGoals: [],
    },
  });

  const loginSchema = z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(1, "Password is required"),
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: RegistrationForm) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast({
        title: "Registration successful!",
        description: "Welcome to InvestLocal",
      });
      setLocation("/onboarding-wizard");
    } catch (error) {
      // Registration error handled silently
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await authService.login(data.email, data.password);
      toast({
        title: "Login successful!",
        description: "Welcome back to InvestLocal",
      });
      setLocation("/dashboard");
    } catch (error) {
      // Login error handled silently
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate basic info
      const basicInfoValid = await form.trigger(['fullName', 'email', 'phone', 'city', 'password']);
      if (basicInfoValid) {
        setCurrentStep(2);
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const toggleSector = (sector: string) => {
    const currentSectors = form.watch('preferredSectors') || [];
    const updatedSectors = currentSectors.includes(sector)
      ? currentSectors.filter(s => s !== sector)
      : [...currentSectors, sector];
    form.setValue('preferredSectors', updatedSectors);
  };

  const toggleGoal = (goal: string) => {
    const currentGoals = form.watch('investmentGoals') || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    form.setValue('investmentGoals', updatedGoals);
  };

  const sectors = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'retail', name: 'Retail', icon: '🛍️' },
    { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
    { id: 'real-estate', name: 'Real Estate', icon: '🏢' },
    { id: 'food-beverage', name: 'Food & Beverage', icon: '🍽️' },
    { id: 'transportation', name: 'Transportation', icon: '🚗' },
    { id: 'energy', name: 'Energy', icon: '⚡' },
    { id: 'agriculture', name: 'Agriculture', icon: '🌾' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  ];

  const goals = [
    { id: 'wealth-building', name: 'Wealth Building', icon: '📈' },
    { id: 'passive-income', name: 'Passive Income', icon: '💸' },
    { id: 'portfolio-diversification', name: 'Portfolio Diversification', icon: '🎯' },
    { id: 'social-impact', name: 'Social Impact', icon: '🌍' },
    { id: 'tax-benefits', name: 'Tax Benefits', icon: '📋' },
    { id: 'learning-experience', name: 'Learning Experience', icon: '🎓' },
  ];

  if (isLogin) {
    return (
      <div className="p-6 pt-16 min-h-screen bg-black">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-4 text-white hover:bg-gray-800"
            onClick={() => setIsLogin(false)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg">
              <div className="text-6xl">🤝</div>
            </div>
          </div>
          
          <div className="mb-4">
            <Logo size="xl" />
          </div>
          <p className="text-xl text-gray-300 mb-2">Connecting Local Entrepreneurs</p>
          <p className="text-xl text-gray-300 mb-8">with Smart Investors</p>
        </div>

        {/* Login Form */}
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-white">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...loginForm.register("email")}
              className="mt-2 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
            {loginForm.formState.errors.email && (
              <p className="text-sm text-red-400 mt-1">{loginForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...loginForm.register("password")}
              className="mt-2 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
            {loginForm.formState.errors.password && (
              <p className="text-sm text-red-400 mt-1">{loginForm.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-gray-400 mt-6">
          Don't have an account? 
          <span 
            className="text-blue-400 font-medium underline cursor-pointer ml-1" 
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </span>
        </p>
      </div>
    );
  }

  return (
     <div className="p-6 pt-16 min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon"
           className="mr-4 text-white hover:bg-gray-800"
          onClick={() => setLocation("/user-type")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
       </div>

       {/* Hero Section */}
       <div className="text-center mb-8">
         <div className="relative inline-block mb-6">
           <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg">
             <div className="text-6xl">🤝</div>
        </div>
      </div>

         <div className="mb-4">
           <Logo size="xl" />
         </div>
         <p className="text-xl text-gray-300 mb-2">Connecting Local Entrepreneurs</p>
         <p className="text-xl text-gray-300 mb-8">with Smart Investors</p>
       </div>

      {/* Step Indicator */}
      {userType === 'investor' && (
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 ? (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="fullName" className="text-white">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            {...form.register("fullName")}
            className="mt-2 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-red-400 mt-1">{form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-white">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
            className="mt-2 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-400 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-white">Phone Number</Label>
          <div className="flex mt-2">
            <div className="px-3 py-2 border border-r-0 rounded-l-xl bg-gray-800 text-sm text-white border-gray-600">
              +91
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              {...form.register("phone")}
              className="rounded-l-none border-l-0 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          {form.formState.errors.phone && (
            <p className="text-sm text-red-400 mt-1">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city" className="text-white">City</Label>
          <Select onValueChange={(value) => form.setValue("city", value)}>
            <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent className="max-h-60 bg-gray-800 border-gray-600">
              {/* Major Metropolitan Cities */}
              <SelectItem value="Mumbai" className="text-white hover:bg-gray-700">Mumbai, Maharashtra</SelectItem>
              <SelectItem value="Delhi" className="text-white hover:bg-gray-700">Delhi</SelectItem>
              <SelectItem value="Bangalore" className="text-white hover:bg-gray-700">Bangalore, Karnataka</SelectItem>
              <SelectItem value="Hyderabad" className="text-white hover:bg-gray-700">Hyderabad, Telangana</SelectItem>
              <SelectItem value="Chennai" className="text-white hover:bg-gray-700">Chennai, Tamil Nadu</SelectItem>
              <SelectItem value="Kolkata" className="text-white hover:bg-gray-700">Kolkata, West Bengal</SelectItem>
              <SelectItem value="Pune" className="text-white hover:bg-gray-700">Pune, Maharashtra</SelectItem>
              <SelectItem value="Ahmedabad" className="text-white hover:bg-gray-700">Ahmedabad, Gujarat</SelectItem>
              <SelectItem value="Jaipur" className="text-white hover:bg-gray-700">Jaipur, Rajasthan</SelectItem>
              <SelectItem value="Surat" className="text-white hover:bg-gray-700">Surat, Gujarat</SelectItem>
              
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
          <Label htmlFor="password" className="text-white">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            {...form.register("password")}
            className="mt-2 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-400 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="terms"
            checked={form.watch("agreeToTerms")}
            onCheckedChange={(checked) => form.setValue("agreeToTerms", !!checked)}
            className="border-gray-600"
          />
          <Label htmlFor="terms" className="text-sm text-gray-400 leading-relaxed">
            I agree to the <span className="text-blue-400 underline">Terms of Service</span> and <span className="text-blue-400 underline">Privacy Policy</span>
          </Label>
        </div>
        {form.formState.errors.agreeToTerms && (
          <p className="text-sm text-red-400">{form.formState.errors.agreeToTerms.message}</p>
        )}

        {userType === 'investor' ? (
          <Button 
            type="button" 
            onClick={handleNextStep}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Next: Investment Preferences
          </Button>
        ) : (
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
        )}
      </form>
      ) : (
        // Investment Preferences Step
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Investment Preferences</h2>
            <p className="text-gray-400">Help us match you with the right opportunities</p>
          </div>

          {/* Investment Amount */}
          <div>
            <Label className="text-white flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Investment Amount Range
            </Label>
            <Select onValueChange={(value) => form.setValue("investmentAmount", value)}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select investment range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="1-5L" className="text-white hover:bg-gray-700">₹1L - ₹5L</SelectItem>
                <SelectItem value="5-10L" className="text-white hover:bg-gray-700">₹5L - ₹10L</SelectItem>
                <SelectItem value="10-25L" className="text-white hover:bg-gray-700">₹10L - ₹25L</SelectItem>
                <SelectItem value="25-50L" className="text-white hover:bg-gray-700">₹25L - ₹50L</SelectItem>
                <SelectItem value="50L-1Cr" className="text-white hover:bg-gray-700">₹50L - ₹1Cr</SelectItem>
                <SelectItem value="1Cr+" className="text-white hover:bg-gray-700">₹1Cr+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Tolerance */}
          <div>
            <Label className="text-white flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Risk Tolerance
            </Label>
            <Select onValueChange={(value) => form.setValue("riskTolerance", value)}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="conservative" className="text-white hover:bg-gray-700">Conservative (Low Risk)</SelectItem>
                <SelectItem value="moderate" className="text-white hover:bg-gray-700">Moderate (Balanced)</SelectItem>
                <SelectItem value="aggressive" className="text-white hover:bg-gray-700">Aggressive (High Risk)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Investment Horizon */}
          <div>
            <Label className="text-white flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Investment Horizon
            </Label>
            <Select onValueChange={(value) => form.setValue("investmentHorizon", value)}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select time horizon" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="1-2years" className="text-white hover:bg-gray-700">1-2 years</SelectItem>
                <SelectItem value="3-5years" className="text-white hover:bg-gray-700">3-5 years</SelectItem>
                <SelectItem value="5-10years" className="text-white hover:bg-gray-700">5-10 years</SelectItem>
                <SelectItem value="10+years" className="text-white hover:bg-gray-700">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience Level */}
          <div>
            <Label className="text-white flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Investment Experience
            </Label>
            <Select onValueChange={(value) => form.setValue("experienceLevel", value)}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="beginner" className="text-white hover:bg-gray-700">Beginner (0-2 years)</SelectItem>
                <SelectItem value="intermediate" className="text-white hover:bg-gray-700">Intermediate (2-5 years)</SelectItem>
                <SelectItem value="advanced" className="text-white hover:bg-gray-700">Advanced (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Sectors */}
          <div>
            <Label className="text-white flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Preferred Sectors (Select multiple)
            </Label>
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

          {/* Investment Goals */}
          <div>
            <Label className="text-white flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Investment Goals (Select multiple)
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    (form.watch('investmentGoals') || []).includes(goal.id)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={handlePrevStep}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </div>
      )}

      {/* Sign In Link */}
      <p className="text-center text-gray-400 mt-6">
        Already have an account? 
        <span 
          className="text-blue-400 font-medium underline cursor-pointer ml-1" 
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </span>
      </p>
    </div>
  );
}
