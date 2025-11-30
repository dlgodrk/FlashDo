import { useState } from 'react';
import { supabase } from '../lib/supabase';

type OnboardingStep = 'goal' | 'login' | 'nickname' | 'routines';

export function NewOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('goal');
  const [goalName, setGoalName] = useState('');
  const [period, setPeriod] = useState<number>(30);
  const [customPeriod, setCustomPeriod] = useState('');
  const [nickname, setNickname] = useState(() => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `갓생러-${random}`;
  });
  const [loading, setLoading] = useState(false);

  // Step 1: Goal Input
  const handleGoalNext = () => {
    if (!goalName.trim()) return;

    // Save goal to localStorage temporarily
    localStorage.setItem('temp_goal', JSON.stringify({
      name: goalName,
      period: period,
    }));

    setStep('login');
  };

  // Step 2: Social Login
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

  // Step 3: Nickname Setup
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

      // Get temp goal from localStorage
      const tempGoalStr = localStorage.getItem('temp_goal');
      if (!tempGoalStr) throw new Error('Temp goal not found');

      const tempGoal = JSON.parse(tempGoalStr);
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + tempGoal.period);

      // Save goal to database
      const { error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: tempGoal.name,
          period_days: tempGoal.period,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
        });

      if (goalError) throw goalError;

      // Clear temp data
      localStorage.removeItem('temp_goal');

      // Set onboarding complete flag
      localStorage.setItem('onboarding_complete', 'true');

      // Move to routines setup
      setStep('routines');
    } catch (error) {
      console.error('Nickname submit error:', error);
      alert('닉네임 설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Render based on step
  if (step === 'goal') {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-16">
            <h1 className="text-4xl font-bold text-neutral-900 mb-8">FlashDo</h1>
            <p className="text-2xl font-semibold text-neutral-900 mb-2">
              오늘, 단 하나의 목표를 설정하세요
            </p>
            <p className="text-neutral-600">
              작은 루틴의 반복이 큰 변화를 만듭니다
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-neutral-900 mb-3">
                목표 이름
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
                도전 기간
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[7, 21, 30, 60].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      setPeriod(days);
                      setCustomPeriod('');
                    }}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      period === days && !customPeriod
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 border-2 border-neutral-200'
                    }`}
                  >
                    {days}일
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={customPeriod}
                onChange={(e) => {
                  setCustomPeriod(e.target.value);
                  if (e.target.value) {
                    setPeriod(parseInt(e.target.value));
                  }
                }}
                placeholder="직접 입력 (일)"
                className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:border-neutral-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleGoalNext}
            disabled={!goalName.trim()}
            className="w-full mt-16 py-5 bg-neutral-900 text-white font-semibold text-lg rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              당신의 목표를 안전하게 보관할게요
            </h2>
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
            {loading ? '처리중...' : '확인'}
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Routines (redirect to existing Onboarding component)
  if (step === 'routines') {
    // This will be handled by showing the existing routine creation flow
    window.location.reload(); // Reload to show the home screen
    return null;
  }

  return null;
}
