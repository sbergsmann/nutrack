
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
let adminAuth;

if (!getApps().length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
            firestore = getFirestore();
            adminAuth = getAuth();
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK is not initialized.");
        }
    } catch (e) {
        console.error("Firebase admin initialization error", e);
    }
} else {
    firestore = getFirestore();
    adminAuth = getAuth();
}


async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = firestore.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve(true);
        return;
    }

    // Delete documents in a batch
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}


export async function deleteUserAccount(userId: string) {
    if (!adminAuth || !firestore) {
        throw new Error("Firebase Admin SDK not initialized.");
    }
    try {
        // Delete Firestore data
        await deleteCollection(`users/${userId}/dailyLogs`, 50);

        // You can add more collection deletions here if needed, e.g., feedback
        // const feedbackQuery = firestore.collection('feedback').where('userId', '==', userId);
        // ... delete feedback docs

        // Finally, delete the user document itself
        await firestore.collection('users').doc(userId).delete();
        
        // Delete user from Firebase Authentication
        await adminAuth.deleteUser(userId);

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Error deleting user account:", error);
        return { success: false, error: "Failed to delete account." };
    }
}
