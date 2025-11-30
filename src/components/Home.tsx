import { Camera, CheckCircle2, Circle, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Props = {
  onCertify: (routineId: string) => void;
};

export function Home({ onCertify }: Props) {
  const { goals, routines, calculateStreak } = useApp();

  if (goals.length === 0) return null;

  const currentGoal = goals[0];

  // Get current time slot
  const now = new Date();
  const hour = now.getHours();
  let currentTimeSlot: 'morning' | 'afternoon' | 'evening' = 'morning';
  if (hour >= 12 && hour < 18) currentTimeSlot = 'afternoon';
  else if (hour >= 18 || hour < 5) currentTimeSlot = 'evening';

  // Get today's day
  const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
  const today = dayMap[now.getDay()];

  // Filter routines for current time slot and today
  const todayRoutines = routines.filter(r =>
    r.timeSlot === currentTimeSlot && r.frequency.includes(today)
  );

  // Check if time slot is active
  const isTimeSlotActive = () => {
    if (currentTimeSlot === 'morning' && hour >= 5 && hour < 12) return true;
    if (currentTimeSlot === 'afternoon' && hour >= 12 && hour < 18) return true;
    if (currentTimeSlot === 'evening' && (hour >= 18 || hour < 5)) return true;
    return false;
  };

  const hasUncertified = todayRoutines.some(r => !r.certified);
  const allCertified = todayRoutines.length > 0 && todayRoutines.every(r => r.certified);
  const timeSlotActive = isTimeSlotActive();

  // Calculate days passed
  const startDate = new Date(currentGoal.startDate);
  const endDate = new Date(currentGoal.endDate);
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const streak = calculateStreak(currentGoal.id);

  const getTimeSlotLabel = () => {
    if (currentTimeSlot === 'morning') return '오늘 아침';
    if (currentTimeSlot === 'afternoon') return '오늘 오후';
    return '오늘 저녁';
  };

  const getNextTimeSlot = () => {
    if (currentTimeSlot === 'morning') return '오후 12시';
    if (currentTimeSlot === 'afternoon') return '저녁 6시';
    return '내일 아침 5시';
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
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
            {getTimeSlotLabel()}
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
                  <span className={`text-base font-medium ${routine.certified ? 'text-white' : 'text-neutral-900'}`}>
                    {routine.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certify Button - Toss style: High contrast, centered, large */}
        {hasUncertified && timeSlotActive && (
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

        {/* Time slot locked */}
        {hasUncertified && !timeSlotActive && (
          <div className="px-6 py-8 bg-neutral-200 text-neutral-700 rounded-3xl text-center">
            <Lock className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
            <p className="text-lg font-semibold mb-1">인증 시간이 아니에요</p>
            <p className="text-neutral-600">
              {getNextTimeSlot()}부터 인증할 수 있어요
            </p>
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
