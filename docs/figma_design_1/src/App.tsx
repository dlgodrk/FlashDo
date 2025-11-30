import { useState } from 'react';
import { Home } from './components/Home';
import { Onboarding } from './components/Onboarding';
import { Camera } from './components/Camera';
import { Feed } from './components/Feed';
import { Calendar } from './components/Calendar';
import { RecordCard } from './components/RecordCard';
import { HomeIcon, Users, CalendarDays } from 'lucide-react';

export type Goal = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type Routine = {
  id: string;
  goalId: string;
  name: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  frequency: string[];
  certified: boolean;
};

export type Story = {
  id: string;
  routineId: string;
  userId: string;
  userName: string;
  image: string;
  text?: string;
  timestamp: string;
  expiresAt: string;
  blurred: boolean;
};

export type Record = {
  id: string;
  goalId: string;
  goalName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  completedDays: number;
  successRate: number;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'home' | 'camera' | 'feed' | 'calendar' | 'record'>('onboarding');
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  const handleCompleteOnboarding = (goal: Goal, routinesList: Routine[]) => {
    setGoals([goal]);
    setRoutines(routinesList);
    setHasOnboarded(true);
    setCurrentScreen('home');
  };

  const handleCertify = () => {
    setCurrentScreen('camera');
  };

  const handleCameraComplete = () => {
    // Mark routine as certified
    const todayRoutines = routines.filter(r => {
      const now = new Date().getHours();
      if (r.timeSlot === 'morning' && now >= 5 && now < 12) return true;
      if (r.timeSlot === 'afternoon' && now >= 12 && now < 18) return true;
      if (r.timeSlot === 'evening' && now >= 18 || now < 5) return true;
      return false;
    });
    
    if (todayRoutines.length > 0) {
      setRoutines(prev => prev.map(r => 
        r.id === todayRoutines[0].id ? { ...r, certified: true } : r
      ));
    }
    
    setCurrentScreen('home');
  };

  const handleViewRecord = (record: Record) => {
    setSelectedRecord(record);
    setCurrentScreen('record');
  };

  const renderScreen = () => {
    if (!hasOnboarded) {
      return <Onboarding onComplete={handleCompleteOnboarding} />;
    }

    switch (currentScreen) {
      case 'home':
        return <Home goals={goals} routines={routines} onCertify={handleCertify} />;
      case 'camera':
        return <Camera onComplete={handleCameraComplete} onCancel={() => setCurrentScreen('home')} />;
      case 'feed':
        return <Feed routines={routines} />;
      case 'calendar':
        return <Calendar goals={goals} routines={routines} onViewRecord={handleViewRecord} />;
      case 'record':
        return selectedRecord ? <RecordCard record={selectedRecord} onClose={() => setCurrentScreen('calendar')} /> : null;
      default:
        return <Home goals={goals} routines={routines} onCertify={handleCertify} />;
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
