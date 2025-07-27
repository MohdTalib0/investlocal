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
      <div className="p-6 pt-16 min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-4"
            onClick={() => setIsLogin(false)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Sign In</h2>
            <p className="text-sm text-neutral-500">Welcome back to InvestLocal</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...loginForm.register("email")}
              className="mt-2"
            />
            {loginForm.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...loginForm.register("password")}
              className="mt-2"
            />
            {loginForm.formState.errors.password && (
              <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-neutral-600 mt-6">
          Don't have an account? 
          <span 
            className="text-primary font-medium underline cursor-pointer ml-1" 
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon"
          className="mr-4"
          onClick={() => setLocation("/user-type")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Create Account</h2>
          <p className="text-sm text-neutral-500">Join InvestLocal today</p>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            {...form.register("fullName")}
            className="mt-2"
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
            className="mt-2"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex mt-2">
            <div className="px-3 py-2 border border-r-0 rounded-l-xl bg-gray-50 text-sm">
              +91
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              {...form.register("phone")}
              className="rounded-l-none border-l-0"
            />
          </div>
          {form.formState.errors.phone && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Select onValueChange={(value) => form.setValue("city", value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Barabanki">Barabanki</SelectItem>
              <SelectItem value="Lucknow">Lucknow</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.city && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            {...form.register("password")}
            className="mt-2"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="terms"
            checked={form.watch("agreeToTerms")}
            onCheckedChange={(checked) => form.setValue("agreeToTerms", !!checked)}
          />
          <Label htmlFor="terms" className="text-sm text-neutral-600 leading-relaxed">
            I agree to the <span className="text-primary underline">Terms of Service</span> and <span className="text-primary underline">Privacy Policy</span>
          </Label>
        </div>
        {form.formState.errors.agreeToTerms && (
          <p className="text-sm text-red-500">{form.formState.errors.agreeToTerms.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-neutral-600 mt-6">
        Already have an account? 
        <span 
          className="text-primary font-medium underline cursor-pointer ml-1" 
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </span>
      </p>
    </div>
  );
}
