import type { DailyEntry, Mood } from "@/lib/types";

// In a real application, this would be a database.
// For this example, we use a simple in-memory object.
const dailyData: Record<string, DailyEntry> = {
  "2024-07-28": {
    date: "2024-07-28",
    foods: ["Oatmeal with berries", "Grilled chicken salad", "Apple slices"],
    mood: "Energetic",
  },
  "2024-07-26": {
    date: "2024-07-26",
    foods: ["Scrambled eggs", "Tuna sandwich", "Steak and vegetables"],
    mood: "Happy",
  },
};

const getOrCreateEntry = (date: string): DailyEntry => {
  if (!dailyData[date]) {
    dailyData[date] = {
      date,
      foods: [],
      mood: null,
    };
  }
  return dailyData[date];
};

export async function getEntry(date: string): Promise<DailyEntry> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return Promise.resolve(getOrCreateEntry(date));
}

export async function getAllEntries(): Promise<DailyEntry[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return Promise.resolve(Object.values(dailyData));
}

export async function addFood(date: string, food: string): Promise<DailyEntry> {
  const entry = getOrCreateEntry(date);
  entry.foods.push(food);
  return Promise.resolve(entry);
}

export async function setMood(date: string, mood: Mood): Promise<DailyEntry> {
  const entry = getOrCreateEntry(date);
  entry.mood = mood;
  return Promise.resolve(entry);
}
