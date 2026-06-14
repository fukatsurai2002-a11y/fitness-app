"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NutritionEntry, DailyGoals } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  Bot,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Target,
  WifiOff,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type AdviceKind = "warning" | "success" | "info" | "tip";

type Advice = {
  id: string;
  kind: AdviceKind;
  title: string;
  text: string;
};

// ─── Style maps ────────────────────────────────────────────────────────────

const KIND_STYLES: Record<AdviceKind, { border: string; bg: string; icon: string; badge: string; label: string }> = {
  warning: {
    border: "border-l-amber-400",
    bg: "bg-amber-400/5",
    icon: "text-amber-400",
    badge: "bg-amber-400/15 text-amber-300",
    label: "注意",
  },
  success: {
    border: "border-l-emerald-400",
    bg: "bg-emerald-400/5",
    icon: "text-emerald-400",
    badge: "bg-emerald-400/15 text-emerald-300",
    label: "グッド",
  },
  info: {
    border: "border-l-blue-400",
    bg: "bg-blue-400/5",
    icon: "text-blue-400",
    badge: "bg-blue-400/15 text-blue-300",
    label: "情報",
  },
  tip: {
    border: "border-l-violet-400",
    bg: "bg-violet-400/5",
    icon: "text-violet-400",
    badge: "bg-violet-400/15 text-violet-300",
    label: "ヒント",
  },
};

const KIND_ICON: Record<AdviceKind, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  tip: Lightbulb,
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="py-8 flex flex-col items-center gap-5">
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
      </div>

      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-400"
            style={{ animation: `dot-bounce 1.2s ease-in-out ${i * 0.18}s infinite` }}
          />
        ))}
      </div>

      <p className="text-sm text-gray-400">AIトレーナーが分析中です...</p>

      <div className="w-full space-y-2.5 px-1">
        {[90, 70, 80].map((w, i) => (
          <div
            key={i}
            className="h-11 rounded-lg bg-gray-800"
            style={{
              width: `${w}%`,
              backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.08) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 1.8s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AdviceItem({ advice, index, visible }: { advice: Advice; index: number; visible: boolean }) {
  const styles = KIND_STYLES[advice.kind];
  const Icon = KIND_ICON[advice.kind];

  return (
    <div
      className={`border-l-[3px] ${styles.border} ${styles.bg} rounded-r-xl px-3.5 py-3`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        transitionDelay: `${index * 90}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white leading-tight">{advice.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${styles.badge}`}>
              {styles.label}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{advice.text}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

type Props = {
  nutritionLogs: NutritionEntry[];
  dailyGoals: DailyGoals | null;
  date: string;
  onOptimizeGoals: () => void;
};

const TODAY_STR = new Date().toISOString().split("T")[0];
const VALID_KINDS = new Set<AdviceKind>(["success", "warning", "info", "tip"]);

function toAdvice(a: { kind: string; title: string; text: string }, i: number): Advice {
  return {
    id: `advice-${i}`,
    kind: VALID_KINDS.has(a.kind as AdviceKind) ? (a.kind as AdviceKind) : "info",
    title: a.title,
    text: a.text,
  };
}

export default function AITrainerCard({ nutritionLogs, dailyGoals, date, onOptimizeGoals }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [visible, setVisible] = useState(false);
  const [apiError, setApiError] = useState("");

  const show = useCallback((items: Advice[]) => {
    setAdvices(items);
    setIsLoading(false);
    setTimeout(() => setVisible(true), 30);
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setVisible(false);
    setApiError("");

    // 1. Try to load saved advice from Supabase for this date
    const { data: saved } = await supabase
      .from("trainer_advices")
      .select("advices")
      .eq("date", date)
      .maybeSingle();

    if (saved && saved.advices && saved.advices.length > 0) {
      show((saved.advices as Array<{ kind: string; title: string; text: string }>).map(toAdvice));
      return;
    }

    // 2. No saved advice — show placeholder or generate
    if (!dailyGoals) {
      show([{ id: "no-goals", kind: "info", title: "まず目標を設定しましょう",
        text: "AI目標最適化機能で目標カロリー・PFCを設定すると、パーソナライズされたアドバイスをお届けできます！" }]);
      return;
    }

    if (nutritionLogs.length === 0) {
      const isPast = date !== TODAY_STR;
      show([{ id: "no-data", kind: "info",
        title: isPast ? "この日のアドバイスはありません" : "まず記録を始めましょう",
        text: isPast
          ? "この日は食事記録がなかったため、AIアドバイスは生成されませんでした。"
          : "食事を記録すると、AIトレーナーがデータを分析して具体的なアドバイスをお届けします！",
      }]);
      return;
    }

    // 3. Generate via API
    const totals = nutritionLogs.reduce(
      (acc, n) => ({
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fat: acc.fat + n.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    try {
      const res = await fetch("/api/trainer-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totals, goals: dailyGoals }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "アドバイスの取得に失敗しました");

      const mapped = (json.advices as Array<{ kind: string; title: string; text: string }>).map(toAdvice);

      // 4. Persist advice to Supabase
      await supabase
        .from("trainer_advices")
        .upsert({ date, advices: mapped }, { onConflict: "date" });

      show(mapped);
      setApiError("");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "エラーが発生しました");
      setAdvices([]);
      setIsLoading(false);
    }
  }, [nutritionLogs, dailyGoals, date, show]);

  useEffect(() => {
    runAnalysis();
  // Re-run when goals or selected date changes; user manually re-analyzes for same-day nutrition updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyGoals, date]);

  return (
    <div
      className="rounded-2xl p-[1px] shadow-[0_0_35px_rgba(139,92,246,0.25)]"
      style={{
        background: "linear-gradient(135deg, #7c3aed, #4f46e5, #7c3aed)",
        backgroundSize: "200% 200%",
        animation: "shimmer 4s ease infinite",
      }}
    >
      <Card className="bg-gray-900 border-0 rounded-[14px] text-white overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-3 border-b border-gray-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-pulse" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.6)]">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight">AIトレーナーからのアドバイス</span>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isLoading
                    ? "データを分析中..."
                    : apiError
                    ? "アドバイスの取得に失敗しました"
                    : `${advices.length}件のアドバイスを生成しました`}
                </p>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg hover:bg-violet-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              再分析
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-5">
          {isLoading ? (
            <ThinkingDots />
          ) : apiError ? (
            <div className="py-4 space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-300">
                <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium mb-0.5">アドバイスの取得に失敗しました</p>
                  <p className="text-xs text-red-400/80">{apiError}</p>
                </div>
              </div>
              <button
                onClick={runAnalysis}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-violet-300 hover:bg-violet-500/10 transition-colors border border-violet-500/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                再試行する
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {advices.map((advice, i) => (
                <AdviceItem key={advice.id} advice={advice} index={i} visible={visible} />
              ))}

              {/* CTA when goals not set */}
              {advices.length === 1 && advices[0].id === "no-goals" && (
                <button
                  onClick={onOptimizeGoals}
                  className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-xl text-sm font-semibold text-orange-300 border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  AI目標最適化を開く
                </button>
              )}

              <p className="text-[10px] text-gray-600 text-right pt-1">
                ※ Gemini AIが生成したアドバイスです。医療・診断の代替ではありません
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
