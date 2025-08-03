import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, Eye, Heart, MessageSquare, DollarSign, Users, Calendar, BarChart3, PieChart, Activity, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authenticatedApiRequest, authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import Logo from "@/components/logo";

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = authService.getUser();
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/users/me/analytics", timeRange],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", `/api/users/me/analytics?timeRange=${timeRange}`);
      return response.json();
    },
  });

  const data = analytics;

  const handleBack = () => {
    setLocation("/profile");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-12 pb-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-blue-700"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Analytics</span>
            </div>
            <div className="w-10"></div> {/* Spacer */}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {user?.userType === 'entrepreneur' ? 'Business Analytics' : 'Investment Portfolio'}
              </h1>
              <p className="text-blue-100">
                Track your performance and growth
              </p>
            </div>
            <Logo size="sm" />
          </div>
        </div>

        {/* Empty State */}
        <div className="px-6 py-12">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data</h3>
            <p className="text-gray-400 mb-6">
              Start creating posts and engaging with the community to see your analytics here.
            </p>
            <Button 
              onClick={() => setLocation(user?.userType === 'entrepreneur' ? "/create-post" : "/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {user?.userType === 'entrepreneur' ? 'Create Post' : 'Explore Opportunities'}
            </Button>
          </div>
        </div>

        <BottomNavigation activeTab="profile" />
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
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">Analytics</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {user?.userType === 'entrepreneur' ? 'Business Analytics' : 'Investment Portfolio'}
            </h1>
            <p className="text-blue-100">
              Track your performance and growth
            </p>
          </div>
          <Logo size="sm" />
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-700">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              {user?.userType === 'entrepreneur' ? 'Posts' : 'Investments'}
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Insights
            </TabsTrigger>
          </TabsList>

                     <TabsContent value="overview" className="space-y-6 mt-6">
             {/* Key Metrics */}
             <div className="grid grid-cols-2 gap-4">
               {user?.userType === 'entrepreneur' ? (
                 <>
                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <Eye className="h-4 w-4 text-blue-400" />
                         <span className="text-gray-400 text-sm">Total Views</span>
                       </div>
                       <p className="text-2xl font-bold text-white">{data?.overview?.totalViews?.toLocaleString() || 0}</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+{data?.overview?.growthRate || 0}%</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <Heart className="h-4 w-4 text-red-400" />
                         <span className="text-gray-400 text-sm">Total Likes</span>
                       </div>
                       <p className="text-2xl font-bold text-white">{data?.overview?.totalLikes || 0}</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+0%</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <MessageSquare className="h-4 w-4 text-green-400" />
                         <span className="text-gray-400 text-sm">Comments</span>
                       </div>
                       <p className="text-2xl font-bold text-white">{data?.overview?.totalComments || 0}</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+0%</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <DollarSign className="h-4 w-4 text-yellow-400" />
                         <span className="text-gray-400 text-sm">Engagement</span>
                       </div>
                       <p className="text-2xl font-bold text-white">{data?.overview?.engagementRate || 0}%</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+0%</span>
                       </div>
                     </CardContent>
                   </Card>
                 </>
               ) : (
                 <>
                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <DollarSign className="h-4 w-4 text-green-400" />
                         <span className="text-gray-400 text-sm">Total Invested</span>
                       </div>
                       <p className="text-2xl font-bold text-white">₹{(data?.overview?.totalInvested / 100000).toFixed(1)}L</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+{data?.overview?.portfolioGrowth || 0}%</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <Users className="h-4 w-4 text-blue-400" />
                         <span className="text-gray-400 text-sm">Total Interests</span>
                       </div>
                       <p className="text-2xl font-bold text-white">{data?.overview?.totalInterests || 0}</p>
                       <div className="flex items-center mt-1">
                         <CheckCircle className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">{data?.overview?.acceptedInvestments || 0} accepted</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <CheckCircle className="h-4 w-4 text-green-400" />
                         <span className="text-gray-400 text-sm">Success Rate</span>
                       </div>
                       <p className="text-2xl font-bold text-white">{data?.overview?.successRate || 0}%</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+5%</span>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gray-900 border-gray-700">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-2 mb-2">
                         <Activity className="h-4 w-4 text-yellow-400" />
                         <span className="text-gray-400 text-sm">Avg Return</span>
                       </div>
                       <p className="text-2xl font-bold text-white">12%</p>
                       <div className="flex items-center mt-1">
                         <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                         <span className="text-green-400 text-xs">+2%</span>
                       </div>
                     </CardContent>
                   </Card>
                 </>
               )}
             </div>

            {/* Engagement Chart */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">Chart visualization coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                     <TabsContent value="posts" className="space-y-6 mt-6">
             {user?.userType === 'entrepreneur' ? (
               /* Top Performing Posts */
               <Card className="bg-gray-900 border-gray-700">
                 <CardHeader>
                   <CardTitle className="text-white">Top Performing Posts</CardTitle>
                 </CardHeader>
                 <CardContent>
                   {data?.posts && data.posts.length > 0 ? (
                     <div className="space-y-4">
                       {data.posts.map((post: any) => (
                         <div key={post.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                           <div className="flex-1">
                             <h3 className="text-white font-medium">{post.title}</h3>
                             <p className="text-gray-400 text-sm">{post.date}</p>
                           </div>
                           <div className="flex items-center space-x-4 text-sm">
                             <div className="flex items-center space-x-1">
                               <Eye className="h-3 w-3 text-gray-400" />
                               <span className="text-gray-300">{post.views}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                               <Heart className="h-3 w-3 text-gray-400" />
                               <span className="text-gray-300">{post.likes}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                               <MessageSquare className="h-3 w-3 text-gray-400" />
                               <span className="text-gray-300">{post.comments}</span>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8">
                       <p className="text-gray-400">No posts data available yet.</p>
                     </div>
                   )}
                 </CardContent>
               </Card>
             ) : (
               /* Investment Portfolio */
               <>
                 <Card className="bg-gray-900 border-gray-700">
                   <CardHeader>
                     <CardTitle className="text-white">Active Investments</CardTitle>
                   </CardHeader>
                   <CardContent>
                     {data?.investments && data.investments.length > 0 ? (
                       <div className="space-y-4">
                         {data.investments.map((investment: any) => (
                           <div key={investment.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                             <div className="flex-1">
                               <h3 className="text-white font-medium">{investment.title}</h3>
                               <p className="text-gray-400 text-sm">{investment.date}</p>
                             </div>
                             <div className="flex items-center space-x-4 text-sm">
                               <div className="flex items-center space-x-1">
                                 <DollarSign className="h-3 w-3 text-green-400" />
                                 <span className="text-gray-300">₹{(investment.amount / 100000).toFixed(1)}L</span>
                               </div>
                               <div className="flex items-center space-x-1">
                                 <Activity className="h-3 w-3 text-blue-400" />
                                 <span className="text-gray-300">{investment.returns}</span>
                               </div>
                               <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                                 {investment.status}
                               </Badge>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-gray-400">No active investments yet.</p>
                         <Button 
                           onClick={() => setLocation("/dashboard")}
                           className="mt-4 bg-blue-600 hover:bg-blue-700"
                         >
                           Explore Opportunities
                         </Button>
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 <Card className="bg-gray-900 border-gray-700">
                   <CardHeader>
                     <CardTitle className="text-white">Portfolio Allocation</CardTitle>
                   </CardHeader>
                   <CardContent>
                     {data?.portfolio ? (
                       <div className="space-y-4">
                         <div>
                           <h4 className="text-white font-medium mb-2">Sector Distribution</h4>
                           <div className="space-y-2">
                             {Object.entries(data.portfolio.sectors || {}).map(([sector, percentage]) => (
                               <div key={sector} className="flex items-center justify-between">
                                 <span className="text-gray-300">{sector}</span>
                                 <div className="flex items-center space-x-2">
                                   <div className="w-20 bg-gray-700 rounded-full h-2">
                                     <div 
                                       className="bg-blue-500 h-2 rounded-full" 
                                       style={{ width: `${percentage}%` }}
                                     ></div>
                                   </div>
                                   <span className="text-gray-400 text-sm">{percentage}%</span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4">
                           <div>
                             <p className="text-gray-400 text-sm">Risk Level</p>
                             <p className="text-white font-medium">{data.portfolio.riskLevel}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Average Return</p>
                             <p className="text-white font-medium">{data.portfolio.averageReturn}</p>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-gray-400">Portfolio data will appear here once you make investments.</p>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </>
             )}
           </TabsContent>

                     <TabsContent value="insights" className="space-y-6 mt-6">
             {/* Demographics */}
             <Card className="bg-gray-900 border-gray-700">
               <CardHeader>
                 <CardTitle className="text-white">Audience Demographics</CardTitle>
               </CardHeader>
               <CardContent>
                 {data?.demographics ? (
                   <div className="space-y-4">
                     <div>
                       <h4 className="text-white font-medium mb-2">Age Groups</h4>
                       <div className="space-y-2">
                         {Object.entries(data.demographics.ageGroups || {}).map(([age, percentage]) => (
                           <div key={age} className="flex items-center justify-between">
                             <span className="text-gray-300">{age}</span>
                             <div className="flex items-center space-x-2">
                               <div className="w-20 bg-gray-700 rounded-full h-2">
                                 <div 
                                   className="bg-blue-500 h-2 rounded-full" 
                                   style={{ width: `${percentage}%` }}
                                 ></div>
                               </div>
                               <span className="text-gray-400 text-sm">{percentage}%</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>

                     <div>
                       <h4 className="text-white font-medium mb-2">Top Locations</h4>
                       <div className="space-y-2">
                         {Object.entries(data.demographics.locations || {}).map(([location, percentage]) => (
                           <div key={location} className="flex items-center justify-between">
                             <span className="text-gray-300">{location}</span>
                             <span className="text-gray-400">{percentage}%</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <p className="text-gray-400">No demographics data available yet.</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Recommendations */}
             <Card className="bg-gray-900 border-gray-700">
               <CardHeader>
                 <CardTitle className="text-white">Recommendations</CardTitle>
               </CardHeader>
               <CardContent>
                 {data?.overview ? (
                   <div className="space-y-3">
                     <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                       <h4 className="text-blue-400 font-medium mb-1">Post More Frequently</h4>
                       <p className="text-gray-300 text-sm">Your engagement is highest on Tuesdays and Thursdays</p>
                     </div>
                     <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                       <h4 className="text-green-400 font-medium mb-1">Optimize Content</h4>
                       <p className="text-gray-300 text-sm">Posts with images get 2.5x more engagement</p>
                     </div>
                     <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                       <h4 className="text-purple-400 font-medium mb-1">Engage More</h4>
                       <p className="text-gray-300 text-sm">Responding to comments increases your reach by 40%</p>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <p className="text-gray-400">Start creating content to get personalized recommendations.</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
} 