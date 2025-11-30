import { useState } from 'react';
import { Goal, Routine } from '../App';
import { Plus, X } from 'lucide-react';

type Props = {
  onComplete: (goal: Goal, routines: Routine[]) => void;
};

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<'goal' | 'routines'>('goal');
  const [goalName, setGoalName] = useState('');
  const [duration, setDuration] = useState('30');
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [selectedDays, setSelectedDays] = useState<string[]>(['월', '화', '수', '목', '금', '토', '일']);

  const handleCreateGoal = () => {
    if (!goalName.trim()) return;
    
    const goal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    setCurrentGoal(goal);
    setStep('routines');
  };

  const handleAddRoutine = () => {
    if (!routineName.trim() || routines.length >= 3 || !currentGoal) return;
    
    const routine: Routine = {
      id: Date.now().toString(),
      goalId: currentGoal.id,
      name: routineName,
      timeSlot,
      frequency: selectedDays,
      certified: false,
    };
    
    setRoutines([...routines, routine]);
    setRoutineName('');
  };

  const handleComplete = () => {
    if (currentGoal && routines.length > 0) {
      onComplete(currentGoal, routines);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const days = ['월', '화', '수', '목', '금', '토', '일'];

  if (step === 'goal') {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-16">
            <h1 className="text-neutral-900 mb-2">FlashDo</h1>
            <p className="text-neutral-600">무거운 목표는 가슴에 품고,</p>
            <p className="text-neutral-600">가벼운 행동만 익명으로 증명하자</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-neutral-900 mb-3">
                오늘부터 시작할 목표는?
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="예: 매일 운동하기"
                className="w-full px-4 py-4 bg-white border-2 border-neutral-200 rounded-2xl focus:border-neutral-900 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-neutral-900 mb-3">
                며칠 동안 도전할까요?
              </label>
              <div className="flex gap-2">
                {['7', '14', '30', '60', '90'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDuration(days)}
                    className={`flex-1 py-3 rounded-xl transition-all ${
                      duration === days
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 border-2 border-neutral-200'
                    }`}
                  >
                    {days}일
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateGoal}
            disabled={!goalName.trim()}
            className="w-full mt-16 py-5 bg-neutral-900 text-white rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h2 className="text-neutral-900 mb-2">
            루틴 만들기
          </h2>
          <p className="text-neutral-600">
            최대 3개까지 만들 수 있어요
          </p>
        </div>

        {routines.length < 3 && (
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-neutral-900 mb-3">
                루틴 이름
              </label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="예: 아침 조깅 30분"
                className="w-full px-4 py-4 bg-white border-2 border-neutral-200 rounded-2xl focus:border-neutral-900 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-neutral-900 mb-3">
                언제 할까요?
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'morning', label: '아침' },
                  { value: 'afternoon', label: '오후' },
                  { value: 'evening', label: '저녁' },
                ].map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setTimeSlot(slot.value as any)}
                    className={`flex-1 py-3 rounded-xl transition-all ${
                      timeSlot === slot.value
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 border-2 border-neutral-200'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-neutral-900 mb-3">
                요일 선택
              </label>
              <div className="flex gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-3 rounded-xl transition-all ${
                      selectedDays.includes(day)
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 border-2 border-neutral-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddRoutine}
              disabled={!routineName.trim()}
              className="w-full py-4 bg-white text-neutral-900 border-2 border-neutral-900 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              루틴 추가
            </button>
          </div>
        )}

        {routines.length > 0 && (
          <div className="space-y-3 mb-8">
            <p className="text-neutral-600">
              추가된 루틴 ({routines.length}/3)
            </p>
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between px-4 py-4 bg-white rounded-2xl border-2 border-neutral-200"
              >
                <div>
                  <p className="text-neutral-900">{routine.name}</p>
                  <p className="text-neutral-500">
                    {routine.timeSlot === 'morning' ? '아침' : routine.timeSlot === 'afternoon' ? '오후' : '저녁'} · {routine.frequency.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => setRoutines(routines.filter(r => r.id !== routine.id))}
                  className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {routines.length > 0 && (
          <button
            onClick={handleComplete}
            className="w-full py-5 bg-neutral-900 text-white rounded-2xl"
          >
            시작하기
          </button>
        )}
      </div>
    </div>
  );
}
