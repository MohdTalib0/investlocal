import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  Sparkles
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'getting-started' | 'engagement' | 'networking' | 'advanced';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const tips: Tip[] = [
  {
    id: 'welcome',
    title: 'Welcome to InvestLocal!',
    description: 'Connect with entrepreneurs and investors in your local community. Start by exploring opportunities or creating your first post.',
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
    category: 'getting-started',
    action: {
      label: 'Explore Dashboard',
      onClick: () => {}
    }
  },
  {
    id: 'create-post',
    title: 'Share Your Opportunity',
    description: 'Create investment posts to showcase your business or share community updates. Include images and detailed descriptions for better engagement.',
    icon: <Plus className="h-6 w-6 text-green-500" />,
    category: 'getting-started',
    action: {
      label: 'Create Post',
      onClick: () => {}
    }
  },
  {
    id: 'like-interest',
    title: 'Show Interest & Like',
    description: 'Use the heart icon to like posts and the interest button to express serious interest in investment opportunities.',
    icon: <Heart className="h-6 w-6 text-red-500" />,
    category: 'engagement'
  },
  {
    id: 'comment-engage',
    title: 'Engage Through Comments',
    description: 'Leave thoughtful comments on posts to start conversations and build relationships with other users.',
    icon: <MessageSquare className="h-6 w-6 text-blue-500" />,
    category: 'engagement'
  },
  {
    id: 'direct-message',
    title: 'Direct Messaging',
    description: 'Start private conversations with users through our secure chat system. Perfect for discussing investment details.',
    icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
    category: 'networking',
    action: {
      label: 'Start Chat',
      onClick: () => {}
    }
  },
  {
    id: 'save-bookmark',
    title: 'Save Interesting Posts',
    description: 'Bookmark posts you want to revisit later. Your saved posts are accessible from your profile.',
    icon: <Bookmark className="h-6 w-6 text-yellow-500" />,
    category: 'engagement'
  },
  {
    id: 'share-network',
    title: 'Share & Network',
    description: 'Share interesting posts with your network to help others discover great opportunities.',
    icon: <Share2 className="h-6 w-6 text-orange-500" />,
    category: 'networking'
  },
  {
    id: 'profile-completion',
    title: 'Complete Your Profile',
    description: 'A complete profile increases your credibility. Add a professional photo, detailed bio, and relevant preferences.',
    icon: <Users className="h-6 w-6 text-indigo-500" />,
    category: 'getting-started',
    action: {
      label: 'Edit Profile',
      onClick: () => {}
    }
  },
  {
    id: 'analytics-tracking',
    title: 'Track Your Performance',
    description: 'Monitor your post views, engagement rates, and investment success through our analytics dashboard.',
    icon: <TrendingUp className="h-6 w-6 text-green-500" />,
    category: 'advanced'
  },
  {
    id: 'investment-strategy',
    title: 'Investment Strategy',
    description: 'Diversify your portfolio by investing in different sectors and stages. Use our filtering tools to find the right opportunities.',
    icon: <Target className="h-6 w-6 text-blue-500" />,
    category: 'advanced'
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    description: 'Be transparent, respond promptly to inquiries, and maintain professional communication to build trust.',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    category: 'advanced'
  }
];

const categories = [
  { id: 'getting-started', name: 'Getting Started', icon: <Star className="h-4 w-4" /> },
  { id: 'engagement', name: 'Engagement', icon: <Heart className="h-4 w-4" /> },
  { id: 'networking', name: 'Networking', icon: <Users className="h-4 w-4" /> },
  { id: 'advanced', name: 'Advanced', icon: <TrendingUp className="h-4 w-4" /> }
];

interface FirstTimeGuidanceProps {
  onClose: () => void;
  isVisible: boolean;
}

export default function FirstTimeGuidance({ onClose, isVisible }: FirstTimeGuidanceProps) {
  const [, setLocation] = useLocation();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [completedTips, setCompletedTips] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const currentUser = authService.getUser();
  const currentTip = tips[currentTipIndex];
  
  const filteredTips = selectedCategory === 'all' 
    ? tips 
    : tips.filter(tip => tip.category === selectedCategory);
  
  const currentFilteredIndex = filteredTips.findIndex(tip => tip.id === currentTip.id);
  const progress = ((currentFilteredIndex + 1) / filteredTips.length) * 100;

  useEffect(() => {
    // Load completed tips from user data (database)
    if (currentUser?.completedGuidanceTips) {
      setCompletedTips(currentUser.completedGuidanceTips);
    }
  }, [currentUser?.completedGuidanceTips]);

  const markTipComplete = async (tipId: string) => {
    const newCompleted = [...completedTips, tipId];
    setCompletedTips(newCompleted);
    
    try {
      // Update the database
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ completedGuidanceTips: newCompleted }),
      });

      if (response.ok) {
        // Update the user object in localStorage
        const updatedUser = { ...currentUser, completedGuidanceTips: newCompleted };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      // Error updating completed tips handled silently
    }
  };

  const handleNext = () => {
    if (currentFilteredIndex < filteredTips.length - 1) {
      const nextTip = filteredTips[currentFilteredIndex + 1];
      setCurrentTipIndex(tips.findIndex(tip => tip.id === nextTip.id));
    }
  };

  const handlePrev = () => {
    if (currentFilteredIndex > 0) {
      const prevTip = filteredTips[currentFilteredIndex - 1];
      setCurrentTipIndex(tips.findIndex(tip => tip.id === prevTip.id));
    }
  };

  const handleAction = (action: { label: string; onClick: () => void }) => {
    if (action.label === 'Create Post') {
      setLocation('/create-post');
    } else if (action.label === 'Start Chat') {
      setLocation('/chat');
    } else if (action.label === 'Edit Profile') {
      setLocation('/profile');
    } else if (action.label === 'Explore Dashboard') {
      setLocation('/dashboard');
    }
    markTipComplete(currentTip.id);
  };

  const handleSkip = async () => {
    // Mark all tips as completed
    const allTipIds = tips.map(tip => tip.id);
    setCompletedTips(allTipIds);
    
    try {
      // Update the database
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ 
          completedGuidanceTips: allTipIds,
          hasSeenFirstTimeGuidance: true
        }),
      });

      if (response.ok) {
        // Update the user object in localStorage
        const updatedUser = { 
          ...currentUser, 
          completedGuidanceTips: allTipIds,
          hasSeenFirstTimeGuidance: true
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      // Error skipping all tips handled silently
    }
    
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">First-Time User Guide</CardTitle>
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
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('all')}
            >
              All Tips
            </Badge>
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
              <span>Tip {currentFilteredIndex + 1} of {filteredTips.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Tip */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {currentTip.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {currentTip.title}
                  {completedTips.includes(currentTip.id) && (
                    <CheckCircle className="inline h-4 w-4 text-green-500 ml-2" />
                  )}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {currentTip.description}
                </p>
              </div>
            </div>

            {/* Action Button */}
            {currentTip.action && (
              <Button
                onClick={() => handleAction(currentTip.action!)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {currentTip.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {/* Mark Complete Button */}
            {!completedTips.includes(currentTip.id) && (
              <Button
                variant="outline"
                onClick={() => markTipComplete(currentTip.id)}
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
                disabled={currentFilteredIndex === filteredTips.length - 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Tip Counter */}
          <div className="text-center text-sm text-gray-400">
            {completedTips.length} of {tips.length} tips completed
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 