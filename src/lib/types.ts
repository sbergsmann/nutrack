export type Mood = "Happy" | "Neutral" | "Sad" | "Energetic" | "Tired";

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  foods: string[];
  mood: Mood | null;
  id?: string;
};
