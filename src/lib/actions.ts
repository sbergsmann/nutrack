"use server";

import { revalidatePath } from "next/cache";
import { addFood, setMood } from "./data";
import type { Mood } from "./types";
import { z } from "zod";

const FoodSchema = z.object({
  food: z.string().min(1, "Food item cannot be empty.").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type FormState = {
  errors?: {
    food?: string[];
  };
};

export async function logFood(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = FoodSchema.safeParse({
    food: formData.get("food"),
    date: formData.get("date"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  await addFood(validatedFields.data.date, validatedFields.data.food);
  revalidatePath("/");
  revalidatePath(`/day/${validatedFields.data.date}`);
  return {};
}

const MoodSchema = z.object({
  mood: z.enum(["Happy", "Neutral", "Sad", "Energetic", "Tired"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function selectMood(formData: FormData) {
  const validatedFields = MoodSchema.safeParse({
    mood: formData.get("mood"),
    date: formData.get("date"),
  });

  if (!validatedFields.success) {
    console.error("Invalid mood data:", validatedFields.error.flatten().fieldErrors);
    return;
  }

  await setMood(validatedFields.data.date, validatedFields.data.mood);
  revalidatePath("/");
  revalidatePath(`/day/${validatedFields.data.date}`);
}
