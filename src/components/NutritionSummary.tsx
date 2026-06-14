"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { NutritionEntry, DailyGoals } from "@/types";
import { TrendingUp, Sparkles, Trash2 } from "lucide-react";

type Props = {
  nutritionLogs: NutritionEntry[];
  dailyGoals: DailyGoals | null;
  date: string;
  onOptimizeGoals: () => void;
  onDelete: (id: string) => void;
};

export default function NutritionSummary({ nutritionLogs, dailyGoals, date, onOptimizeGoals, onDelete }: Props) {
  const totals = useMemo(
    () =>
      nutritionLogs.reduce(
        (acc, n) => ({
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs,
          fat: acc.fat + n.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [nutritionLogs]
  );

  const pieData = [
    { name: "タンパク質", value: totals.protein * 4, color: "#f97316" },
    { name: "炭水化物", value: totals.carbs * 4, color: "#22c55e" },
    { name: "脂質", value: totals.fat * 9, color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  const caloriePct = dailyGoals && dailyGoals.calories > 0
    ? Math.min(100, Math.round((totals.calories / dailyGoals.calories) * 100))
    : 0;

  const macroData = dailyGoals
    ? [
        { name: "タンパク質", value: totals.protein, goal: dailyGoals.protein, color: "#f97316", unit: "g" },
        { name: "炭水化物", value: totals.carbs, goal: dailyGoals.carbs, color: "#22c55e", unit: "g" },
        { name: "脂質", value: totals.fat, goal: dailyGoals.fat, color: "#3b82f6", unit: "g" },
      ]
    : [];

  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
              栄養摂取サマリー
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">{date}</p>
          </div>
          <button
            onClick={onOptimizeGoals}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {dailyGoals ? "目標を更新" : "目標を設定"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* No goals state */}
        {!dailyGoals ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-5 text-center space-y-3">
            <p className="text-sm text-gray-400">目標カロリー・PFCが設定されていません</p>
            <p className="text-xs text-gray-600">AIに身体データを入力すると、最適な目標を自動計算します</p>
            <button
              onClick={onOptimizeGoals}
              className="inline-flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-[0_0_12px_rgba(249,115,22,0.3)]"
            >
              <Sparkles className="w-4 h-4" />
              AIで目標を設定する
            </button>
          </div>
        ) : (
          <>
            {/* Calorie progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">カロリー</span>
                <span className="font-semibold">
                  <span className={totals.calories > dailyGoals.calories ? "text-red-400" : "text-white"}>
                    {totals.calories}
                  </span>
                  <span className="text-gray-500"> / {dailyGoals.calories} kcal</span>
                </span>
              </div>
              <Progress value={caloriePct} className="h-3 bg-gray-700 [&>div]:bg-orange-500" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>残り: {Math.max(0, dailyGoals.calories - totals.calories)} kcal</span>
                <span>{caloriePct}%</span>
              </div>
            </div>

            {/* PFC progress bars */}
            <div className="space-y-3">
              {macroData.map((m) => {
                const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                const over = m.value > m.goal;
                return (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{m.name}</span>
                      <span>
                        <span className={over ? "text-red-400 font-medium" : "text-white"}>
                          {m.value}{m.unit}
                        </span>
                        <span className="text-gray-500"> / {m.goal}{m.unit}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : m.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PFC pie chart (shown regardless of goals if there's data) */}
        {pieData.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">PFCバランス（カロリー換算）</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                    labelStyle={{ color: "#9ca3af" }}
                    formatter={(v) => [`${v} kcal`]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Meal list */}
        {nutritionLogs.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">食事ログ</p>
            <div className="space-y-1.5">
              {nutritionLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-xs"
                >
                  <span className="text-gray-300">{log.meal}</span>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="text-white font-medium">{log.calories} kcal</span>
                    <span>P:{log.protein}g</span>
                    <span>C:{log.carbs}g</span>
                    <span>F:{log.fat}g</span>
                    <button
                      onClick={() => {
                        if (window.confirm("この食事記録を削除してもよろしいですか？")) {
                          onDelete(log.id);
                        }
                      }}
                      className="text-gray-600 hover:text-red-400 transition-colors ml-1 shrink-0"
                      aria-label="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nutritionLogs.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-4">
            まだ食事が記録されていません
          </p>
        )}
      </CardContent>
    </Card>
  );
}
