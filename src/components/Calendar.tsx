import { useState } from 'react';
import { Record } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as storage from '../utils/storage';

type Props = {
  onViewRecord: (record: Record) => void;
};

export function Calendar({ onViewRecord }: Props) {
  const { goals, records, calculateStreak } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (goals.length === 0) return null;

  const currentGoal = goals[0];

  // Get certifications for calendar
  const certifications = storage.getCertifications();
  const goalRoutineIds = storage.getRoutines()
    .filter(r => r.goalId === currentGoal.id)
    .map(r => r.id);

  const getCertifiedDates = () => {
    const dates = new Set<number>();
    certifications
      .filter(cert => goalRoutineIds.includes(cert.routineId))
      .forEach(cert => {
        const certDate = new Date(cert.date);
        if (
          certDate.getMonth() === currentMonth.getMonth() &&
          certDate.getFullYear() === currentMonth.getFullYear()
        ) {
          dates.add(certDate.getDate());
        }
      });
    return dates;
  };

  const certifiedDates = getCertifiedDates();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const startDate = new Date(currentGoal.startDate);
  const endDate = new Date(currentGoal.endDate);
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const completedDays = new Set(
    certifications
      .filter(cert => goalRoutineIds.includes(cert.routineId))
      .map(cert => cert.date)
  ).size;

  const successRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const streak = calculateStreak(currentGoal.id);

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-12 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">
          기록
        </h1>

        {/* Current Goal Stats */}
        <div className="mb-8 px-6 py-6 bg-gradient-to-br from-neutral-900 to-neutral-700 text-white rounded-3xl">
          <p className="text-neutral-300 text-sm mb-2">현재 목표</p>
          <h2 className="text-2xl font-bold mb-6">{currentGoal.name}</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-neutral-400 text-sm mb-1">완료율</p>
              <p className="text-2xl font-bold">{successRate}%</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm mb-1">연속</p>
              <p className="text-2xl font-bold">{streak}일</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm mb-1">달성</p>
              <p className="text-2xl font-bold">{completedDays}일</p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-8 px-6 py-6 bg-white rounded-3xl border-2 border-neutral-200">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>

            <h3 className="text-lg font-bold text-neutral-900">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </h3>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {days.map((day) => (
              <div key={day} className="text-center">
                <span className="text-neutral-500 text-sm font-medium">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isCompleted = certifiedDates.has(day);
              const isToday =
                day === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all font-medium ${
                    isCompleted
                      ? 'bg-neutral-900 text-white'
                      : isToday
                      ? 'border-2 border-neutral-900 text-neutral-900'
                      : 'text-neutral-400'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Past Records */}
        {records.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              지난 기록
            </h2>

            <div className="space-y-3">
              {records.map((record) => (
                <button
                  key={record.id}
                  onClick={() => onViewRecord(record)}
                  className="w-full px-6 py-5 bg-white rounded-3xl border-2 border-neutral-200 text-left hover:border-neutral-900 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-neutral-900">{record.goalName}</h3>
                    <span className="text-lg font-bold text-neutral-900">{record.successRate}%</span>
                  </div>
                  <p className="text-neutral-500 text-sm">
                    {new Date(record.startDate).toLocaleDateString('ko-KR')} - {new Date(record.endDate).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-neutral-600 text-sm mt-1">
                    {record.completedDays}/{record.totalDays}일 달성
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
