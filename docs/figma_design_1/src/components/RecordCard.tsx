import { Record } from '../App';
import { X, Award, TrendingUp, Calendar } from 'lucide-react';

type Props = {
  record: Record;
  onClose: () => void;
};

export function RecordCard({ record, onClose }: Props) {
  const startDate = new Date(record.startDate);
  const endDate = new Date(record.endDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Mock weekly data for visualization
  const weeklyData = [
    { week: 1, completed: 6, total: 7 },
    { week: 2, completed: 7, total: 7 },
    { week: 3, completed: 5, total: 7 },
    { week: 4, completed: 7, total: 7 },
  ];

  const maxHeight = 80;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-6 py-8 bg-gradient-to-br from-neutral-900 to-neutral-700 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-neutral-300 text-sm">목표 달성 기록</p>
              <h2 className="text-white">{record.goalName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-neutral-300 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-8 grid grid-cols-3 gap-4 border-b border-neutral-200">
          <div className="text-center">
            <p className="text-neutral-500 text-sm mb-1">완료율</p>
            <p className="text-3xl text-neutral-900">{record.successRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-neutral-500 text-sm mb-1">총 일수</p>
            <p className="text-3xl text-neutral-900">{record.totalDays}</p>
          </div>
          <div className="text-center">
            <p className="text-neutral-500 text-sm mb-1">달성일</p>
            <p className="text-3xl text-neutral-900">{record.completedDays}</p>
          </div>
        </div>

        {/* Weekly Progress Visualization */}
        <div className="px-6 py-8 border-b border-neutral-200">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-neutral-600" />
            <h3 className="text-neutral-900">주간 진행도</h3>
          </div>

          <div className="flex items-end justify-between gap-3 h-32">
            {weeklyData.map((week) => {
              const percentage = (week.completed / week.total) * 100;
              const height = (percentage / 100) * maxHeight;
              
              return (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-neutral-100 rounded-t-xl relative" style={{ height: `${maxHeight}px` }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-xl transition-all"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-neutral-900 text-sm">{week.week}주</p>
                    <p className="text-neutral-500 text-xs">{week.completed}/{week.total}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Badge */}
        <div className="px-6 py-8">
          <div className="px-6 py-6 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-neutral-900 mb-1">
              {record.successRate >= 90 ? '완벽한 달성!' : record.successRate >= 70 ? '훌륭해요!' : '좋은 시작!'}
            </h3>
            <p className="text-neutral-600 text-sm">
              {record.totalDays}일 동안 {record.completedDays}일을 완수했어요
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-8">
          <button
            onClick={onClose}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
