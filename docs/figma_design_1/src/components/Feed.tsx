import { useState } from 'react';
import { Story, Routine } from '../App';
import { Flame, Zap, Heart } from 'lucide-react';

type Props = {
  routines: Routine[];
};

export function Feed({ routines }: Props) {
  const hasCertified = routines.some(r => r.certified);
  
  // Mock stories
  const mockStories: Story[] = [
    {
      id: '1',
      routineId: '1',
      userId: 'user1',
      userName: '익명의 도전자 #1234',
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
      text: '오늘도 완주! 🏃‍♂️',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      blurred: !hasCertified,
    },
    {
      id: '2',
      routineId: '2',
      userId: 'user2',
      userName: '익명의 도전자 #5678',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop',
      text: '헬스장 출석!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      blurred: !hasCertified,
    },
    {
      id: '3',
      routineId: '3',
      userId: 'user3',
      userName: '익명의 도전자 #9012',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=600&fit=crop',
      text: '',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      blurred: !hasCertified,
    },
  ];

  const [stories] = useState<Story[]>(mockStories);
  const [reactions, setReactions] = useState<Record<string, string | null>>({});

  const handleReaction = (storyId: string, emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [storyId]: prev[storyId] === emoji ? null : emoji,
    }));
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  if (!hasCertified) {
    return (
      <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
        <div className="max-w-md mx-auto">
          <h1 className="text-neutral-900 mb-8">
            오늘의 피드
          </h1>

          <div className="space-y-4">
            {stories.map((story) => (
              <div key={story.id} className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-neutral-200">
                <div className="absolute inset-0 backdrop-blur-2xl bg-neutral-300/50 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-400/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-500/50" />
                    </div>
                    <p className="text-neutral-700 mb-1">
                      인증하면 볼 수 있어요
                    </p>
                    <p className="text-neutral-500 text-sm">
                      {story.userName}의 스토리
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 px-6 py-6 bg-gradient-to-br from-neutral-900 to-neutral-700 text-white rounded-3xl text-center">
            <p className="mb-1">🔒 블라인드 피드</p>
            <p className="text-neutral-300 text-sm">
              오늘의 루틴을 인증하면 다른 사람들의 인증을 확인할 수 있어요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-neutral-900 mb-2">
          오늘의 피드
        </h1>
        <p className="text-neutral-600 mb-8">
          {stories.length}명이 오늘 인증했어요
        </p>

        <div className="space-y-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-3xl overflow-hidden border-2 border-neutral-200">
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-neutral-900">{story.userName}</p>
                  <p className="text-neutral-500 text-sm">{getTimeAgo(story.timestamp)}</p>
                </div>
                <div className="px-3 py-1 bg-neutral-100 rounded-full">
                  <p className="text-neutral-600 text-xs">12시간 후 삭제</p>
                </div>
              </div>

              {/* Image */}
              <div className="relative aspect-[3/4] bg-neutral-100">
                <img
                  src={story.image}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text */}
              {story.text && (
                <div className="px-5 py-4">
                  <p className="text-neutral-900">{story.text}</p>
                </div>
              )}

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
                      onClick={() => handleReaction(story.id, emoji)}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        reactions[story.id] === emoji
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
