"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NutritionEntry } from "@/types";
import { Utensils, Sparkles, Loader2, CheckCircle2, AlertTriangle, Wand2 } from "lucide-react";

const MEALS = ["朝食", "昼食", "夕食", "間食", "プロテインシェイク"];

type AnalyzeState = "idle" | "loading" | "success" | "error";

type Props = {
  date: string;
  onAdd: (entry: NutritionEntry) => void;
};

export default function NutritionForm({ date, onAdd }: Props) {
  // AI analysis state
  const [mealText, setMealText] = useState("");
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>("idle");
  const [analyzeError, setAnalyzeError] = useState("");

  // Form fields
  const [meal, setMeal] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleAnalyze = async () => {
    if (!mealText.trim() || analyzeState === "loading") return;

    setAnalyzeState("loading");
    setAnalyzeError("");

    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "解析に失敗しました");
      }

      setCalories(String(Math.round(data.calories)));
      setProtein(String(Math.round(data.protein)));
      setCarbs(String(Math.round(data.carbohydrates)));
      setFat(String(Math.round(data.fat)));
      setAnalyzeState("success");

      // 3秒後にsuccessバッジをリセット
      setTimeout(() => setAnalyzeState("idle"), 3000);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "エラーが発生しました");
      setAnalyzeState("error");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meal || !calories) return;
    onAdd({
      id: `n${Date.now()}`,
      date,
      meal,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    setMeal("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setMealText("");
    setAnalyzeState("idle");
    setAnalyzeError("");
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="w-5 h-5 text-green-400" />
          食事を記録する
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── AI Analysis Section ─────────────────────────────── */}
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-indigo-950/40 p-3.5 space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-violet-200">AI栄養自動解析</span>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-full">
                Gemini
              </span>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">食事内容をテキストで入力</Label>
              <textarea
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze();
                }}
                placeholder={"例：牛丼大盛り、みそ汁、生卵\n　　ビッグマックセット Mサイズ"}
                rows={3}
                className="w-full rounded-lg border border-violet-700/40 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none leading-relaxed"
              />
              <p className="text-[10px] text-gray-600">Ctrl+Enter でも解析できます</p>
            </div>

            {/* Analyze button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!mealText.trim() || analyzeState === "loading"}
              className={`
                w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold
                transition-all duration-200
                ${analyzeState === "loading"
                  ? "bg-violet-700/50 text-violet-300 cursor-not-allowed"
                  : analyzeState === "success"
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                }
              `}
            >
              {analyzeState === "loading" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Geminiが解析中...
                </>
              )}
              {analyzeState === "success" && (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  解析完了！フォームに反映しました
                </>
              )}
              {(analyzeState === "idle" || analyzeState === "error") && (
                <>
                  <Wand2 className="w-4 h-4" />
                  PFCを自動計算する
                </>
              )}
            </button>

            {/* Error message */}
            {analyzeState === "error" && analyzeError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-700/40 px-3 py-2 text-xs text-red-300">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
                {analyzeError}
              </div>
            )}
          </div>

          {/* ── Divider ─────────────────────────────────────────── */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-gray-800" />
            <span className="text-xs text-gray-600 shrink-0">または手動で入力</span>
            <div className="flex-1 border-t border-gray-800" />
          </div>

          {/* ── Manual fields ────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">食事の種類</Label>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">選択してください</option>
              {MEALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">カロリー (kcal)</Label>
            <Input
              type="number"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="500"
              required
              className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-green-500 transition-colors ${
                analyzeState === "success" ? "border-emerald-600/60 bg-emerald-950/20" : ""
              }`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "タンパク質 (g)", value: protein, setter: setProtein, placeholder: "30" },
              { label: "炭水化物 (g)", value: carbs, setter: setCarbs, placeholder: "60" },
              { label: "脂質 (g)", value: fat, setter: setFat, placeholder: "15" },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <Label className="text-gray-300 text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 text-sm h-8 focus:ring-green-500 transition-colors ${
                    analyzeState === "success" ? "border-emerald-600/60 bg-emerald-950/20" : ""
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">プレビュー</p>
            <div className="flex justify-between">
              <span>カロリー</span>
              <span className="text-white">{calories || 0} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>P / C / F</span>
              <span className="text-white">
                {protein || 0}g / {carbs || 0}g / {fat || 0}g
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            記録する
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
