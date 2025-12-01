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

  const hasOnboarded = goals.length > 0;

  // Check if current URL is auth callback
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/auth/callback' || window.location.hash.includes('access_token')) {
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

          if (goalsData && goalsData.length > 0) {
            // Convert DB data to app format
            const goals = goalsData.map(g => ({
              id: g.id,
              name: g.name,
              startDate: g.start_date,
              endDate: g.end_date,
              isPublic: false, // Default value
            }));

            const routines = routinesData?.map(r => ({
              id: r.id,
              goalId: r.goal_id,
              name: r.name,
              timeSlot: (r.auth_time_start === '05:00' ? 'morning' : r.auth_time_start === '12:00' ? 'afternoon' : 'evening') as 'morning' | 'afternoon' | 'evening',
              frequency: r.frequency,
              certified: false,
            })) || [];

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
        setGoals([]);
        setRoutines([]);
        setCurrentScreen('onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [setGoals, setRoutines]);

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

  useEffect(() => {
    if (hasOnboarded && currentScreen === 'onboarding') {
      setCurrentScreen('home');
    }
  }, [hasOnboarded, currentScreen]);

  const handleCertify = (routineId: string) => {
    setCurrentRoutineId(routineId);
    setCurrentScreen('camera');
  };

  const handleCameraComplete = () => {
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
            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            // Return to onboarding to continue flow
            setCurrentScreen('onboarding');
            window.location.reload();
          }}
        />
      );
    }

    if (!hasOnboarded) {
      return <Onboarding />;
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
