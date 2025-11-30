import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  onComplete: () => void;
};

export function AuthCallback({ onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        // Check if profile already exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          // User already has a profile, go to home
          localStorage.setItem('onboarding_complete', 'true');
          onComplete();
        } else {
          // Need to set nickname
          // This will be handled by the parent component
          onComplete();
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('로그인 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [onComplete]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
