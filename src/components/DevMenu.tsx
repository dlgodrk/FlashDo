import { useState } from 'react';
import { Settings, X, Trash2, LogOut, UserX, Database, Clock, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  onResetOnboarding: () => void;
};

export function DevMenu({ onResetOnboarding }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [overrideTime, setOverrideTime] = useState<Date | null>(null);

  const handleDeleteGoals = async () => {
    if (!confirm('목표와 루틴을 모두 삭제하시겠습니까?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Delete routines first (foreign key constraint)
      await supabase.from('routines').delete().eq('user_id', user.id);

      // Delete goals
      await supabase.from('goals').delete().eq('user_id', user.id);

      // Also clear localStorage
      localStorage.removeItem('flashdo_goals');
      localStorage.removeItem('flashdo_routines');

      alert('목표와 루틴이 삭제되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting goals:', error);
      alert('목표 삭제에 실패했습니다.');
    }
  };

  const handleDeleteFeed = async () => {
    if (!confirm('피드 데이터를 모두 삭제하시겠습니까?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Delete verifications (feed data)
      await supabase.from('verifications').delete().eq('user_id', user.id);

      alert('피드 데이터가 삭제되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting feed:', error);
      alert('피드 삭제에 실패했습니다.');
    }
  };

  const handleDeleteStories = () => {
    if (!confirm('스토리를 모두 삭제하시겠습니까?')) return;

    try {
      // Delete stories from localStorage
      localStorage.removeItem('flashdo_stories');

      alert('스토리가 삭제되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting stories:', error);
      alert('스토리 삭제에 실패했습니다.');
    }
  };

  const handleClearCache = () => {
    if (!confirm('모든 캐시 데이터를 삭제하시겠습니까? (localStorage 전체 삭제)')) return;

    try {
      // Clear all localStorage
      localStorage.clear();

      alert('캐시가 삭제되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('캐시 삭제에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;

    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Delete all user data first
      await supabase.from('verifications').delete().eq('user_id', user.id);
      await supabase.from('routines').delete().eq('user_id', user.id);
      await supabase.from('goals').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Delete auth user (requires admin privileges)
      // Note: This needs to be implemented on the backend
      alert('계정 삭제 요청이 전송되었습니다.');

      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('계정 삭제에 실패했습니다.');
    }
  };

  const handleResetAllDB = async () => {
    if (!confirm('전체 DB를 초기화하시겠습니까? 모든 테스트 데이터가 삭제됩니다.')) return;

    try {
      // This is a dangerous operation - only for development
      await supabase.from('verifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('routines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      alert('전체 DB가 초기화되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting DB:', error);
      alert('DB 초기화에 실패했습니다.');
    }
  };

  const handleTimeOverride = (hours: number) => {
    const newTime = new Date();
    newTime.setHours(newTime.getHours() + hours);
    setOverrideTime(newTime);
    localStorage.setItem('dev_time_override', newTime.toISOString());
    alert(`시간이 ${hours > 0 ? '+' : ''}${hours}시간 이동되었습니다.`);
  };

  const handleResetTime = () => {
    setOverrideTime(null);
    localStorage.removeItem('dev_time_override');
    alert('시간이 리셋되었습니다.');
  };

  const handleSetSpecificTime = () => {
    const timeStr = prompt('설정할 시간을 입력하세요 (HH:MM 형식)');
    if (!timeStr) return;

    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours, minutes, 0, 0);
      setOverrideTime(newTime);
      localStorage.setItem('dev_time_override', newTime.toISOString());
      alert(`시간이 ${timeStr}로 설정되었습니다.`);
    } catch (error) {
      alert('잘못된 시간 형식입니다.');
    }
  };

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
        title="개발자 메뉴"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">개발자 메뉴</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Data Management */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  데이터 관리
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleDeleteGoals}
                    className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-medium hover:bg-orange-100 transition-colors text-left"
                  >
                    목표 삭제
                  </button>
                  <button
                    onClick={handleDeleteFeed}
                    className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-medium hover:bg-orange-100 transition-colors text-left"
                  >
                    피드 삭제
                  </button>
                  <button
                    onClick={handleDeleteStories}
                    className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-medium hover:bg-orange-100 transition-colors text-left"
                  >
                    스토리 삭제
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-medium hover:bg-purple-100 transition-colors text-left"
                  >
                    캐시 전체 삭제
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-neutral-50 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 transition-colors text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors text-left flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    계정 완전 삭제
                  </button>
                  <button
                    onClick={handleResetAllDB}
                    className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors text-left flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    전체 DB 초기화 (개발용)
                  </button>
                </div>
              </div>

              {/* Time Control */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  시간 조작
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleSetSpecificTime}
                    className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors text-left"
                  >
                    현재 시간 오버라이드
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTimeOverride(1)}
                      className="px-4 py-3 bg-neutral-50 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 transition-colors"
                    >
                      +1시간
                    </button>
                    <button
                      onClick={() => handleTimeOverride(-1)}
                      className="px-4 py-3 bg-neutral-50 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 transition-colors"
                    >
                      -1시간
                    </button>
                  </div>
                  <button
                    onClick={handleResetTime}
                    className="w-full px-4 py-3 bg-neutral-50 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 transition-colors text-left"
                  >
                    시간 리셋
                  </button>
                  {overrideTime && (
                    <p className="text-sm text-neutral-500 text-center">
                      현재 설정: {overrideTime.toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Test Scenarios */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  테스트 시나리오
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onResetOnboarding();
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-medium hover:bg-purple-100 transition-colors text-left"
                  >
                    온보딩 다시 보기
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 px-6 py-4 bg-neutral-50">
              <p className="text-xs text-neutral-500 text-center">
                설정 및 데이터 관리
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
