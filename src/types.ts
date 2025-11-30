export type Goal = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
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
