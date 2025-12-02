import { Camera, CheckCircle2, Circle, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DevMenu } from './DevMenu';

type Props = {
  onCertify: (routineId: string) => void;
  onStartGoal?: () => void;
};

export function Home({ onCertify, onStartGoal }: Props) {
  const { goals, routines, calculateStreak } = useApp();

  const handleResetOnboarding = () => {
    localStorage.removeItem('onboarding_complete');
    localStorage.removeItem('flashdo_goals');
    localStorage.removeItem('flashdo_routines');
    window.location.reload();
  };

  if (goals.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24">
        <DevMenu onResetOnboarding={handleResetOnboarding} />
        <div className="max-w-md mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
              <Target className="w-12 h-12 text-neutral-400" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              첫 목표를 만들어보세요
            </h1>
            <p className="text-neutral-600 text-lg">
              무거운 목표는 가슴에 품고,<br />
              가벼운 행동만 익명으로 증명하자
            </p>
          </div>

          <button
            onClick={onStartGoal}
            className="w-full py-6 bg-neutral-900 text-white font-bold text-lg rounded-3xl transition-all hover:bg-neutral-800 active:scale-95"
          >
            첫 목표 만들기
          </button>

          <div className="mt-8 px-6 py-5 bg-neutral-100 rounded-2xl">
            <p className="text-neutral-600 text-sm">
              💡 목표를 설정하고 매일 루틴을 인증해보세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentGoal = goals[0];

  // Get current time
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTimeMinutes = hour * 60 + minute;

  // Get today's day
  const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
  const today = dayMap[now.getDay()];

  // Check if routine is within auth time window
  const isRoutineActive = (routine: typeof routines[0]) => {
    if (!routine.authTime) {
      // Legacy timeSlot support
      if (routine.timeSlot === 'morning' && hour >= 5 && hour < 12) return true;
      if (routine.timeSlot === 'afternoon' && hour >= 12 && hour < 18) return true;
      if (routine.timeSlot === 'evening' && (hour >= 18 || hour < 5)) return true;
      return false;
    }

    // Check ±1 hour window for authTime
    const [authHour, authMinute] = routine.authTime.split(':').map(Number);
    const authTimeMinutes = authHour * 60 + authMinute;
    const startMinutes = authTimeMinutes - 60;
    const endMinutes = authTimeMinutes + 60;

    // Handle day wrap-around
    if (startMinutes < 0) {
      return currentTimeMinutes >= (startMinutes + 1440) || currentTimeMinutes <= endMinutes;
    } else if (endMinutes >= 1440) {
      return currentTimeMinutes >= startMinutes || currentTimeMinutes <= (endMinutes - 1440);
    } else {
      return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
    }
  };

  // Filter routines for today and active time
  const todayRoutines = routines.filter(r =>
    r.frequency.includes(today) && isRoutineActive(r)
  );

  const hasUncertified = todayRoutines.some(r => !r.certified);
  const allCertified = todayRoutines.length > 0 && todayRoutines.every(r => r.certified);

  // Calculate days passed
  const startDate = new Date(currentGoal.startDate);
  const endDate = new Date(currentGoal.endDate);
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const streak = calculateStreak(currentGoal.id);


  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <DevMenu onResetOnboarding={handleResetOnboarding} />
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-neutral-600 mb-1 text-sm">
            Day {daysPassed} / {totalDays} · 연속 {streak}일 🔥
          </p>
          <h1 className="text-3xl font-bold text-neutral-900">
            {currentGoal.name}
          </h1>
        </div>

        {/* Today's Routines */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            인증 가능한 루틴
          </h2>

          {todayRoutines.length === 0 ? (
            <div className="px-6 py-12 bg-white rounded-3xl border-2 border-neutral-200 text-center">
              <p className="text-neutral-500">
                이 시간대에 예정된 루틴이 없어요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className={`flex items-center gap-4 px-6 py-5 rounded-3xl transition-all ${
                    routine.certified
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border-2 border-neutral-200'
                  }`}
                >
                  {routine.certified ? (
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 flex-shrink-0 text-neutral-400" />
                  )}
                  <div className="flex-1">
                    <span className={`text-base font-medium block ${routine.certified ? 'text-white' : 'text-neutral-900'}`}>
                      {routine.name}
                    </span>
                    {routine.authTime && (
                      <span className={`text-xs ${routine.certified ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {routine.authTime} ±1시간
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certify Button - Toss style: High contrast, centered, large */}
        {hasUncertified && (
          <div className="fixed bottom-24 left-0 right-0 px-6">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => onCertify(todayRoutines.find(r => !r.certified)!.id)}
                className="w-full py-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-3xl shadow-lg shadow-orange-200 flex items-center justify-center gap-3 transition-transform active:scale-95 font-bold text-lg"
              >
                <Camera className="w-7 h-7" />
                <span>지금 인증하기</span>
              </button>
            </div>
          </div>
        )}

        {allCertified && (
          <div className="px-6 py-8 bg-gradient-to-br from-neutral-900 to-neutral-700 text-white rounded-3xl text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-semibold mb-1">오늘의 루틴 완료!</p>
            <p className="text-neutral-300">
              다른 사람들의 인증을 확인해보세요
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 px-6 py-5 bg-neutral-100 rounded-2xl">
          <p className="text-neutral-600 text-sm">
            💡 인증하면 다른 사람들의 인증 스토리를 볼 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}
