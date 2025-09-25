export type Mood = "Happy" | "Neutral" | "Sad" | "Energetic" | "Tired";

export type FoodItem = {
  id: string;
  name: string;
  lastAddedAt: Date;
};

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  foods: FoodItem[];
  mood: Mood | null;
  id?: string;
};
