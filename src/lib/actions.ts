
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addFood, removeFood, setMood } from "@/lib/data";
import { auth } from "@/firebase/client";
import { headers } from "next/headers";

const FoodSchema = z.object({
  food: z.string().min(1, "Food item cannot be empty."),
  date: z.string(),
});

const MoodSchema = z.object({
  mood: z.enum(["Happy", "Neutral", "Sad", "Energetic", "Tired"]),
  date: z.string(),
});

export async function logFood(prevState: any, formData: FormData) {
  const headersList = headers();
  const referer = headersList.get("referer");

  const validatedFields = FoodSchema.safeParse({
    food: formData.get("food"),
    date: formData.get("date"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  if (!auth.currentUser) {
    return {
      errors: {
        _form: ["You must be logged in to log food."],
      }
    }
  }

  await addFood(
    auth.currentUser.uid,
    validatedFields.data.date,
    validatedFields.data.food
  );

  if (referer) {
    revalidatePath(new URL(referer).pathname);
  } else {
    revalidatePath("/");
    revalidatePath(`/day/${validatedFields.data.date}`);
  }
  
  return {};
}

export async function selectMood(formData: FormData) {
  const validatedFields = MoodSchema.safeParse({
    mood: formData.get("mood"),
    date: formData.get("date"),
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return;
  }
  
  if (!auth.currentUser) {
    console.error("User not logged in");
    return;
  }

  await setMood(
    auth.currentUser.uid,
    validatedFields.data.date,
    validatedFields.data.mood
  );
  revalidatePath("/");
  revalidatePath(`/day/${validatedFields.data.date}`);
}

export async function deleteFood(formData: FormData) {
    const validatedFields = FoodSchema.safeParse({
        food: formData.get("food"),
        date: formData.get("date"),
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return;
    }

    if (!auth.currentUser) {
        console.error("User not logged in");
        return;
    }

    await removeFood(
      auth.currentUser.uid,
      validatedFields.data.date, 
      validatedFields.data.food
    );
    revalidatePath("/");
    revalidatePath(`/day/${validatedFields.data.date}`);
}
