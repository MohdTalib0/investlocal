import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Share2, 
  Plus,
  Users,
  TrendingUp,
  Target,
  Lightbulb,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  DollarSign
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'posting' | 'engagement' | 'investment' | 'networking';
  highlight?: string;
}

const features: Feature[] = [
  {
    id: 'investment-posts',
    title: 'Investment Opportunities',
    description: 'Browse and create investment posts with detailed funding requirements, expected ROI, and business plans.',
    icon: <DollarSign className="h-6 w-6 text-green-500" />,
    category: 'investment',
    highlight: 'investment-tab'
  },
  {
    id: 'community-posts',
    title: 'Community Discussions',
    description: 'Share insights, ask questions, and engage in meaningful discussions with the local business community.',
    icon: <MessageSquare className="h-6 w-6 text-blue-500" />,
    category: 'networking',
    highlight: 'community-tab'
  },
  {
    id: 'like-interest',
    title: 'Like & Express Interest',
    description: 'Use the heart icon to like posts and the interest button to show serious investment intent.',
    icon: <Heart className="h-6 w-6 text-red-500" />,
    category: 'engagement',
    highlight: 'action-buttons'
  },
  {
    id: 'direct-messaging',
    title: 'Direct Messaging',
    description: 'Start private conversations with users through our secure chat system for detailed discussions.',
    icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
    category: 'networking',
    highlight: 'chat-button'
  },
  {
    id: 'save-bookmark',
    title: 'Save Posts',
    description: 'Bookmark interesting posts to revisit later. Access your saved content from your profile.',
    icon: <Bookmark className="h-6 w-6 text-yellow-500" />,
    category: 'engagement',
    highlight: 'bookmark-button'
  },
  {
    id: 'share-network',
    title: 'Share & Network',
    description: 'Share posts with your network to help others discover great opportunities.',
    icon: <Share2 className="h-6 w-6 text-orange-500" />,
    category: 'networking',
    highlight: 'share-button'
  },
  {
    id: 'create-posts',
    title: 'Create Posts',
    description: 'Share your business opportunities, insights, or community updates with the platform.',
    icon: <Plus className="h-6 w-6 text-green-500" />,
    category: 'posting',
    highlight: 'create-button'
  },
  {
    id: 'analytics-tracking',
    title: 'Performance Tracking',
    description: 'Monitor your post views, engagement rates, and investment success through analytics.',
    icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
    category: 'investment',
    highlight: 'analytics-section'
  }
];

const categories = [
  { id: 'all', name: 'All Features', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'posting', name: 'Posting', icon: <Plus className="h-4 w-4" /> },
  { id: 'engagement', name: 'Engagement', icon: <Heart className="h-4 w-4" /> },
  { id: 'investment', name: 'Investment', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'networking', name: 'Networking', icon: <Users className="h-4 w-4" /> }
];

interface FeatureIntroductionProps {
  onClose: () => void;
  isVisible: boolean;
  initialFeature?: string;
}

export default function FeatureIntroduction({ onClose, isVisible, initialFeature }: FeatureIntroductionProps) {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([]);
  
  const currentUser = authService.getUser();
  const currentFeature = features[currentFeatureIndex];
  
  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);
  
  const currentFilteredIndex = filteredFeatures.findIndex(feature => feature.id === currentFeature.id);
  const progress = ((currentFilteredIndex + 1) / filteredFeatures.length) * 100;

  useEffect(() => {
    // Load completed features from localStorage
    const saved = localStorage.getItem(`completed_features_${currentUser?.id}`);
    if (saved) {
      setCompletedFeatures(JSON.parse(saved));
    }

    // Set initial feature if provided
    if (initialFeature) {
      const featureIndex = features.findIndex(f => f.id === initialFeature);
      if (featureIndex !== -1) {
        setCurrentFeatureIndex(featureIndex);
      }
    }
  }, [currentUser?.id, initialFeature]);

  const markFeatureComplete = (featureId: string) => {
    const newCompleted = [...completedFeatures, featureId];
    setCompletedFeatures(newCompleted);
    localStorage.setItem(`completed_features_${currentUser?.id}`, JSON.stringify(newCompleted));
  };

  const handleNext = () => {
    if (currentFilteredIndex < filteredFeatures.length - 1) {
      const nextFeature = filteredFeatures[currentFilteredIndex + 1];
      setCurrentFeatureIndex(features.findIndex(feature => feature.id === nextFeature.id));
    }
  };

  const handlePrev = () => {
    if (currentFilteredIndex > 0) {
      const prevFeature = filteredFeatures[currentFilteredIndex - 1];
      setCurrentFeatureIndex(features.findIndex(feature => feature.id === prevFeature.id));
    }
  };

  const handleSkip = () => {
    // Mark all features as completed
    const allFeatureIds = features.map(feature => feature.id);
    setCompletedFeatures(allFeatureIds);
    localStorage.setItem(`completed_features_${currentUser?.id}`, JSON.stringify(allFeatureIds));
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Feature Introduction</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'secondary'}
                className="cursor-pointer flex items-center gap-1"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon}
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Feature {currentFilteredIndex + 1} of {filteredFeatures.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Feature */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {currentFeature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {currentFeature.title}
                  {completedFeatures.includes(currentFeature.id) && (
                    <CheckCircle className="inline h-4 w-4 text-green-500 ml-2" />
                  )}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {currentFeature.description}
                </p>
                {currentFeature.highlight && (
                  <Badge variant="outline" className="mt-2 border-blue-500 text-blue-400">
                    <Eye className="h-3 w-3 mr-1" />
                    Look for this feature
                  </Badge>
                )}
              </div>
            </div>

            {/* Mark Complete Button */}
            {!completedFeatures.includes(currentFeature.id) && (
              <Button
                variant="outline"
                onClick={() => markFeatureComplete(currentFeature.id)}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Mark as Complete
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentFilteredIndex === 0}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Skip All
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={currentFilteredIndex === filteredFeatures.length - 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Feature Counter */}
          <div className="text-center text-sm text-gray-400">
            {completedFeatures.length} of {features.length} features completed
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 