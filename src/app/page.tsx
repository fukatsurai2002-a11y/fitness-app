"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkoutForm from "@/components/WorkoutForm";
import NutritionForm from "@/components/NutritionForm";
import NutritionSummary from "@/components/NutritionSummary";
import WorkoutSummary from "@/components/WorkoutSummary";
import AITrainerCard from "@/components/AITrainerCard";
import GoalOptimizeModal from "@/components/GoalOptimizeModal";
import MiniCalendar from "@/components/MiniCalendar";
import { useDailyData } from "@/hooks/useDailyData";
import { DailyGoals } from "@/types";
import { supabase } from "@/lib/supabase";
import { Dumbbell, Sparkles, CalendarDays, ChevronUp, ChevronDown, RotateCcw, Loader2 } from "lucide-react";

const TODAY = new Date().toISOString().split("T")[0];

function formatDateJP(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${year}年${month}月${day}日（${weekdays[d.getDay()]}）`;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("target_settings")
        .select("calories, protein, carbs, fat")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setDailyGoals(data as DailyGoals);
    })();
  }, []);

  const { dayData, isLoading, addWorkout, addNutrition, deleteMeal, deleteWorkout, datesWithData } = useDailyData(selectedDate);
  const isToday = selectedDate === TODAY;

  const openGoalModal = () => setIsGoalModalOpen(true);
  const closeGoalModal = () => setIsGoalModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FitTracker</h1>
              <p className="text-xs text-gray-400">筋トレ & 栄養管理ダッシュボード</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Calendar toggle */}
            <button
              onClick={() => setIsCalendarOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isCalendarOpen
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/50"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">履歴</span>
              {isCalendarOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* AI Goal button */}
            <button
              onClick={openGoalModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-[0_0_16px_rgba(249,115,22,0.3)] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)]"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">
                {dailyGoals ? "AI目標を更新" : "AI目標を設定"}
              </span>
              <span className="sm:hidden">AI目標</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {/* Calendar panel */}
        {isCalendarOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-200">
            <MiniCalendar
              selectedDate={selectedDate}
              datesWithData={datesWithData}
              onSelect={(d) => {
                setSelectedDate(d);
                setIsCalendarOpen(false);
              }}
            />
            <div className="hidden lg:block rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-300">履歴の振り返り</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  日付をクリックするとその日のデータが表示されます
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  紫のドットは記録のある日を示します
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  オレンジ枠が今日、オレンジ塗りが選択中の日付です
                </li>
              </ul>
              {datesWithData.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1.5">記録のある日 ({datesWithData.length}日)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {datesWithData.slice().sort().reverse().slice(0, 8).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDate(d);
                          setIsCalendarOpen(false);
                        }}
                        className="text-[11px] bg-gray-800 hover:bg-violet-900/30 border border-gray-700 hover:border-violet-500/50 text-gray-400 hover:text-violet-300 rounded-lg px-2 py-1 transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date banner */}
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-2.5 border transition-colors ${
            isToday
              ? "bg-orange-950/20 border-orange-500/30"
              : "bg-violet-950/20 border-violet-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-gray-500" />
            ) : (
              <CalendarDays
                className={`w-4 h-4 shrink-0 ${isToday ? "text-orange-400" : "text-violet-400"}`}
              />
            )}
            <span
              className={`text-sm font-medium ${isToday ? "text-orange-300" : "text-violet-300"}`}
            >
              {formatDateJP(selectedDate)}の記録
            </span>
            {isToday && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                今日
              </span>
            )}
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(TODAY)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              今日に戻る
            </button>
          )}
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              ダッシュボード
            </TabsTrigger>
            <TabsTrigger
              value="workout"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              筋トレ記録
            </TabsTrigger>
            <TabsTrigger
              value="nutrition"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              栄養記録
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NutritionSummary
                  nutritionLogs={dayData.nutrition}
                  dailyGoals={dailyGoals}
                  date={selectedDate}
                  onOptimizeGoals={openGoalModal}
                  onDelete={(id) => deleteMeal(selectedDate, id)}
                />
                <WorkoutSummary
                  workouts={dayData.workouts}
                  date={selectedDate}
                  onDelete={(id) => deleteWorkout(selectedDate, id)}
                />
              </div>
              <AITrainerCard
                nutritionLogs={dayData.nutrition}
                dailyGoals={dailyGoals}
                date={selectedDate}
                onOptimizeGoals={openGoalModal}
              />
            </div>
          </TabsContent>

          <TabsContent value="workout">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkoutForm
                date={selectedDate}
                onAdd={(entry) => addWorkout(selectedDate, entry)}
              />
              <WorkoutSummary
                workouts={dayData.workouts}
                date={selectedDate}
                onDelete={(id) => deleteWorkout(selectedDate, id)}
              />
            </div>
          </TabsContent>

          <TabsContent value="nutrition">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NutritionForm
                date={selectedDate}
                onAdd={(entry) => addNutrition(selectedDate, entry)}
              />
              <NutritionSummary
                nutritionLogs={dayData.nutrition}
                dailyGoals={dailyGoals}
                date={selectedDate}
                onOptimizeGoals={openGoalModal}
                onDelete={(id) => deleteMeal(selectedDate, id)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {isGoalModalOpen && (
        <GoalOptimizeModal
          currentGoals={dailyGoals}
          onApply={setDailyGoals}
          onClose={closeGoalModal}
        />
      )}
    </div>
  );
}
