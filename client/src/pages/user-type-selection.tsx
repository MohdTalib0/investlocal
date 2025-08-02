import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, TrendingUp } from "lucide-react";

export default function UserTypeSelectionPage() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<'entrepreneur' | 'investor' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      setLocation(`/register?type=${selectedType}`);
    }
  };

  return (
    <div className="p-6 pt-16 min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-4xl mb-4">🤝</div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Choose Your Role</h2>
        <p className="text-neutral-500">How would you like to use InvestLocal?</p>
      </div>

      {/* User Type Cards */}
      <div className="space-y-6 mb-8">
        {/* Entrepreneur Card */}
        <div 
          className={`border-2 rounded-2xl p-6 transition-colors cursor-pointer ${
            selectedType === 'entrepreneur' 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-200 hover:border-primary'
          }`}
          onClick={() => setSelectedType('entrepreneur')}
        >
          <div className="flex items-start space-x-4">
            <div className="bg-secondary/10 p-3 rounded-xl">
              <Lightbulb className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">I'm an Entrepreneur</h3>
              <p className="text-neutral-600 mb-3">Looking for funding to grow my business</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-lg">Post Opportunities</span>
                <span className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-lg">Find Investors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investor Card */}
        <div 
          className={`border-2 rounded-2xl p-6 transition-colors cursor-pointer ${
            selectedType === 'investor' 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-200 hover:border-primary'
          }`}
          onClick={() => setSelectedType('investor')}
        >
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">I'm an Investor</h3>
              <p className="text-neutral-600 mb-3">Looking to invest in local businesses</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg">Browse Opportunities</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg">Connect with Entrepreneurs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-4">
        <Button 
          variant="outline"
          className="flex-1 text-black"
          onClick={() => setLocation("/onboarding")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          className="flex-1"
          onClick={handleContinue}
          disabled={!selectedType}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
