import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Globe, 
  Clock, 
  MapPin,
  Trash2,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function SessionsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/users/me/sessions"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/users/me/sessions");
      return response.json();
    },
  });

  // Deactivate session mutation
  const deactivateSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await authenticatedApiRequest("DELETE", `/api/users/me/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/sessions"] });
      toast({
        title: "Session Deactivated",
        description: "The session has been deactivated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Deactivate all sessions mutation
  const deactivateAllSessions = useMutation({
    mutationFn: async () => {
      const response = await authenticatedApiRequest("DELETE", "/api/users/me/sessions");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/sessions"] });
      toast({
        title: "All Sessions Deactivated",
        description: "All sessions have been deactivated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate sessions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeactivateSession = (sessionId: string) => {
    deactivateSession.mutate(sessionId);
  };

  const handleDeactivateAllSessions = () => {
    deactivateAllSessions.mutate();
  };

  const getDeviceIcon = (deviceInfo: any) => {
    const userAgent = deviceInfo?.userAgent?.toLowerCase() || '';
    
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return <Smartphone className="h-5 w-5 text-blue-400" />;
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return <Tablet className="h-5 w-5 text-green-400" />;
    } else if (userAgent.includes('mac') || userAgent.includes('windows') || userAgent.includes('linux')) {
      return <Laptop className="h-5 w-5 text-purple-400" />;
    } else {
      return <Monitor className="h-5 w-5 text-gray-400" />;
    }
  };

  const getDeviceName = (deviceInfo: any) => {
    const userAgent = deviceInfo?.userAgent || '';
    
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet Device';
    
    return 'Unknown Device';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - sessionDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const isCurrentSession = (session: any) => {
    // This would need to be implemented with the actual session token
    // For now, we'll assume the first session is current
    return sessions.indexOf(session) === 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">Active Sessions</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Device Sessions</h1>
          <p className="text-blue-100">Manage your active sessions across devices</p>
        </div>
      </div>

      {/* Session Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">{sessions.length}</p>
            <p className="text-xs text-gray-400">Active Sessions</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-400">
              {sessions.filter((s: any) => s.isActive).length}
            </p>
            <p className="text-xs text-gray-400">Active Now</p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="px-6 py-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Sessions</h3>
            <p className="text-gray-400 mb-6">
              You don't have any active sessions at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session: any) => (
              <Card key={session.id} className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(session.deviceInfo)}
                      <div>
                        <h3 className="text-white font-medium">
                          {getDeviceName(session.deviceInfo)}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {session.deviceInfo?.ipAddress || 'Unknown location'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCurrentSession(session) && (
                        <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      )}
                      {session.isActive ? (
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Last active: {getTimeAgo(session.lastActivity)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>Created: {getTimeAgo(session.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Session ID: {session.id.slice(-8)}
                    </div>
                    {!isCurrentSession(session) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 hover:bg-red-900/20 text-red-400"
                        onClick={() => handleDeactivateSession(session.sessionToken)}
                        disabled={deactivateSession.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Deactivate All Sessions */}
        {sessions.length > 1 && (
          <div className="mt-6">
            <Card className="bg-red-900/20 border-red-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="text-white font-medium">Deactivate All Other Sessions</h3>
                    <p className="text-gray-400 text-sm">
                      This will log you out from all other devices except this one.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-red-600 hover:bg-red-900/20 text-red-400"
                  onClick={handleDeactivateAllSessions}
                  disabled={deactivateAllSessions.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate All Other Sessions
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
} 