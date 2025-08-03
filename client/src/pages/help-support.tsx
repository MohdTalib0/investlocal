import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Phone, 
  BookOpen, 
  FileText, 
  Shield, 
  Search,
  MessageSquare,
  Users,
  DollarSign,
  Settings,
  User,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";

export default function HelpSupportPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleEmailSupport = () => {
    window.open('mailto:support@investlocal.com?subject=Help Request', '_blank');
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/919876543210?text=Hi, I need help with InvestLocal', '_blank');
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

  const faqData = {
    general: [
      {
        question: "What is InvestLocal?",
        answer: "InvestLocal is a platform that connects local entrepreneurs with investors, enabling community-driven investment opportunities and fostering local business growth."
      },
      {
        question: "How do I get started?",
        answer: "Sign up for an account, complete your profile, and choose your role as either an entrepreneur or investor. Then you can start creating posts or exploring investment opportunities."
      },
      {
        question: "Is my information secure?",
        answer: "Yes, we use industry-standard encryption and security measures to protect your personal and financial information. We never share your data with third parties without your consent."
      }
    ],
    entrepreneurs: [
      {
        question: "How do I create an investment post?",
        answer: "Navigate to the dashboard and click 'Create Post'. Choose 'Investment' as the post type and fill in the details about your investment opportunity, including funding amount, business description, and expected returns."
      },
      {
        question: "How do I verify my business?",
        answer: "Complete your business profile with accurate information, upload required documents, and our verification team will review your application within 24-48 hours."
      },
      {
        question: "How do I respond to investor interest?",
        answer: "When investors express interest, you'll receive notifications. You can view their profiles, message them directly, and manage your investment opportunities through the dashboard."
      },
      {
        question: "What documents do I need?",
        answer: "You'll need business registration documents, financial statements, business plan, and identity verification documents. Specific requirements may vary based on your business type."
      }
    ],
    investors: [
      {
        question: "How do I express interest in an investment?",
        answer: "Click on any investment post and use the 'Express Interest' button. You can also send a message to the entrepreneur directly to learn more about the opportunity."
      },
      {
        question: "How do I change my investment preferences?",
        answer: "Go to Settings & Privacy in your profile and navigate to Investment Preferences to update your risk level, investment range, and preferred sectors."
      },
      {
        question: "What are the investment minimums?",
        answer: "Investment minimums vary by opportunity, typically ranging from ₹10,000 to ₹1,00,000. Each entrepreneur sets their own minimum investment amount."
      },
      {
        question: "How do I track my investments?",
        answer: "Use the Analytics section in your profile to view your investment portfolio, track performance, and monitor your investment history."
      }
    ],
    technical: [
      {
        question: "How do I reset my password?",
        answer: "Go to Settings & Privacy in your profile and select 'Change Password'. You'll need to enter your current password and create a new one."
      },
      {
        question: "How do I update my profile?",
        answer: "Click the edit icon in your profile header to update your personal information, bio, city, and other profile details."
      },
      {
        question: "How do I report inappropriate content?",
        answer: "Use the three-dot menu on any post or user profile to report inappropriate content. Our moderation team will review reports within 24 hours."
      },
      {
        question: "How do I manage notifications?",
        answer: "Go to Settings & Privacy and navigate to Notification Settings to customize your notification preferences for different types of alerts."
      }
    ]
  };

  const filteredFAQ = Object.entries(faqData).reduce((acc, [category, questions]) => {
    const filtered = questions.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as typeof faqData);

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-blue-700"
            onClick={() => setLocation("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 mr-2" />
            Help & Support
          </h1>
          <p className="text-blue-100">Get help with your InvestLocal experience</p>
        </div>
      </div>

      {/* Quick Support Actions */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button 
            variant="outline" 
            className="h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={handleEmailSupport}
          >
            <div className="text-left">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-blue-400" />
                <span className="font-medium text-white">Email Support</span>
              </div>
              <p className="text-sm text-gray-400">Get help via email</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 border-gray-700 hover:bg-gray-800 bg-gray-800"
            onClick={handleWhatsAppSupport}
          >
            <div className="text-left">
              <div className="flex items-center mb-2">
                <MessageCircle className="h-5 w-5 mr-2 text-green-400" />
                <span className="font-medium text-white">WhatsApp Support</span>
              </div>
              <p className="text-sm text-gray-400">Chat with us on WhatsApp</p>
            </div>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-700">
            <TabsTrigger value="general" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              General
            </TabsTrigger>
            <TabsTrigger value="entrepreneurs" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Entrepreneurs
            </TabsTrigger>
            <TabsTrigger value="investors" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Investors
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Technical
            </TabsTrigger>
          </TabsList>

          {Object.entries(filteredFAQ).map(([category, questions]) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="space-y-4">
                {questions.map((item, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-400" />
                      {item.question}
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Contact Information */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-blue-400" />
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email Support</p>
                  <p className="text-white">support@investlocal.com</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">WhatsApp</p>
                  <p className="text-white">+91 98765 43210</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Business Hours</p>
                  <p className="text-white">Mon-Fri: 9 AM - 6 PM IST</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Response Time</p>
                  <p className="text-white">Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-400" />
            Resources
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start border-gray-700 hover:bg-gray-800 bg-gray-800"
              onClick={handlePrivacyPolicy}
            >
              <Shield className="h-4 w-4 mr-2 text-blue-400" />
              Privacy Policy
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start border-gray-700 hover:bg-gray-800 bg-gray-800"
              onClick={handleTermsOfService}
            >
              <FileText className="h-4 w-4 mr-2 text-blue-400" />
              Terms of Service
            </Button>
          </div>
        </div>

        {/* Support Status */}
        <div className="mt-6 bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-white font-medium">Support Status: Online</p>
              <p className="text-green-300 text-sm">Our support team is available to help you</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
} 