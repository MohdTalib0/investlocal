import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authService } from "./lib/auth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import OnboardingPage from "@/pages/onboarding";
import UserTypeSelectionPage from "@/pages/user-type-selection";
import RegistrationPage from "@/pages/registration";
import DashboardPage from "@/pages/dashboard";
import UnifiedDashboard from "@/pages/unified-dashboard";
import CreateListingPage from "@/pages/create-listing";
import CreatePostPage from "@/pages/create-post";
import OpportunityDetailPage from "@/pages/opportunity-detail";
import ChatPage from "@/pages/chat";
import ProfilePage from "@/pages/profile";
import AdminDashboardPage from "@/pages/admin-dashboard";
import UserProfilePage from "@/pages/user-profile";
import AnalyticsPage from "@/pages/analytics";
import SavedOpportunitiesPage from "@/pages/saved-opportunities";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <OnboardingPage />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={authService.isAuthenticated() ? UnifiedDashboard : OnboardingPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/user-type" component={UserTypeSelectionPage} />
      <Route path="/register" component={RegistrationPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <UnifiedDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/create-listing">
        <ProtectedRoute>
          <CreateListingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/create-post">
        <ProtectedRoute>
          <CreatePostPage />
        </ProtectedRoute>
      </Route>
      <Route path="/opportunity/:id">
        <ProtectedRoute>
          <OpportunityDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/chat/:userId?">
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/user">
        <ProtectedRoute>
          <UserProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/saved">
        <ProtectedRoute>
          <SavedOpportunitiesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TooltipProvider>
          <div className="max-w-md mx-auto bg-black min-h-screen relative overflow-hidden">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
