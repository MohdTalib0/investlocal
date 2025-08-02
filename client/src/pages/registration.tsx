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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { authService } from "@/lib/auth";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  city: z.string().min(1, "City is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.enum(['entrepreneur', 'investor']),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const { toast } = useToast();

  // Get user type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get('type') as 'entrepreneur' | 'investor' || 'entrepreneur';

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      userType,
      agreeToTerms: false,
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
      setLocation("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
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
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <div>
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-gray-400">Welcome back to InvestLocal</p>
          </div>
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
        <div>
          <h2 className="text-xl font-bold text-white">Create Account</h2>
          <p className="text-sm text-gray-400">Join InvestLocal today</p>
        </div>
      </div>

      {/* Registration Form */}
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

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

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
