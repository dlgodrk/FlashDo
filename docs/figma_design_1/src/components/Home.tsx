import { Goal, Routine } from '../App';
import { Camera, CheckCircle2, Circle } from 'lucide-react';

type Props = {
  goals: Goal[];
  routines: Routine[];
  onCertify: () => void;
};

export function Home({ goals, routines, onCertify }: Props) {
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
  
  const hasUncertified = todayRoutines.some(r => !r.certified);
  const allCertified = todayRoutines.length > 0 && todayRoutines.every(r => r.certified);
  
  // Calculate days passed
  const startDate = new Date(currentGoal.startDate);
  const endDate = new Date(currentGoal.endDate);
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const getTimeSlotLabel = () => {
    if (currentTimeSlot === 'morning') return '오늘 아침';
    if (currentTimeSlot === 'afternoon') return '오늘 오후';
    return '오늘 저녁';
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-neutral-600 mb-1">
            Day {daysPassed} / {totalDays}
          </p>
          <h1 className="text-neutral-900">
            {currentGoal.name}
          </h1>
        </div>

        {/* Today's Routines */}
        <div className="mb-12">
          <h2 className="text-neutral-900 mb-4">
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
                  <span className={routine.certified ? 'text-white' : 'text-neutral-900'}>
                    {routine.name}
                  </span>
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
                onClick={onCertify}
                className="w-full py-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-3xl shadow-lg shadow-orange-200 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <Camera className="w-7 h-7" />
                <span className="text-lg">지금 인증하기</span>
              </button>
            </div>
          </div>
        )}

        {allCertified && (
          <div className="px-6 py-8 bg-gradient-to-br from-neutral-900 to-neutral-700 text-white rounded-3xl text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg mb-1">오늘의 루틴 완료!</p>
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
