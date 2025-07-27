import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { authService } from "@/lib/auth";

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, setLocation] = useLocation();
  const user = authService.getUser();

  const handleTabClick = (tab: string) => {
    switch (tab) {
      case "home":
        setLocation("/dashboard");
        break;
      case "search":
        setLocation("/dashboard"); // For now, same as home with search functionality
        break;
      case "add":
        if (user?.userType === 'entrepreneur') {
          setLocation("/create-listing");
        } else {
          // Investors can't post, maybe show a message or redirect to search
          setLocation("/dashboard");
        }
        break;
      case "chat":
        setLocation("/chat");
        break;
      case "profile":
        setLocation("/profile");
        break;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto px-6 py-2">
        <div className="flex justify-around">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 ${
              activeTab === "home" ? "text-primary" : "text-neutral-400"
            }`}
            onClick={() => handleTabClick("home")}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 ${
              activeTab === "search" ? "text-primary" : "text-neutral-400"
            }`}
            onClick={() => handleTabClick("search")}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs">Search</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 ${
              activeTab === "add" ? "text-primary" : "text-neutral-400"
            }`}
            onClick={() => handleTabClick("add")}
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">Post</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 ${
              activeTab === "chat" ? "text-primary" : "text-neutral-400"
            }`}
            onClick={() => handleTabClick("chat")}
          >
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-xs">Chat</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center py-2 ${
              activeTab === "profile" ? "text-primary" : "text-neutral-400"
            }`}
            onClick={() => handleTabClick("profile")}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
