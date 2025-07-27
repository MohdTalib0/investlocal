import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle } from "lucide-react";

interface BusinessListing {
  id: string;
  title: string;
  description: string;
  category: string;
  fundingMin: number;
  fundingMax: number;
  images: string[];
  views: number;
}

interface OpportunityCardProps {
  listing: BusinessListing;
  onClick: () => void;
}

export default function OpportunityCard({ listing, onClick }: OpportunityCardProps) {
  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Tech Startups": "bg-blue-100 text-blue-700",
      "Food & Beverage": "bg-green-100 text-green-700",
      "Retail": "bg-purple-100 text-purple-700",
      "Education": "bg-indigo-100 text-indigo-700",
      "Healthcare": "bg-red-100 text-red-700",
      "Manufacturing": "bg-orange-100 text-orange-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          {listing.images.length > 0 ? (
            <img 
              src={listing.images[0]} 
              alt={listing.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-2xl">🏢</div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-900 line-clamp-1">
              {listing.title}
            </h3>
            <span className="text-sm font-medium text-primary">
              {formatAmount(listing.fundingMin)}-{formatAmount(listing.fundingMax)}
            </span>
          </div>
          
          <p className="text-neutral-600 text-sm mb-2 line-clamp-2">
            {listing.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">E</span>
              </div>
              <span className="text-sm text-neutral-500">Entrepreneur</span>
              <CheckCircle className="h-3 w-3 text-green-500" />
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-xs text-neutral-500">4.8</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getCategoryColor(listing.category)}`}
              >
                {listing.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {listing.views} views
              </Badge>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-primary font-medium"
              onClick={onClick}
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
