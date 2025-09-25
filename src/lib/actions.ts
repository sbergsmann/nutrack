
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addFood } from "@/lib/data";
import { headers } from "next/headers";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";

// This is a temporary solution to get the user from a server action.
// In a real app, you would have a more robust session management system.
export async function getUserIdFromSession(): Promise<string | null> {
    try {
        if (!getApps().length) {
            initializeApp();
        }
        const authHeader = (await headers()).get('Authorization');
        if (authHeader) {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await getAuth().verifyIdToken(idToken);
            return decodedToken.uid;
        }
        return null;
    } catch (error) {
        // This will happen if the user is not logged in.
        // We can ignore this error and let the action handle the null userId.
        if ((error as any).code === 'auth/id-token-expired' || (error as any).code === 'auth/argument-error') {
             return null;
        }
        console.error("Error verifying token:", error);
        return null;
    }
}

const FoodSchema = z.object({
  food: z.string().min(1, "Food item cannot be empty."),
  date: z.string(),
});

export async function logFood(
  prevState: any,
  formData: FormData
): Promise<{ message: string }> {
  const validatedFields = FoodSchema.safeParse({
    food: formData.get("food"),
    date: formData.get("date"),
  });

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
    };
  }

  const userId = await getUserIdFromSession();
  if (!userId) {
    return {
      message: "You must be logged in to log food.",
    };
  }

  try {
    if (!getApps().length) {
      initializeApp();
    }
    const firestore = getFirestore();
    await addFood(
      firestore,
      userId,
      validatedFields.data.date,
      validatedFields.data.food
    );
    revalidatePath("/");
    revalidatePath(`/day/${validatedFields.data.date}`);
    return { message: "Food logged successfully." };
  } catch (e) {
    return { message: "Failed to log food." };
  }
}
