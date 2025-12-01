import { useState, useEffect } from 'react';
import { Goal, Routine } from '../types';
import { Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export function Onboarding() {
  const { setGoals, setRoutines } = useApp();
  const [step, setStep] = useState<'goal' | 'routines' | 'login' | 'nickname'>('goal');
  const [goalName, setGoalName] = useState('');
  const [duration, setDuration] = useState('30');
  const [isPublic, setIsPublic] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [routinesList, setRoutinesList] = useState<Routine[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [authTime, setAuthTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['월', '화', '수', '목', '금', '토', '일']);
  const [nickname, setNickname] = useState(() => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `갓생러-${random}`;
  });
  const [loading, setLoading] = useState(false);

  // Check if user just logged in and has temp data
  useEffect(() => {
    const checkAuthAndTempData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const tempGoal = localStorage.getItem('temp_goal');
      const tempRoutines = localStorage.getItem('temp_routines');

      if (session?.user && tempGoal && tempRoutines) {
        // User is logged in and has temp data, go to nickname step
        setCurrentGoal(JSON.parse(tempGoal));
        setRoutinesList(JSON.parse(tempRoutines));
        setStep('nickname');
      }
    };

    checkAuthAndTempData();
  }, []);

  const handleCreateGoal = () => {
    if (!goalName.trim()) return;

    const goal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString(),
      isPublic,
    };

    setCurrentGoal(goal);
    setStep('routines');
  };

  const handleAddRoutine = () => {
    if (!routineName.trim() || routinesList.length >= 3 || !currentGoal) return;

    const routine: Routine = {
      id: Date.now().toString(),
      goalId: currentGoal.id,
      name: routineName,
      timeSlot,
      authTime,
      frequency: selectedDays,
      certified: false,
    };

    setRoutinesList([...routinesList, routine]);
    setRoutineName('');
    setAuthTime('09:00');
  };

  const handleRoutinesComplete = () => {
    if (currentGoal && routinesList.length > 0) {
      // Save to temporary storage
      localStorage.setItem('temp_goal', JSON.stringify(currentGoal));
      localStorage.setItem('temp_routines', JSON.stringify(routinesList));
      setStep('login');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'apple') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'kakao' ? 'kakao' : provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleNicknameSubmit = async () => {
    if (!nickname.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Save profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          nickname: nickname,
        });

      if (profileError) throw profileError;

      // Get temp data from localStorage
      const tempGoalStr = localStorage.getItem('temp_goal');
      const tempRoutinesStr = localStorage.getItem('temp_routines');

      if (!tempGoalStr || !tempRoutinesStr) throw new Error('Temp data not found');

      const tempGoal = JSON.parse(tempGoalStr);
      const tempRoutines = JSON.parse(tempRoutinesStr);

      // Save goal to database
      const { error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: tempGoal.name,
          period_days: parseInt(duration),
          start_date: tempGoal.startDate,
          end_date: tempGoal.endDate,
          is_active: true,
        });

      if (goalError) throw goalError;

      // Save routines to database
      const routinesData = tempRoutines.map((r: Routine) => {
        let authTimeStart, authTimeEnd;

        if (r.authTime) {
          // Calculate ±1 hour range
          const [h, m] = r.authTime.split(':').map(Number);
          const startH = (h - 1 + 24) % 24;
          const endH = (h + 1) % 24;
          authTimeStart = `${startH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          authTimeEnd = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        } else {
          // Legacy timeSlot support
          authTimeStart = r.timeSlot === 'morning' ? '05:00' : r.timeSlot === 'afternoon' ? '12:00' : '18:00';
          authTimeEnd = r.timeSlot === 'morning' ? '12:00' : r.timeSlot === 'afternoon' ? '18:00' : '23:59';
        }

        return {
          goal_id: tempGoal.id,
          user_id: user.id,
          name: r.name,
          auth_time_start: authTimeStart,
          auth_time_end: authTimeEnd,
          frequency: r.frequency,
        };
      });

      const { error: routinesError } = await supabase
        .from('routines')
        .insert(routinesData);

      if (routinesError) throw routinesError;

      // Clear temp data
      localStorage.removeItem('temp_goal');
      localStorage.removeItem('temp_routines');

      // Save to local state
      setGoals([tempGoal]);
      setRoutines(tempRoutines);

      alert('회원가입이 완료되었습니다!');
      window.location.reload();
    } catch (error) {
      console.error('Nickname submit error:', error);
      alert('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
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
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">FlashDo</h1>
            <p className="text-lg text-neutral-600">무거운 목표는 가슴에 품고,</p>
            <p className="text-lg text-neutral-600">가벼운 행동만 익명으로 증명하자</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-neutral-900 mb-3">
                오늘부터 시작할 목표는?
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="예: 매일 운동하기"
                className="w-full px-4 py-4 bg-white border-2 border-neutral-200 rounded-2xl focus:border-neutral-900 focus:outline-none transition-colors text-base"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-neutral-900 mb-3">
                며칠 동안 도전할까요?
              </label>
              <div className="flex gap-2">
                {['7', '14', '30', '60', '90'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDuration(days)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
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

            <div>
              <label className="block text-lg font-semibold text-neutral-900 mb-3">
                목표 공개 설정
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    !isPublic
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 border-2 border-neutral-200'
                  }`}
                >
                  비공개
                </button>
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    isPublic
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 border-2 border-neutral-200'
                  }`}
                >
                  공개
                </button>
              </div>
              <p className="text-neutral-500 text-sm mt-2">
                {isPublic ? '다른 사람들이 내 목표를 볼 수 있어요' : '나만 볼 수 있어요'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateGoal}
            disabled={!goalName.trim()}
            className="w-full mt-16 py-5 bg-neutral-900 text-white font-semibold text-lg rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            루틴 만들기
          </h2>
          <p className="text-neutral-600">
            최대 3개까지 만들 수 있어요
          </p>
        </div>

        {routinesList.length < 3 && (
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-base font-semibold text-neutral-900 mb-3">
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
              <label className="block text-base font-semibold text-neutral-900 mb-3">
                인증 시간 설정
              </label>
              <input
                type="time"
                value={authTime}
                onChange={(e) => {
                  setAuthTime(e.target.value);
                  // Auto-set timeSlot based on time
                  const hour = parseInt(e.target.value.split(':')[0]);
                  if (hour >= 5 && hour < 12) setTimeSlot('morning');
                  else if (hour >= 12 && hour < 18) setTimeSlot('afternoon');
                  else setTimeSlot('evening');
                }}
                className="w-full px-4 py-4 bg-white border-2 border-neutral-200 rounded-2xl focus:border-neutral-900 focus:outline-none transition-colors text-lg text-center font-medium"
              />
              <p className="text-neutral-500 text-sm mt-2">
                💡 설정한 시간 ±1시간 동안 인증할 수 있어요
              </p>
              <p className="text-neutral-400 text-xs mt-1">
                예: {authTime} 설정 시 {(() => {
                  const [h, m] = authTime.split(':').map(Number);
                  const startH = (h - 1 + 24) % 24;
                  const endH = (h + 1) % 24;
                  return `${startH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ~ ${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                })()} 사이 인증 가능
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold text-neutral-900 mb-3">
                요일 선택
              </label>
              <div className="flex gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
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
              className="w-full py-4 bg-white text-neutral-900 border-2 border-neutral-900 rounded-2xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              루틴 추가
            </button>
          </div>
        )}

        {routinesList.length > 0 && (
          <div className="space-y-3 mb-8">
            <p className="text-neutral-600 font-medium">
              추가된 루틴 ({routinesList.length}/3)
            </p>
            {routinesList.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between px-4 py-4 bg-white rounded-2xl border-2 border-neutral-200"
              >
                <div>
                  <p className="text-neutral-900 font-medium">{routine.name}</p>
                  <p className="text-neutral-500 text-sm">
                    {routine.authTime ? `${routine.authTime} (±1시간)` : routine.timeSlot === 'morning' ? '아침' : routine.timeSlot === 'afternoon' ? '오후' : '저녁'} · {routine.frequency.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => setRoutinesList(routinesList.filter(r => r.id !== routine.id))}
                  className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {routinesList.length > 0 && (
          <button
            onClick={handleRoutinesComplete}
            className="w-full py-5 bg-neutral-900 text-white font-semibold text-lg rounded-2xl"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              회원가입이 필요합니다
            </h2>
            <p className="text-neutral-600 mb-2">
              목표와 루틴이 준비되었습니다!
            </p>
            <p className="text-neutral-600">
              소셜 로그인으로 간편하게 시작하세요
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={loading}
              className="w-full py-5 bg-[#FEE500] text-[#000000] font-semibold text-lg rounded-2xl transition-all hover:bg-[#FDD835] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.442 1.604 4.629 4.027 6.037l-1.277 4.686a.5.5 0 0 0 .773.565l5.394-3.596C11.264 18.067 11.628 18 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
              </svg>
              카카오로 시작하기
            </button>

            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full py-5 bg-white text-neutral-900 font-semibold text-lg rounded-2xl border-2 border-neutral-200 transition-all hover:border-neutral-900 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </button>

            <button
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
              className="w-full py-5 bg-black text-white font-semibold text-lg rounded-2xl transition-all hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple로 시작하기
            </button>
          </div>

          <p className="text-sm text-neutral-500 text-center mt-8">
            계속 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    );
  }

  if (step === 'nickname') {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              다른 동료들이 당신을 부를 이름
            </h2>
            <p className="text-neutral-600">
              언제든지 변경할 수 있어요
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full px-4 py-5 bg-white border-2 border-neutral-200 rounded-2xl focus:border-neutral-900 focus:outline-none transition-colors text-lg text-center font-medium"
                maxLength={20}
              />
              <p className="text-neutral-500 text-sm text-center mt-2">
                {nickname.length}/20
              </p>
            </div>

            <button
              onClick={() => {
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                setNickname(`갓생러-${random}`);
              }}
              className="w-full py-3 bg-white text-neutral-600 border-2 border-neutral-200 rounded-xl font-medium transition-all hover:border-neutral-900"
            >
              다시 생성하기
            </button>
          </div>

          <button
            onClick={handleNicknameSubmit}
            disabled={!nickname.trim() || loading}
            className="w-full mt-16 py-5 bg-neutral-900 text-white font-semibold text-lg rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? '처리중...' : '시작하기'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
