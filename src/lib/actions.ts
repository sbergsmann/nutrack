
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
