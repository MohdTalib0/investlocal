import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';

export interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  profileCompleted: boolean;
  preferencesCompleted: boolean;
  featuresShown: boolean;
}

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isCompleted: false,
    currentStep: 1,
    totalSteps: 4,
    profileCompleted: false,
    preferencesCompleted: false,
    featuresShown: false,
  });

  const [isLoading, setIsLoading] = useState(true);

    const checkOnboardingStatus = async () => {
       try {
         const user = authService.getUser();
         if (!user) {
           setIsLoading(false);
           return;
         }

         // Fetch fresh user data from the server to get the latest onboarding status
         try {
           const response = await fetch('/api/users/me', {
             headers: {
               'Authorization': `Bearer ${authService.getToken()}`,
             },
           });
           
           if (response.ok) {
             const freshUserData = await response.json();
             
             // Update localStorage with fresh data
             localStorage.setItem('user', JSON.stringify(freshUserData));
             
             // Check if user has completed basic profile (has bio)
             const hasBio = freshUserData.bio && freshUserData.bio.length > 10;
             
             // Check if user has completed preferences based on user type
             let hasPreferences = false;
             if (freshUserData.userType === 'investor') {
               hasPreferences = !!(freshUserData.investmentAmount || freshUserData.preferredSectors?.length);
             } else if (freshUserData.userType === 'entrepreneur') {
               hasPreferences = !!(freshUserData.businessInterests?.length);
             }

             // Check if user has completed onboarding (from database)
             const hasCompletedOnboarding = freshUserData.isOnboardingComplete === true;

             console.log('Onboarding status check:', {
               hasBio,
               hasPreferences,
               hasCompletedOnboarding,
               isOnboardingComplete: freshUserData.isOnboardingComplete,
               userData: freshUserData
             });

             setOnboardingState({
               isCompleted: hasBio && hasPreferences && hasCompletedOnboarding,
               currentStep: 1,
               totalSteps: 4,
               profileCompleted: hasBio,
               preferencesCompleted: hasPreferences,
               featuresShown: hasCompletedOnboarding,
             });
           } else {
             // Fallback to cached user data if API call fails
             const hasBio = user.bio && user.bio.length > 10;
             let hasPreferences = false;
             if (user.userType === 'investor') {
               hasPreferences = !!(user.investmentAmount || user.preferredSectors?.length);
             } else if (user.userType === 'entrepreneur') {
               hasPreferences = !!(user.businessInterests?.length);
             }
             const hasCompletedOnboarding = user.isOnboardingComplete === true;

             setOnboardingState({
               isCompleted: hasBio && hasPreferences && hasCompletedOnboarding,
               currentStep: 1,
               totalSteps: 4,
               profileCompleted: hasBio,
               preferencesCompleted: hasPreferences,
               featuresShown: hasCompletedOnboarding,
             });
           }
         } catch (error) {
           console.error('Error fetching fresh user data:', error);
           // Fallback to cached user data
           const hasBio = user.bio && user.bio.length > 10;
           let hasPreferences = false;
           if (user.userType === 'investor') {
             hasPreferences = !!(user.investmentAmount || user.preferredSectors?.length);
           } else if (user.userType === 'entrepreneur') {
             hasPreferences = !!(user.businessInterests?.length);
           }
           const hasCompletedOnboarding = user.isOnboardingComplete === true;

           setOnboardingState({
             isCompleted: hasBio && hasPreferences && hasCompletedOnboarding,
             currentStep: 1,
             totalSteps: 4,
             profileCompleted: hasBio,
             preferencesCompleted: hasPreferences,
             featuresShown: hasCompletedOnboarding,
           });
         }
       } catch (error) {
         console.error('Error checking onboarding status:', error);
       } finally {
         setIsLoading(false);
       }
     };

    useEffect(() => {
      checkOnboardingStatus();
    }, []);



  const markOnboardingCompleted = async () => {
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
          body: JSON.stringify({ isOnboardingComplete: true }),
        });

        if (response.ok) {
          // Update local state
          setOnboardingState(prev => ({
            ...prev,
            isCompleted: true,
            featuresShown: true,
          }));
          
          // Update the user object in localStorage to reflect the change
          const updatedUser = { ...user, isOnboardingComplete: true };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error marking onboarding as completed:', error);
      }
    }
  };

  const updateOnboardingStep = (step: number) => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: step,
    }));
  };

  const markProfileCompleted = () => {
    setOnboardingState(prev => ({
      ...prev,
      profileCompleted: true,
    }));
  };

  const markPreferencesCompleted = () => {
    setOnboardingState(prev => ({
      ...prev,
      preferencesCompleted: true,
    }));
  };

  const shouldShowOnboarding = () => {
    return !onboardingState.isCompleted && authService.isAuthenticated();
  };

  return {
    onboardingState,
    isLoading,
    markOnboardingCompleted,
    updateOnboardingStep,
    markProfileCompleted,
    markPreferencesCompleted,
    shouldShowOnboarding,
  };
} 