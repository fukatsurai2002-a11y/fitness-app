"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WorkoutEntry, NutritionEntry, DailyData } from "@/types";
import { supabase } from "@/lib/supabase";

export function useDailyData(selectedDate: string) {
  const [cache, setCache] = useState<Record<string, DailyData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [datesWithData, setDatesWithData] = useState<string[]>([]);
  // Track which dates have already been fetched to avoid duplicate requests
  const fetched = useRef(new Set<string>());

  // On mount: fetch all dates that have any records (calendar dots)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: nDates }, { data: wDates }] = await Promise.all([
        supabase.from("meals").select("date"),
        supabase.from("workouts").select("date"),
      ]);
      if (cancelled) return;
      const all = new Set<string>([
        ...(nDates ?? []).map((r) => r.date as string),
        ...(wDates ?? []).map((r) => r.date as string),
      ]);
      setDatesWithData(Array.from(all));
    })();
    return () => { cancelled = true; };
  }, []);

  // When selectedDate changes: fetch that day's records (cached after first load)
  useEffect(() => {
    if (fetched.current.has(selectedDate)) return;
    fetched.current.add(selectedDate);
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [{ data: nutrition, error: nErr }, { data: workouts, error: wErr }] =
        await Promise.all([
          supabase
            .from("meals")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at"),
          supabase
            .from("workouts")
            .select("*")
            .eq("date", selectedDate)
            .order("created_at"),
        ]);
      if (cancelled) return;
      if (nErr) console.error("nutrition fetch error:", nErr);
      if (wErr) console.error("workout fetch error:", wErr);
      setCache((prev) => ({
        ...prev,
        [selectedDate]: {
          nutrition: ((nutrition ?? []) as NutritionEntry[]).map((r) => ({
            ...r,
            protein: Number(r.protein),
            carbs: Number(r.carbs),
            fat: Number(r.fat),
          })),
          workouts: (workouts ?? []) as WorkoutEntry[],
        },
      }));
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedDate]);

  const addWorkout = useCallback(async (date: string, entry: WorkoutEntry) => {
    const { data, error } = await supabase
      .from("workouts")
      .insert({ date, exercise: entry.exercise, sets: entry.sets, note: entry.note ?? null })
      .select()
      .single();
    if (error) { console.error("Failed to save workout:", error); return; }
    const saved: WorkoutEntry = {
      id: data.id,
      date,
      exercise: data.exercise,
      sets: data.sets,
      note: data.note ?? undefined,
    };
    setCache((prev) => ({
      ...prev,
      [date]: {
        workouts: [saved, ...(prev[date]?.workouts ?? [])],
        nutrition: prev[date]?.nutrition ?? [],
      },
    }));
    setDatesWithData((prev) => (prev.includes(date) ? prev : [...prev, date]));
  }, []);

  const addNutrition = useCallback(async (date: string, entry: NutritionEntry) => {
    const { data, error } = await supabase
      .from("meals")
      .insert({
        date,
        meal: entry.meal,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      })
      .select()
      .single();
    if (error) { console.error("Failed to save nutrition:", error); return; }
    const saved: NutritionEntry = {
      id: data.id,
      date,
      meal: data.meal,
      calories: data.calories,
      protein: Number(data.protein),
      carbs: Number(data.carbs),
      fat: Number(data.fat),
    };
    setCache((prev) => ({
      ...prev,
      [date]: {
        workouts: prev[date]?.workouts ?? [],
        nutrition: [saved, ...(prev[date]?.nutrition ?? [])],
      },
    }));
    setDatesWithData((prev) => (prev.includes(date) ? prev : [...prev, date]));
  }, []);

  const deleteMeal = useCallback(async (date: string, id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) { console.error("Failed to delete meal:", error); return; }
    setCache((prev) => {
      const updatedNutrition = (prev[date]?.nutrition ?? []).filter((n) => n.id !== id);
      const updatedWorkouts = prev[date]?.workouts ?? [];
      if (updatedNutrition.length === 0 && updatedWorkouts.length === 0) {
        setDatesWithData((d) => d.filter((x) => x !== date));
      }
      return { ...prev, [date]: { workouts: updatedWorkouts, nutrition: updatedNutrition } };
    });
  }, []);

  const deleteWorkout = useCallback(async (date: string, id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) { console.error("Failed to delete workout:", error); return; }
    setCache((prev) => {
      const updatedWorkouts = (prev[date]?.workouts ?? []).filter((w) => w.id !== id);
      const updatedNutrition = prev[date]?.nutrition ?? [];
      if (updatedWorkouts.length === 0 && updatedNutrition.length === 0) {
        setDatesWithData((d) => d.filter((x) => x !== date));
      }
      return { ...prev, [date]: { workouts: updatedWorkouts, nutrition: updatedNutrition } };
    });
  }, []);

  const dayData: DailyData = cache[selectedDate] ?? { workouts: [], nutrition: [] };

  return { dayData, isLoading, addWorkout, addNutrition, deleteMeal, deleteWorkout, datesWithData };
}
