import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Shield, 
  Star, 
  CheckCircle,
  Play,
  Sparkles,
  Heart,
  Zap
} from "lucide-react";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Smart Investments",
      description: "Discover high-potential local businesses with proven track records"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Trusted",
      description: "KYC verified entrepreneurs and secure investment tracking"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Local Community",
      description: "Connect with entrepreneurs and investors in your area"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Status Bar */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-12">
        <div className="flex space-x-1">
  
          <div className="w-4 h-2 bg-gray-400 rounded-sm"></div>

        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        {/* Hero Section */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative inline-block mb-6">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg">
              <div className="text-6xl">🤝</div>
            </div>
            <div className="absolute -top-2 -right-2 bg-yellow-500 p-2 rounded-full animate-bounce">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            InvestLocal
          </h1>
          <p className="text-xl text-gray-300 mb-2">Connecting Local Entrepreneurs</p>
          <p className="text-xl text-gray-300 mb-8">with Smart Investors</p>


        {/* Interactive Feature Showcase */}
        <div className="w-full max-w-md mb-12">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full text-white animate-pulse">
                {features[currentFeature].icon}
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white text-center mb-2">
              {features[currentFeature].title}
            </h3>
            <p className="text-gray-400 text-center text-sm">
              {features[currentFeature].description}
            </p>
            <div className="flex justify-center space-x-2 mt-4">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-purple-400 ${
                    index === currentFeature ? 'bg-purple-400 w-6' : 'bg-gray-600'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-12 w-full max-w-md">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
            <div className="text-2xl font-bold text-purple-400 mb-1">50+</div>
            <div className="text-xs text-gray-400">Businesses</div>
          </div>
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
            <div className="text-2xl font-bold text-pink-400 mb-1">₹2Cr+</div>
            <div className="text-xs text-gray-400">Invested</div>
          </div>
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm border border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
            <div className="text-2xl font-bold text-blue-400 mb-1">95%</div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-700">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-white">KYC Verified</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-700">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white">Secure</span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 p-8 bg-gradient-to-t from-black/90 to-transparent">
        <div className="space-y-4">
          <Button 
            onClick={() => setLocation("/user-type")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <span>Get Started</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="outline"
              className="flex-1 bg-gray-900/80 backdrop-blur-sm border-gray-600 text-blue-400 hover:bg-gray-800 rounded-xl py-3 transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                // Demo functionality - could open a modal or video
               
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Demo
            </Button>
            <Button 
              variant="outline"
              className="flex-1 bg-gray-900/80 backdrop-blur-sm border-gray-600 text-purple-400 hover:bg-gray-800 rounded-xl py-3 transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                // Learn more functionality
                
              }}
            >
              <Heart className="h-4 w-4 mr-2" />
              Learn More
            </Button>
          </div>
          
          <p className="text-center text-gray-400 text-sm">
            Already have an account? 
            <span 
              className="text-purple-400 font-medium cursor-pointer ml-1 hover:underline" 
              onClick={() => setLocation("/register")}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button 
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black rounded-full w-14 h-14 shadow-lg transition-all duration-300 transform hover:scale-110 animate-pulse"
          onClick={() => {
            // Quick action functionality
            alert('Quick action! What would you like to do? ⚡');
          }}
        >
          <Zap className="h-6 w-6" />
        </Button>
      </div>
      </div>
    </div>
  );
}
