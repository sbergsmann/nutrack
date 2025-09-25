
import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { addFood } from "@/lib/data";
import { z } from "zod";

if (!getApps().length) {
  initializeApp();
}

const FoodSchema = z.object({
  food: z.string().min(1, "Food item cannot be empty."),
  date: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const validatedFields = FoodSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const firestore = getFirestore();
    await addFood(
      firestore,
      userId,
      validatedFields.data.date,
      validatedFields.data.food
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in log-food API:", error);
    let errorMessage = "An unexpected error occurred.";
    let status = 500;
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      errorMessage = "Authentication token is invalid or has expired.";
      status = 401;
    }
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
