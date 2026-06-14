"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyGoals } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  Target,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";

type OptimizeState = "idle" | "loading" | "success" | "error";

type ResultData = DailyGoals & { explanation: string };

type Props = {
  currentGoals: DailyGoals | null;
  onApply: (goals: DailyGoals) => void;
  onClose: () => void;
};

export default function GoalOptimizeModal({ currentGoals, onApply, onClose }: Props) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [goal, setGoal] = useState("maintain");

  const [state, setState] = useState<OptimizeState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);

  const canSubmit = height.trim() !== "" && weight.trim() !== "" && age.trim() !== "" && state !== "loading";

  const handleOptimize = async () => {
    if (!canSubmit) return;
    setState("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/optimize-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: Number(height),
          weight: Number(weight),
          age: Number(age),
          gender,
          activityLevel,
          goal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "計算に失敗しました");

      setResult(data as ResultData);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setState("error");
    }
  };

  const handleApply = async () => {
    if (!result) return;
    const goals: DailyGoals = { calories: result.calories, protein: result.protein, fat: result.fat, carbs: result.carbs };
    const { error } = await supabase.from("target_settings").insert(goals);
    if (error) console.error("Failed to save target_settings:", error);
    onApply(goals);
    onClose();
  };

  const macroItems = result
    ? [
        { label: "カロリー", value: `${result.calories} kcal`, color: "text-orange-400", Icon: Flame },
        { label: "タンパク質", value: `${result.protein}g`, color: "text-red-400", Icon: Beef },
        { label: "炭水化物", value: `${result.carbs}g`, color: "text-green-400", Icon: Wheat },
        { label: "脂質", value: `${result.fat}g`, color: "text-blue-400", Icon: Droplets },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <Card
        className="bg-gray-900 border-gray-700 text-white w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <CardHeader className="pb-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                <Target className="w-4 h-4 text-white" />
              </div>
              AI目標栄養素 最適化
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            あなたの身体データを入力すると、プロの視点から最適な目標PFCをAIが計算します
          </p>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {/* Form inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">身長 (cm)</Label>
              <Input
                type="number"
                min={100}
                max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">体重 (kg)</Label>
              <Input
                type="number"
                min={30}
                max={300}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">年齢</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">性別</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">日常の活動レベル</Label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="sedentary">座りがち（デスクワーク中心、ほとんど運動しない）</option>
              <option value="light">軽い活動（週1〜3回の軽い運動）</option>
              <option value="moderate">中程度の活動（週3〜5回の運動）</option>
              <option value="active">活発（週6〜7回の激しい運動）</option>
              <option value="very_active">非常に活発（1日2回以上のトレーニング）</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">現在の目的</Label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="bulk">バルクアップ・筋肥大</option>
              <option value="cut">減量・ダイエット</option>
              <option value="maintain">健康維持・現状維持</option>
            </select>
          </div>

          {/* Current goals hint */}
          {currentGoals && (
            <p className="text-[11px] text-gray-600">
              現在の目標: {currentGoals.calories} kcal / P {currentGoals.protein}g / C {currentGoals.carbs}g / F {currentGoals.fat}g
            </p>
          )}

          {/* Calculate button */}
          <button
            type="button"
            onClick={handleOptimize}
            disabled={!canSubmit}
            className={`
              w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold
              transition-all duration-200
              ${state === "loading"
                ? "bg-orange-700/50 text-orange-300 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-[0_0_16px_rgba(249,115,22,0.3)] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              }
            `}
          >
            {state === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Geminiが計算中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AIで最適な目標を計算する
              </>
            )}
          </button>

          {/* Error */}
          {state === "error" && error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-700/40 px-3 py-2.5 text-xs text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
              {error}
            </div>
          )}

          {/* Result */}
          {state === "success" && result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">最適な目標を計算しました！</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {macroItems.map(({ label, value, color, Icon }) => (
                  <div key={label} className="bg-gray-800/60 rounded-lg p-3 flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                    <div>
                      <p className="text-[10px] text-gray-500">{label}</p>
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
                <p className="text-[10px] text-gray-500 mb-1.5">設定理由・解説</p>
                <p className="text-xs text-gray-300 leading-relaxed">{result.explanation}</p>
              </div>

              <Button
                onClick={handleApply}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                この目標を適用する
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
