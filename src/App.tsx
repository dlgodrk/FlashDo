import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Onboarding } from './components/Onboarding';
import { AuthCallback } from './components/AuthCallback';
import { Camera } from './components/Camera';
import { Feed } from './components/Feed';
import { Calendar } from './components/Calendar';
import { RecordCard } from './components/RecordCard';
import { DevMenu } from './components/DevMenu';
import { HomeIcon, Users, CalendarDays } from 'lucide-react';
import { useApp } from './context/AppContext';
import { Record } from './types';
import { supabase } from './lib/supabase';

export default function App() {
  const { goals, routines, completeGoal, setGoals, setRoutines } = useApp();
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'home' | 'camera' | 'feed' | 'calendar' | 'record' | 'auth-callback'>('onboarding');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<'goal' | 'routines' | 'login' | 'nickname'>('goal');

  const hasOnboarded = goals.length > 0;

  // Check if current URL is auth callback
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    console.log('[App] Checking URL for auth callback:', { path, hasToken: hash.includes('access_token') });

    // Only trigger auth callback if we have the access token
    if (hash.includes('access_token') || (path === '/auth/callback' && hash.includes('access_token'))) {
      console.log('[App] Auth callback detected, showing auth-callback screen');
      setCurrentScreen('auth-callback');
      setIsCheckingAuth(false);
    }
  }, []);

  // Check authentication status and auto-login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Load user data from Supabase
          const { data: goalsData } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true);

          const { data: routinesData } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', session.user.id);

          // Get today's verifications to check certified status
          const today = new Date().toISOString().split('T')[0];
          const { data: todayVerifications } = await supabase
            .from('verifications')
            .select('routine_id')
            .eq('user_id', session.user.id)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

          const certifiedRoutineIds = new Set(
            todayVerifications?.map(v => v.routine_id) || []
          );

          if (goalsData && goalsData.length > 0) {
            // Convert DB data to app format
            const goals = goalsData.map(g => ({
              id: g.id,
              name: g.name,
              startDate: g.start_date,
              endDate: g.end_date,
              isPublic: false, // Default value
            }));

            const routines = routinesData?.map(r => {
              // Calculate authTime from auth_time_start and auth_time_end (middle point)
              let authTime: string | undefined;
              if (r.auth_time_start && r.auth_time_end) {
                const [startH, startM] = r.auth_time_start.split(':').map(Number);
                const [endH, endM] = r.auth_time_end.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;

                // Calculate middle point (handling day wrap-around)
                let middleMinutes;
                if (endMinutes < startMinutes) {
                  // Wrapped around midnight
                  middleMinutes = ((startMinutes + endMinutes + 1440) / 2) % 1440;
                } else {
                  middleMinutes = (startMinutes + endMinutes) / 2;
                }

                const h = Math.floor(middleMinutes / 60);
                const m = Math.floor(middleMinutes % 60);
                authTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              }

              return {
                id: r.id,
                goalId: r.goal_id,
                name: r.name,
                timeSlot: (r.auth_time_start === '05:00' ? 'morning' : r.auth_time_start === '12:00' ? 'afternoon' : 'evening') as 'morning' | 'afternoon' | 'evening',
                authTime,
                frequency: r.frequency,
                certified: certifiedRoutineIds.has(r.id),
              };
            }) || [];

            setGoals(goals);
            setRoutines(routines);
            setCurrentScreen('home');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      // Only reload on sign in/sign out, not on initial session
      if (event === 'SIGNED_OUT') {
        // Clear all data
        setGoals([]);
        setRoutines([]);

        // Clear temporary onboarding data
        localStorage.removeItem('temp_goal');
        localStorage.removeItem('temp_routines');

        // Go to login screen
        setOnboardingStep('login');
        setCurrentScreen('onboarding');
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if current goal has ended
  useEffect(() => {
    if (goals.length > 0) {
      const currentGoal = goals[0];
      const endDate = new Date(currentGoal.endDate);
      const now = new Date();

      if (now > endDate) {
        completeGoal(currentGoal.id);
        setCurrentScreen('onboarding');
      }
    }
  }, [goals, completeGoal]);

  // Reset routine certification daily
  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date();
      const lastReset = localStorage.getItem('last_reset');
      const today = now.toISOString().split('T')[0];

      if (lastReset !== today) {
        // Reset all routine certifications
        const updatedRoutines = routines.map(r => ({ ...r, certified: false }));
        localStorage.setItem('flashdo_routines', JSON.stringify(updatedRoutines));
        localStorage.setItem('last_reset', today);
        window.location.reload();
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [routines]);

  // Removed the problematic useEffect that was forcing screen to home

  const handleCertify = (routineId: string) => {
    setCurrentRoutineId(routineId);
    setCurrentScreen('camera');
  };

  const handleCameraComplete = async () => {
    // Reload routines to update certified status
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: routinesData } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', session.user.id);

        // Get today's verifications to check certified status
        const today = new Date().toISOString().split('T')[0];
        const { data: todayVerifications } = await supabase
          .from('verifications')
          .select('routine_id')
          .eq('user_id', session.user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        const certifiedRoutineIds = new Set(
          todayVerifications?.map(v => v.routine_id) || []
        );

        const routines = routinesData?.map(r => {
          // Calculate authTime from auth_time_start and auth_time_end (middle point)
          let authTime: string | undefined;
          if (r.auth_time_start && r.auth_time_end) {
            const [startH, startM] = r.auth_time_start.split(':').map(Number);
            const [endH, endM] = r.auth_time_end.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            // Calculate middle point (handling day wrap-around)
            let middleMinutes;
            if (endMinutes < startMinutes) {
              // Wrapped around midnight
              middleMinutes = ((startMinutes + endMinutes + 1440) / 2) % 1440;
            } else {
              middleMinutes = (startMinutes + endMinutes) / 2;
            }

            const h = Math.floor(middleMinutes / 60);
            const m = Math.floor(middleMinutes % 60);
            authTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          }

          return {
            id: r.id,
            goalId: r.goal_id,
            name: r.name,
            timeSlot: (r.auth_time_start === '05:00' ? 'morning' : r.auth_time_start === '12:00' ? 'afternoon' : 'evening') as 'morning' | 'afternoon' | 'evening',
            authTime,
            frequency: r.frequency,
            certified: certifiedRoutineIds.has(r.id),
          };
        }) || [];

        setRoutines(routines);
      }
    } catch (error) {
      console.error('Error reloading routines:', error);
    }

    setCurrentScreen('home');
    setCurrentRoutineId(null);
  };

  const handleViewRecord = (record: Record) => {
    setSelectedRecord(record);
    setCurrentScreen('record');
  };

  const handleResetOnboarding = () => {
    setGoals([]);
    setRoutines([]);
    localStorage.removeItem('temp_goal');
    localStorage.removeItem('temp_routines');
    setOnboardingStep('goal'); // Reset to beginning
    setCurrentScreen('onboarding');
  };

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    // Handle auth callback
    if (currentScreen === 'auth-callback') {
      return (
        <AuthCallback
          onComplete={() => {
            console.log('[App] Auth callback complete, switching to onboarding');
            // Switch to onboarding screen instead of reloading
            setCurrentScreen('onboarding');
          }}
        />
      );
    }

    if (!hasOnboarded) {
      return <Onboarding initialStep={onboardingStep} />;
    }

    switch (currentScreen) {
      case 'home':
        return <Home onCertify={handleCertify} />;
      case 'camera':
        return (
          <Camera
            routineId={currentRoutineId!}
            onComplete={handleCameraComplete}
            onCancel={() => setCurrentScreen('home')}
          />
        );
      case 'feed':
        return <Feed />;
      case 'calendar':
        return <Calendar onViewRecord={handleViewRecord} />;
      case 'record':
        return selectedRecord ? (
          <RecordCard record={selectedRecord} onClose={() => setCurrentScreen('calendar')} />
        ) : null;
      default:
        return <Home onCertify={handleCertify} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {renderScreen()}

      {/* Dev Menu - Always visible */}
      <DevMenu onResetOnboarding={handleResetOnboarding} />

      {hasOnboarded && currentScreen !== 'camera' && currentScreen !== 'record' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
          <div className="max-w-md mx-auto px-6 py-3 flex justify-around items-center">
            <button
              onClick={() => setCurrentScreen('home')}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                currentScreen === 'home' ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              <HomeIcon className="w-6 h-6" />
              <span className="text-xs">홈</span>
            </button>

            <button
              onClick={() => setCurrentScreen('feed')}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                currentScreen === 'feed' ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">피드</span>
            </button>

            <button
              onClick={() => setCurrentScreen('calendar')}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                currentScreen === 'calendar' ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              <CalendarDays className="w-6 h-6" />
              <span className="text-xs">기록</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
