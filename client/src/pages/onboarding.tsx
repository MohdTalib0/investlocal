import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative h-screen bg-gradient-to-br from-primary to-blue-800 overflow-hidden">
      {/* Background image overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.8), rgba(30, 64, 175, 0.9)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200')`,
        }}
      />
      
      {/* Status Bar Mockup */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-12 text-white">
        <span className="text-sm font-medium">9:41</span>
        <div className="flex space-x-1">
          <div className="w-4 h-2 bg-white rounded-sm"></div>
          <div className="w-4 h-2 bg-white rounded-sm"></div>
          <div className="w-4 h-2 bg-white opacity-50 rounded-sm"></div>
          <div className="text-sm">🔋</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 -mt-16">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="text-6xl text-white">🤝</div>
        </div>
        
        <h1 className="text-4xl font-bold text-white text-center mb-4">InvestLocal</h1>
        <p className="text-xl text-blue-100 text-center mb-2">Connecting Local Entrepreneurs</p>
        <p className="text-xl text-blue-100 text-center mb-12">with Smart Investors</p>
        
        <div className="text-center text-blue-100 mb-12">
          <p className="text-lg mb-2">🏢 Barabanki • Lucknow</p>
          <p className="text-sm">Trusted Local Investment Platform</p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/30 to-transparent z-10">
        <Button 
          onClick={() => setLocation("/user-type")}
          className="w-full bg-white text-primary font-semibold py-4 rounded-xl mb-4 shadow-lg hover:bg-gray-50 transition-colors"
        >
          Get Started
        </Button>
        <p className="text-center text-blue-100 text-sm">
          Already have an account? 
          <span 
            className="underline font-medium cursor-pointer ml-1" 
            onClick={() => setLocation("/register")}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}
