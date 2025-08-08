import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  User,
  Bell,
  Shield,
  Eye,
  DollarSign,
  Smartphone,
  Globe,
  HelpCircle,
  Download,
  Trash2,
  Lock,
  Mail,
  LogOut
} from "lucide-react";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useNotificationContext } from "@/contexts/NotificationContext";
import BottomNavigation from "@/components/bottom-navigation";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailPreferencesSchema = z.object({
  marketingEmails: z.boolean(),
  investmentAlerts: z.boolean(),
  communityUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
type EmailPreferencesForm = z.infer<typeof emailPreferencesSchema>;

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings: notificationSettings, updateSettings: updateNotificationSettings } = useNotificationContext();
  const user = authService.getUser();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      investmentAlerts: true,
      communityUpdates: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true
    },
    appearance: {
      darkMode: true,
      compactView: false
    },
    investment: {
      autoMatch: true,
      riskLevel: 'moderate',
      investmentRange: '1L-10L',
      preferredSectors: ['tech', 'food'],
      showAdvancedMetrics: false
    }
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<EmailPreferencesForm>({
    resolver: zodResolver(emailPreferencesSchema),
    defaultValues: {
      marketingEmails: true,
      investmentAlerts: true,
      communityUpdates: false,
      securityAlerts: true,
      weeklyDigest: false,
    },
  });

  // Settings handlers
  const handleNotificationToggle = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
    
    toast({
      title: "Notification Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.notifications[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handlePrivacyToggle = (key: keyof typeof settings.privacy) => {
    if (key === 'profileVisibility') return; // Handle separately
    
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
    
    toast({
      title: "Privacy Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.privacy[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleProfileVisibilityChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        profileVisibility: value
      }
    }));
    
    toast({
      title: "Profile Visibility Updated",
      description: `Your profile is now ${value}.`,
    });
  };

  const handleAppearanceToggle = (key: keyof typeof settings.appearance) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: !prev.appearance[key]
      }
    }));
    
    toast({
      title: "Appearance Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.appearance[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleInvestmentToggle = (key: keyof typeof settings.investment) => {
    setSettings(prev => ({
      ...prev,
      investment: {
        ...prev.investment,
        [key]: !prev.investment[key]
      }
    }));
    
    toast({
      title: "Investment Settings Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${!settings.investment[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleRiskLevelChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      investment: {
        ...prev.investment,
        riskLevel: value
      }
    }));
    
    toast({
      title: "Risk Level Updated",
      description: `Risk level set to ${value}`,
      variant: "default",
    });
  };

  const handleInvestmentRangeChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      investment: {
        ...prev.investment,
        investmentRange: value
      }
    }));
    
    toast({
      title: "Investment Range Updated",
      description: `Investment range set to ${value}`,
      variant: "default",
    });
  };

  const handleDownloadData = () => {
    const userData = {
      settings: settings,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investlocal-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Downloaded",
      description: "Your settings data has been downloaded successfully.",
    });
  };

  const handleClearCache = () => {
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    toast({
      title: "Cache Cleared",
      description: "App cache has been cleared successfully.",
    });
  };

  const handleHelpSupport = () => {
    setLocation("/help");
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

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of InvestLocal",
    });
    setLocation("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/profile")}
              className="text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Settings & Privacy</h1>
              <p className="text-sm text-gray-400">Manage your preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 max-w-2xl mx-auto pb-20">
        
        {/* Account Settings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={() => setLocation("/edit-profile")}
            >
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-white">Edit Profile</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={() => setLocation("/change-password")}
            >
              <div className="flex items-center space-x-3">
                <Lock className="h-4 w-4 text-gray-400" />
                <span className="text-white">Change Password</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={() => setLocation("/email-preferences")}
            >
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-white">Email Preferences</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Chat Notifications</p>
                <p className="text-gray-400 text-sm">New message alerts</p>
              </div>
              <Switch 
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) => updateNotificationSettings({ enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Notification Sound</p>
                <p className="text-gray-400 text-sm">Play sound for new messages</p>
              </div>
              <Switch 
                checked={notificationSettings.sound}
                onCheckedChange={(checked) => updateNotificationSettings({ sound: checked })}
                disabled={!notificationSettings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Browser Notifications</p>
                <p className="text-gray-400 text-sm">Desktop notifications</p>
              </div>
              <Switch 
                checked={notificationSettings.browserNotifications}
                onCheckedChange={(checked) => updateNotificationSettings({ browserNotifications: checked })}
                disabled={!notificationSettings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Vibration</p>
                <p className="text-gray-400 text-sm">Vibrate on new messages</p>
              </div>
              <Switch 
                checked={notificationSettings.vibration}
                onCheckedChange={(checked) => updateNotificationSettings({ vibration: checked })}
                disabled={!notificationSettings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-gray-400 text-sm">Get notified about new opportunities</p>
              </div>
              <Switch 
                checked={settings.notifications.push}
                onCheckedChange={() => handleNotificationToggle('push')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-400 text-sm">Receive updates via email</p>
              </div>
              <Switch 
                checked={settings.notifications.email}
                onCheckedChange={() => handleNotificationToggle('email')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Investment Alerts</p>
                <p className="text-gray-400 text-sm">New investment opportunities</p>
              </div>
              <Switch 
                checked={settings.notifications.investmentAlerts}
                onCheckedChange={() => handleNotificationToggle('investmentAlerts')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Community Updates</p>
                <p className="text-gray-400 text-sm">Posts and comments from your network</p>
              </div>
              <Switch 
                checked={settings.notifications.communityUpdates}
                onCheckedChange={() => handleNotificationToggle('communityUpdates')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Profile Visibility</p>
                <p className="text-gray-400 text-sm">Who can see your profile</p>
              </div>
              <Select value={settings.privacy.profileVisibility} onValueChange={handleProfileVisibilityChange}>
                <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="connections">Connections</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Show Online Status</p>
                <p className="text-gray-400 text-sm">Let others see when you're active</p>
              </div>
              <Switch 
                checked={settings.privacy.showOnlineStatus}
                onCheckedChange={() => handlePrivacyToggle('showOnlineStatus')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Allow Messages</p>
                <p className="text-gray-400 text-sm">Receive messages from other users</p>
              </div>
              <Switch 
                checked={settings.privacy.allowMessages}
                onCheckedChange={() => handlePrivacyToggle('allowMessages')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-gray-400 text-sm">Use dark theme</p>
              </div>
              <Switch 
                checked={settings.appearance.darkMode}
                onCheckedChange={() => handleAppearanceToggle('darkMode')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Compact View</p>
                <p className="text-gray-400 text-sm">Show more content per screen</p>
              </div>
              <Switch 
                checked={settings.appearance.compactView}
                onCheckedChange={() => handleAppearanceToggle('compactView')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Settings - Only for Investors */}
        {user?.userType === 'investor' && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Investment Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto-Match Opportunities</p>
                  <p className="text-gray-400 text-sm">Automatically match with relevant opportunities</p>
                </div>
                <Switch 
                  checked={settings.investment.autoMatch}
                  onCheckedChange={() => handleInvestmentToggle('autoMatch')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Advanced Metrics</p>
                  <p className="text-gray-400 text-sm">Show detailed financial metrics</p>
                </div>
                <Switch 
                  checked={settings.investment.showAdvancedMetrics}
                  onCheckedChange={() => handleInvestmentToggle('showAdvancedMetrics')}
                />
              </div>
              
              <div>
                <p className="text-white font-medium mb-2">Risk Level</p>
                <Select value={settings.investment.riskLevel} onValueChange={handleRiskLevelChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <p className="text-white font-medium mb-2">Investment Range</p>
                <Select value={settings.investment.investmentRange} onValueChange={handleInvestmentRangeChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="10K-50K">₹10K - ₹50K</SelectItem>
                    <SelectItem value="50K-1L">₹50K - ₹1L</SelectItem>
                    <SelectItem value="1L-5L">₹1L - ₹5L</SelectItem>
                    <SelectItem value="1L-10L">₹1L - ₹10L</SelectItem>
                    <SelectItem value="5L-25L">₹5L - ₹25L</SelectItem>
                    <SelectItem value="10L-50L">₹10L - ₹50L</SelectItem>
                    <SelectItem value="50L+">₹50L+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data & Storage */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Data & Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={handleDownloadData}
            >
              <div className="flex items-center space-x-3">
                <Download className="h-4 w-4 text-gray-400" />
                <span className="text-white">Download My Data</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={handleClearCache}
            >
              <div className="flex items-center space-x-3">
                <Trash2 className="h-4 w-4 text-gray-400" />
                <span className="text-white">Clear Cache</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">App Version</p>
                <p className="text-gray-400 text-sm">v1.0.0</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={handleHelpSupport}
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <span className="text-white">Help & Support</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={handlePrivacyPolicy}
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-white">Privacy Policy</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-gray-700 hover:bg-gray-700 bg-gray-700"
              onClick={handleTermsOfService}
            >
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-white">Terms of Service</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-red-800 hover:bg-red-900/20"
              onClick={handleLogout}
            >
              <div className="flex items-center space-x-3">
                <LogOut className="h-5 w-5 text-red-400" />
                <span className="text-red-400">Logout</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />
    </div>
  );
}
