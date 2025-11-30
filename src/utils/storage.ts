import { Goal, Routine, Story, Record } from '../types';

const STORAGE_KEYS = {
  GOALS: 'flashdo_goals',
  ROUTINES: 'flashdo_routines',
  STORIES: 'flashdo_stories',
  RECORDS: 'flashdo_records',
  CERTIFICATIONS: 'flashdo_certifications',
  USER_ID: 'flashdo_user_id',
};

// User ID generation
export function getUserId(): string {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}

// Goals
export function saveGoals(goals: Goal[]): void {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
}

export function getGoals(): Goal[] {
  const data = localStorage.getItem(STORAGE_KEYS.GOALS);
  return data ? JSON.parse(data) : [];
}

// Routines
export function saveRoutines(routines: Routine[]): void {
  localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
}

export function getRoutines(): Routine[] {
  const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
  return data ? JSON.parse(data) : [];
}

// Stories
export function saveStories(stories: Story[]): void {
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
}

export function getStories(): Story[] {
  const data = localStorage.getItem(STORAGE_KEYS.STORIES);
  if (!data) return [];

  const stories: Story[] = JSON.parse(data);
  const now = Date.now();

  // Filter out expired stories
  const validStories = stories.filter(story => {
    const expiresAt = new Date(story.expiresAt).getTime();
    return expiresAt > now;
  });

  // Save filtered stories
  if (validStories.length !== stories.length) {
    saveStories(validStories);
  }

  return validStories;
}

// Records
export function saveRecords(records: Record[]): void {
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
}

export function getRecords(): Record[] {
  const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
  return data ? JSON.parse(data) : [];
}

// Certifications (track which days user certified)
export type Certification = {
  routineId: string;
  date: string; // YYYY-MM-DD format
  timestamp: string;
};

export function saveCertifications(certifications: Certification[]): void {
  localStorage.setItem(STORAGE_KEYS.CERTIFICATIONS, JSON.stringify(certifications));
}

export function getCertifications(): Certification[] {
  const data = localStorage.getItem(STORAGE_KEYS.CERTIFICATIONS);
  return data ? JSON.parse(data) : [];
}

export function addCertification(routineId: string): void {
  const certifications = getCertifications();
  const today = new Date().toISOString().split('T')[0];

  // Check if already certified today for this routine
  const alreadyCertified = certifications.some(
    cert => cert.routineId === routineId && cert.date === today
  );

  if (!alreadyCertified) {
    certifications.push({
      routineId,
      date: today,
      timestamp: new Date().toISOString(),
    });
    saveCertifications(certifications);
  }
}

// Calculate streak
export function calculateStreak(routineId: string): number {
  const certifications = getCertifications()
    .filter(cert => cert.routineId === routineId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (certifications.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const cert of certifications) {
    const certDate = new Date(cert.date);
    certDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - certDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Check if user has certified today
export function hasCertifiedToday(): boolean {
  const certifications = getCertifications();
  const today = new Date().toISOString().split('T')[0];
  return certifications.some(cert => cert.date === today);
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
