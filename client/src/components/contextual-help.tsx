import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  Lightbulb, 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Share2, 
  Plus,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';

interface HelpTip {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'action' | 'navigation' | 'feature';
}

const helpTips: { [key: string]: HelpTip } = {
  'like-button': {
    id: 'like-button',
    title: 'Like Post',
    description: 'Show appreciation for this post. The author will be notified.',
    icon: <Heart className="h-4 w-4 text-red-500" />,
    category: 'action'
  },
  'interest-button': {
    id: 'interest-button',
    title: 'Express Interest',
    description: 'Show serious interest in this investment opportunity. The author will be notified.',
    icon: <Heart className="h-4 w-4 text-green-500" />,
    category: 'action'
  },
  'comment-button': {
    id: 'comment-button',
    title: 'Add Comment',
    description: 'Share your thoughts and start a conversation.',
    icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
    category: 'action'
  },
  'share-button': {
    id: 'share-button',
    title: 'Share Post',
    description: 'Share this post with your network or copy the link.',
    icon: <Share2 className="h-4 w-4 text-orange-500" />,
    category: 'action'
  },
  'bookmark-button': {
    id: 'bookmark-button',
    title: 'Save Post',
    description: 'Bookmark this post to revisit later.',
    icon: <Bookmark className="h-4 w-4 text-yellow-500" />,
    category: 'action'
  },
  'create-post': {
    id: 'create-post',
    title: 'Create Post',
    description: 'Share your business opportunity or community update.',
    icon: <Plus className="h-4 w-4 text-green-500" />,
    category: 'feature'
  },
  'investment-tab': {
    id: 'investment-tab',
    title: 'Investment Posts',
    description: 'Browse and create investment opportunities with funding details.',
    icon: <DollarSign className="h-4 w-4 text-green-500" />,
    category: 'navigation'
  },
  'community-tab': {
    id: 'community-tab',
    title: 'Community Posts',
    description: 'Engage in discussions and share insights with the community.',
    icon: <Users className="h-4 w-4 text-blue-500" />,
    category: 'navigation'
  },
  'analytics': {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track your post performance and engagement metrics.',
    icon: <TrendingUp className="h-4 w-4 text-purple-500" />,
    category: 'feature'
  },
  'chat': {
    id: 'chat',
    title: 'Direct Messaging',
    description: 'Start private conversations with other users.',
    icon: <MessageSquare className="h-4 w-4 text-purple-500" />,
    category: 'feature'
  }
};

interface ContextualHelpProps {
  elementId: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export default function ContextualHelp({ elementId, position = 'top', children }: ContextualHelpProps) {
  const [showHelp, setShowHelp] = useState(false);
  const helpTip = helpTips[elementId];

  if (!helpTip) {
    return <>{children}</>;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  return (
    <div className="relative inline-block">
      <div 
        className="inline-flex items-center"
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
      >
        {children}
        <Button
          variant="ghost"
          size="icon"
          className="ml-1 h-4 w-4 text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(!showHelp);
          }}
        >
          <HelpCircle className="h-3 w-3" />
        </Button>
      </div>

      {showHelp && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          <Card className="w-64 bg-gray-900 border-gray-700 text-white shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {helpTip.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white">
                      {helpTip.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 text-gray-400 hover:text-white"
                      onClick={() => setShowHelp(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {helpTip.description}
                  </p>
                  <Badge 
                    variant="outline" 
                    className="mt-2 text-xs border-gray-600 text-gray-400"
                  >
                    {helpTip.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper component for showing help on hover
export function HelpTooltip({ elementId, children }: { elementId: string; children: React.ReactNode }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const helpTip = helpTips[elementId];

  if (!helpTip) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <Card className="w-48 bg-gray-900 border-gray-700 text-white shadow-lg">
            <CardContent className="p-2">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {helpTip.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-white mb-1">
                    {helpTip.title}
                  </h4>
                  <p className="text-xs text-gray-300">
                    {helpTip.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 