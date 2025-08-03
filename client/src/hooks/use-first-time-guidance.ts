import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';

export function useFirstTimeGuidance() {
  const [showGuidance, setShowGuidance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGuidanceStatus = async () => {
      const user = authService.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch fresh user data from the server
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
          },
        });
        
        if (response.ok) {
          const freshUserData = await response.json();
          
          // Check if user has completed onboarding
          const hasCompletedOnboarding = freshUserData.isOnboardingComplete === true;
          
          // Check if user has seen the guidance before (from database)
          const hasSeenGuidance = freshUserData.hasSeenFirstTimeGuidance === true;
          
          // Check if user has completed any tips (from database)
          const hasCompletedTips = freshUserData.completedGuidanceTips && freshUserData.completedGuidanceTips.length > 0;

          // Show guidance if:
          // 1. User has completed onboarding
          // 2. User hasn't seen guidance before AND hasn't completed any tips
          // 3. User is authenticated
          const shouldShow = hasCompletedOnboarding && 
                            authService.isAuthenticated() && 
                            !hasSeenGuidance && !hasCompletedTips;

          setShowGuidance(shouldShow);
        } else {
          // Fallback to cached user data
          const hasCompletedOnboarding = user.isOnboardingComplete === true;
          const hasSeenGuidance = user.hasSeenFirstTimeGuidance === true;
          const hasCompletedTips = user.completedGuidanceTips && user.completedGuidanceTips.length > 0;

          const shouldShow = hasCompletedOnboarding && 
                            authService.isAuthenticated() && 
                            !hasSeenGuidance && !hasCompletedTips;

          setShowGuidance(shouldShow);
        }
      } catch (error) {
        console.error('Error fetching user guidance status:', error);
        // Fallback to cached user data
        const hasCompletedOnboarding = user.isOnboardingComplete === true;
        const hasSeenGuidance = user.hasSeenFirstTimeGuidance === true;
        const hasCompletedTips = user.completedGuidanceTips && user.completedGuidanceTips.length > 0;

        const shouldShow = hasCompletedOnboarding && 
                          authService.isAuthenticated() && 
                          !hasSeenGuidance && !hasCompletedTips;

        setShowGuidance(shouldShow);
      } finally {
        setIsLoading(false);
      }
    };

    checkGuidanceStatus();
  }, []);

  const markGuidanceSeen = async () => {
    const user = authService.getUser();
    if (user) {
      try {
        // Update the database - mark as seen and complete all tips
        const allTipIds = ['welcome', 'create-post', 'like-interest', 'comment-engage', 'direct-message', 'save-bookmark', 'share-network'];
        const response = await fetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`,
          },
          body: JSON.stringify({ 
            hasSeenFirstTimeGuidance: true,
            completedGuidanceTips: allTipIds
          }),
        });

        if (response.ok) {
          // Update local state
          setShowGuidance(false);
          
          // Update the user object in localStorage to reflect the change
          const updatedUser = { 
            ...user, 
            hasSeenFirstTimeGuidance: true,
            completedGuidanceTips: allTipIds
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error marking guidance as seen:', error);
        // Fallback to localStorage
        setShowGuidance(false);
      }
    }
  };

  const resetGuidance = async () => {
    const user = authService.getUser();
    if (user) {
      try {
        // Update the database
        const response = await fetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`,
          },
          body: JSON.stringify({ 
            hasSeenFirstTimeGuidance: false,
            completedGuidanceTips: []
          }),
        });

        if (response.ok) {
          // Update local state
          setShowGuidance(true);
          
          // Update the user object in localStorage
          const updatedUser = { 
            ...user, 
            hasSeenFirstTimeGuidance: false,
            completedGuidanceTips: []
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error resetting guidance:', error);
        // Fallback to localStorage
        setShowGuidance(true);
      }
    }
  };

  return {
    showGuidance,
    isLoading,
    markGuidanceSeen,
    resetGuidance,
    setShowGuidance
  };
} 