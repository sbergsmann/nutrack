
export type Mood = "Happy" | "Neutral" | "Sad" | "Energetic" | "Tired";

export type FoodItem = {
  id: string;
  name: string;
  lastAddedAt: Date;
  description?: string;
  portion?: number;
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
  icon?: string;
};

export type LoggedFood = {
  food: FoodItem;
  quantity: number;
};

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  foods: LoggedFood[];
  mood: Mood | null;
  id?: string;
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: 'Basic' | 'Monthly' | 'Yearly';
};
