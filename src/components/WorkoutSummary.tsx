"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WorkoutEntry } from "@/types";
import { Activity, Trash2 } from "lucide-react";

type Props = {
  workouts: WorkoutEntry[];
  date: string;
  onDelete: (id: string) => void;
};

export default function WorkoutSummary({ workouts, date, onDelete }: Props) {
  const volumeByExercise = useMemo(
    () =>
      workouts.map((w) => ({
        name: w.exercise.length > 8 ? w.exercise.slice(0, 7) + "…" : w.exercise,
        fullName: w.exercise,
        volume: w.sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
        sets: w.sets.length,
        maxWeight: Math.max(...w.sets.map((s) => s.weight)),
      })),
    [workouts]
  );

  const totalVolume = volumeByExercise.reduce((s, e) => s + e.volume, 0);
  const totalSets = volumeByExercise.reduce((s, e) => s + e.sets, 0);

  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-orange-400" />
          トレーニングサマリー
        </CardTitle>
        <p className="text-xs text-gray-500">{date}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">{workouts.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">種目数</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">{totalSets}</p>
            <p className="text-xs text-gray-400 mt-0.5">総セット数</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {(totalVolume / 1000).toFixed(1)}t
            </p>
            <p className="text-xs text-gray-400 mt-0.5">総ボリューム</p>
          </div>
        </div>

        {/* Bar chart */}
        {volumeByExercise.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">種目別ボリューム（kg×回数）</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByExercise} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#e5e7eb", fontWeight: "bold" }}
                    formatter={(v, _, props: { payload?: { fullName?: string } }) => [
                      `${v} kg`,
                      props.payload?.fullName || "ボリューム",
                    ]}
                  />
                  <Bar dataKey="volume" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Workout list */}
        {workouts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">記録一覧</p>
            {workouts.map((w) => (
              <div key={w.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{w.exercise}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                      {w.sets.length}セット
                    </Badge>
                    <button
                      onClick={() => {
                        if (window.confirm("このトレーニング記録を削除してもよろしいですか？")) {
                          onDelete(w.id);
                        }
                      }}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.sets.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-0.5"
                    >
                      {s.weight}kg × {s.reps}回
                    </span>
                  ))}
                </div>
                {w.note && (
                  <p className="text-xs text-gray-500 mt-1.5 italic">{w.note}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 text-sm py-4">
            まだトレーニングが記録されていません
          </p>
        )}
      </CardContent>
    </Card>
  );
}
