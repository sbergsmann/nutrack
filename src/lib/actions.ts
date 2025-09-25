
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addFood, getUser, updateUserPlan } from "@/lib/data";
import { headers } from "next/headers";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import type { UserProfile } from "./types";
import { getURL } from "./utils";

if (!getApps().length) {
    try {
        initializeApp({
            credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
        });
    } catch (e) {
        console.error("Firebase admin initialization error", e);
    }
}
