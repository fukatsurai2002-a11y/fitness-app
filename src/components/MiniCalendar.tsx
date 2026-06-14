"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedDate: string;
  datesWithData: string[];
  onSelect: (date: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function MiniCalendar({ selectedDate, datesWithData, onSelect }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [viewYear, setViewYear] = useState(() => Number(selectedDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(selectedDate.slice(5, 7)) - 1);

  const withData = new Set(datesWithData);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 select-none">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {viewYear}年 {viewMonth + 1}月
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[11px] font-medium py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array(firstDow)
          .fill(null)
          .map((_, i) => (
            <div key={`e${i}`} />
          ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasData = withData.has(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelect(dateStr)}
              className={`
                relative flex flex-col items-center justify-center h-9 w-full rounded-xl text-sm transition-all duration-150
                ${
                  isSelected
                    ? "bg-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.5)]"
                    : isToday
                    ? "text-orange-300 font-semibold ring-1 ring-orange-500/50 hover:bg-orange-500/10"
                    : "text-gray-300 hover:bg-gray-800"
                }
              `}
            >
              {day}
              {hasData && (
                <span
                  className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected ? "bg-white/80" : "bg-violet-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
          記録あり
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-5 h-4 rounded-md ring-1 ring-orange-500/50 inline-flex items-center justify-center text-orange-300 text-[10px]">
            今
          </span>
          今日
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-5 h-4 rounded-md bg-orange-500 inline-flex items-center justify-center text-white text-[10px] font-bold">
            選
          </span>
          選択中
        </div>
      </div>
    </div>
  );
}
