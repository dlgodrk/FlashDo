import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Goal, Routine, Story, Record } from '../types';
import * as storage from '../utils/storage';

type AppContextType = {
  goals: Goal[];
  routines: Routine[];
  stories: Story[];
  records: Record[];
  userId: string;
  setGoals: (goals: Goal[]) => void;
  setRoutines: (routines: Routine[]) => void;
  addStory: (story: Omit<Story, 'id' | 'userId' | 'userName' | 'timestamp' | 'expiresAt'>) => void;
  certifyRoutine: (routineId: string, imageUrl: string, text?: string) => void;
  hasCertifiedToday: () => boolean;
  calculateStreak: (goalId: string) => number;
  completeGoal: (goalId: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [routines, setRoutinesState] = useState<Routine[]>([]);
  const [stories, setStoriesState] = useState<Story[]>([]);
  const [records, setRecordsState] = useState<Record[]>([]);
  const [userId] = useState(() => storage.getUserId());

  // Load data from storage on mount
  useEffect(() => {
    setGoalsState(storage.getGoals());
    setRoutinesState(storage.getRoutines());
    setStoriesState(storage.getStories());
    setRecordsState(storage.getRecords());
  }, []);

  // Auto-cleanup expired stories every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const validStories = storage.getStories();
      setStoriesState(validStories);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const setGoals = (newGoals: Goal[]) => {
    setGoalsState(newGoals);
    storage.saveGoals(newGoals);
  };

  const setRoutines = (newRoutines: Routine[]) => {
    setRoutinesState(newRoutines);
    storage.saveRoutines(newRoutines);
  };

  const addStory = (storyData: Omit<Story, 'id' | 'userId' | 'userName' | 'timestamp' | 'expiresAt' | 'blurred'>) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    const newStory: Story = {
      ...storyData,
      id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: `익명의 도전자 #${userId.slice(-4)}`,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      blurred: false,
    };

    const updatedStories = [...stories, newStory];
    setStoriesState(updatedStories);
    storage.saveStories(updatedStories);
  };

  const certifyRoutine = (routineId: string, imageUrl: string, text?: string) => {
    // Mark routine as certified
    const updatedRoutines = routines.map(r =>
      r.id === routineId ? { ...r, certified: true } : r
    );
    setRoutines(updatedRoutines);

    // Add certification record
    storage.addCertification(routineId);

    // Create story
    addStory({
      routineId,
      image: imageUrl,
      text: text || '',
    });
  };

  const hasCertifiedToday = () => {
    return storage.hasCertifiedToday();
  };

  const calculateStreak = (goalId: string) => {
    const goalRoutines = routines.filter(r => r.goalId === goalId);
    if (goalRoutines.length === 0) return 0;

    // Calculate average streak across all routines
    const streaks = goalRoutines.map(r => storage.calculateStreak(r.id));
    return Math.max(...streaks);
  };

  const completeGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const goalRoutines = routines.filter(r => r.goalId === goalId);
    const certifications = storage.getCertifications();

    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Count unique days certified
    const certifiedDates = new Set(
      certifications
        .filter(cert => goalRoutines.some(r => r.id === cert.routineId))
        .map(cert => cert.date)
    );

    const completedDays = certifiedDates.size;
    const successRate = Math.round((completedDays / totalDays) * 100);

    const newRecord: Record = {
      id: `record_${Date.now()}`,
      goalId: goal.id,
      goalName: goal.name,
      startDate: goal.startDate,
      endDate: goal.endDate,
      totalDays,
      completedDays,
      successRate,
    };

    const updatedRecords = [...records, newRecord];
    setRecordsState(updatedRecords);
    storage.saveRecords(updatedRecords);

    // Remove completed goal and its routines
    setGoals(goals.filter(g => g.id !== goalId));
    setRoutines(routines.filter(r => r.goalId !== goalId));
  };

  return (
    <AppContext.Provider
      value={{
        goals,
        routines,
        stories,
        records,
        userId,
        setGoals,
        setRoutines,
        addStory,
        certifyRoutine,
        hasCertifiedToday,
        calculateStreak,
        completeGoal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
