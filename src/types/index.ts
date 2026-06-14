export type WorkoutEntry = {
  id: string;
  date: string;
  exercise: string;
  sets: SetEntry[];
  note?: string;
};

export type SetEntry = {
  weight: number;
  reps: number;
};

export type NutritionEntry = {
  id: string;
  date: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailyGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailyData = {
  workouts: WorkoutEntry[];
  nutrition: NutritionEntry[];
};

export type UserProfile = {
  height: number;
  weight: number;
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "bulk" | "cut" | "maintain";
};
