import { useState, useEffect } from 'react';
import { Flame, Zap, Heart, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

type Verification = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
};

export function Feed() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [reactions, setReactions] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [certified, setCertified] = useState(false);

  // Load verifications from DB and check if user certified today
  useEffect(() => {
    const loadData = async () => {
      try {
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        const today = now.toISOString().split('T')[0];

        // Get all verifications for feed
        const { data, error } = await supabase
          .from('verifications')
          .select('*')
          .gte('expires_at', now.toISOString())
          .gte('created_at', twelveHoursAgo.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVerifications(data || []);

        // Check if current user certified today
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: todayCerts } = await supabase
            .from('verifications')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .limit(1);

          setCertified((todayCerts?.length || 0) > 0);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleReaction = (storyId: string, emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [storyId]: prev[storyId] === emoji ? null : emoji,
    }));
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = currentTime;
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return '곧 삭제';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}시간 ${minutes}분 후 삭제`;
    return `${minutes}분 후 삭제`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = currentTime;
    const diff = now - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">
            오늘의 피드
          </h1>
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!certified) {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">
            오늘의 피드
          </h1>

          <div className="space-y-4">
            {verifications.slice(0, 3).map((verification) => (
              <div key={verification.id} className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-neutral-200">
                <div className="absolute inset-0 backdrop-blur-2xl bg-neutral-300/50 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-400/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-500/50" />
                    </div>
                    <p className="text-neutral-700 font-semibold mb-1">
                      인증하면 볼 수 있어요
                    </p>
                    <p className="text-neutral-500 text-sm">
                      익명 사용자의 인증
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 px-6 py-6 bg-gradient-to-br from-neutral-900 to-neutral-700 text-white rounded-3xl text-center">
            <p className="text-lg font-semibold mb-1">🔒 블라인드 피드</p>
            <p className="text-neutral-300 text-sm">
              오늘의 루틴을 인증하면 다른 사람들의 인증을 확인할 수 있어요
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            오늘의 피드
          </h1>
          <p className="text-neutral-600 mb-8">
            아직 인증한 사람이 없어요
          </p>

          <div className="px-6 py-12 bg-white rounded-3xl border-2 border-neutral-200 text-center">
            <p className="text-neutral-500">
              첫 번째 인증자가 되어보세요!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          오늘의 피드
        </h1>
        <p className="text-neutral-600 mb-8">
          {verifications.length}명이 오늘 인증했어요
        </p>

        <div className="space-y-6">
          {verifications.map((verification) => (
            <div key={verification.id} className="bg-white rounded-3xl overflow-hidden border-2 border-neutral-200">
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-neutral-900 font-semibold">익명 #{verification.user_id.slice(-4)}</p>
                  <p className="text-neutral-500 text-sm">{getTimeAgo(verification.created_at)}</p>
                </div>
                <div className="px-3 py-1.5 bg-orange-50 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <p className="text-orange-600 text-xs font-medium">{getTimeRemaining(verification.expires_at)}</p>
                </div>
              </div>

              {/* Media */}
              <div className="relative aspect-[3/4] bg-neutral-100">
                {verification.media_type === 'video' ? (
                  <video
                    src={verification.media_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={verification.media_url}
                    alt="Verification"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Reactions */}
              <div className="px-5 py-4 border-t border-neutral-100">
                <div className="flex gap-2">
                  {[
                    { emoji: 'flame', icon: Flame, label: '불타올라' },
                    { emoji: 'zap', icon: Zap, label: '에너지' },
                    { emoji: 'heart', icon: Heart, label: '응원' },
                  ].map(({ emoji, icon: Icon, label }) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(verification.id, emoji)}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium ${
                        reactions[verification.id] === emoji
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
