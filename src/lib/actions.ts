
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addFood, removeFood, setMood } from "@/lib/data";
import { headers } from "next/headers";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";

// This is a temporary solution to get the user from a server action.
// In a real app, you would have a more robust session management system.
async function getUserIdFromSession(): Promise<string | null> {
    try {
        if (!getApps().length) {
            initializeApp();
        }
        const authHeader = headers().get('Authorization');
        if (authHeader) {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await getAuth().verifyIdToken(idToken);
            return decodedToken.uid;
        }
        return null;
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}


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
  
  const userId = await getUserIdFromSession();
  if (!userId) {
    return {
      errors: {
        _form: ["You must be logged in to log food."],
      }
    }
  }

  // We are in a server component, so we can use the admin SDK
  const firestore = getFirestore();
  await addFood(
    firestore,
    userId,
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
  
  const userId = await getUserIdFromSession();
  if (!userId) {
    console.error("User not logged in");
    return;
  }
  
  const firestore = getFirestore();
  await setMood(
    firestore,
    userId,
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

    const userId = await getUserIdFromSession();
    if (!userId) {
        console.error("User not logged in");
        return;
    }
    
    const firestore = getFirestore();
    await removeFood(
      firestore,
      userId,
      validatedFields.data.date, 
      validatedFields.data.food
    );
    revalidatePath("/");
    revalidatePath(`/day/${validatedFields.data.date}`);
}
