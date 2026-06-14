"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WorkoutEntry, SetEntry } from "@/types";
import { Plus, Trash2, Dumbbell, ChevronDown } from "lucide-react";

const EXERCISES = [
  "ベンチプレス", "スクワット", "デッドリフト", "ショルダープレス",
  "ラットプルダウン", "ダンベルカール", "トライセプスプッシュダウン",
  "レッグプレス", "チェストフライ", "バーベルロウ",
];

type Props = {
  date: string;
  onAdd: (entry: WorkoutEntry) => void;
};

export default function WorkoutForm({ date, onAdd }: Props) {
  const [exerciseName, setExerciseName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sets, setSets] = useState<SetEntry[]>([{ weight: 0, reps: 0 }]);
  const [note, setNote] = useState("");
  const comboboxRef = useRef<HTMLDivElement>(null);

  const suggestions = exerciseName
    ? EXERCISES.filter((ex) => ex.includes(exerciseName))
    : EXERCISES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSet = () => setSets((prev) => [...prev, { weight: 0, reps: 0 }]);

  const removeSet = (index: number) => {
    setSets((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: keyof SetEntry, value: string) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: Number(value) } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim() || sets.every((s) => s.reps === 0)) return;
    onAdd({
      id: `w${Date.now()}`,
      date,
      exercise: exerciseName.trim(),
      sets,
      note,
    });
    setExerciseName("");
    setSets([{ weight: 0, reps: 0 }]);
    setNote("");
  };

  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="w-5 h-5 text-orange-400" />
          筋トレを記録する
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">種目</Label>
            <div ref={comboboxRef} className="relative">
              <Input
                value={exerciseName}
                onChange={(e) => {
                  setExerciseName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="種目を選択または入力"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-orange-500 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSuggestions((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                tabIndex={-1}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showSuggestions ? "rotate-180" : ""}`} />
              </button>
              {showSuggestions && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-700 bg-gray-800 shadow-lg max-h-52 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map((ex) => (
                      <li
                        key={ex}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setExerciseName(ex);
                          setShowSuggestions(false);
                        }}
                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-700 ${
                          exerciseName === ex ? "text-orange-400" : "text-white"
                        }`}
                      >
                        {ex}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      「{exerciseName}」として登録されます
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm">セット</Label>
              <button
                type="button"
                onClick={addSet}
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
              >
                <Plus className="w-3 h-3" />
                セット追加
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
              <span className="col-span-1">#</span>
              <span className="col-span-5">重量 (kg)</span>
              <span className="col-span-5">回数</span>
              <span className="col-span-1" />
            </div>

            {sets.map((set, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-sm text-gray-500 text-center">{i + 1}</span>
                <Input
                  type="number"
                  min={0}
                  value={set.weight || ""}
                  onChange={(e) => updateSet(i, "weight", e.target.value)}
                  placeholder="80"
                  className="col-span-5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-8 text-sm focus:ring-orange-500"
                />
                <Input
                  type="number"
                  min={0}
                  value={set.reps || ""}
                  onChange={(e) => updateSet(i, "reps", e.target.value)}
                  placeholder="10"
                  className="col-span-5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 h-8 text-sm focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => removeSet(i)}
                  disabled={sets.length === 1}
                  className="col-span-1 flex justify-center text-gray-600 hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">メモ（任意）</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：フォームを意識した"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-orange-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            記録する
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
