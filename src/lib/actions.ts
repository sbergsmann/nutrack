
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFoodItem, getUser, updateUserPlan } from "@/lib/data";
import { headers } from "next/headers";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import type { UserProfile } from "./types";
import { getURL } from "./utils";
import { enrichFood } from "@/ai/flows/enrich-food-flow";

if (!getApps().length) {
    try {
        initializeApp({
            credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
        });
    } catch (e) {
        console.error("Firebase admin initialization error", e);
    }
}

const firestore = getFirestore();

export async function enrichFoodInBackground(foodId: string, foodName: string) {
    try {
        const enrichedData = await enrichFood({ foodName });

        if (enrichedData) {
            await firestore.collection("foods").doc(foodId).update(enrichedData);
            console.log(`Enriched food: ${foodName} (${foodId})`);
        }
    } catch (error) {
        console.error(`Failed to enrich food: ${foodName} (${foodId})`, error);
    }
}
