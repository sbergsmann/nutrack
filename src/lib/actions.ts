
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFoodItem, getUser, updateUserPlan } from "@/lib/data";
import { headers } from "next/headers";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import type { UserProfile } from "./types";
import { getURL } from "./utils";
import { enrichFood } from "@/ai/flows/enrich-food-flow";

let firestore: Firestore;

if (!getApps().length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            initializeApp({
                credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
            });
            firestore = getFirestore();
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK is not initialized.");
        }
    } catch (e) {
        console.error("Firebase admin initialization error", e);
    }
} else {
    firestore = getFirestore();
}
