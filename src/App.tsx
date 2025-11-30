import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Onboarding } from './components/Onboarding';
import { Camera } from './components/Camera';
import { Feed } from './components/Feed';
import { Calendar } from './components/Calendar';
import { RecordCard } from './components/RecordCard';
import { HomeIcon, Users, CalendarDays } from 'lucide-react';
import { useApp } from './context/AppContext';
import { Record } from './types';

export default function App() {
  const { goals, routines, completeGoal } = useApp();
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'home' | 'camera' | 'feed' | 'calendar' | 'record'>('onboarding');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(null);

  const hasOnboarded = goals.length > 0;

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

  const renderScreen = () => {
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
