
"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, firestore } from "@/firebase/client";
import { toast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { format } from "date-fns";
import type { DailyEntry } from "@/lib/types";
import { getEntry } from "@/lib/data";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user document already exists
    const today = format(new Date(), "yyyy-MM-dd");
    
    // Use getEntry to see if we have a log for today
    const existingEntry = await getEntry(firestore, user.uid, today);

    // If there are no foods and no mood, it's a new or empty entry.
    // Let's ensure a document exists.
    if (!existingEntry.foods.length && !existingEntry.mood) {
      const entryRef = doc(firestore, "users", user.uid, "dailyLogs", today);
      const newEntry: Omit<DailyEntry, 'foods'> & { foods: string[] } = {
        date: today,
        foods: [],
        mood: null,
        id: user.uid,
      };
      await setDoc(entryRef, newEntry, { merge: true });
    }

  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User closed the popup, this is not an error to be reported.
      return;
    }
    console.error("Error signing in with Google: ", error);
    toast({
      variant: "destructive",
      title: "Error signing in",
      description: error.message,
    });
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error("Error signing out: ", error);
    toast({
      variant: "destructive",
      title: "Error signing out",
      description: error.message,
    });
  }
};
