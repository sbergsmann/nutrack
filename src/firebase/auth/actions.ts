
"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { toast } from "@/hooks/use-toast";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User closed the popup, this is not an error to be reported to the user via toast.
      return;
    }
    toast({
      variant: "destructive",
      title: "Error signing in",
      description: `Code: ${error.code} - Message: ${error.message}`,
    });
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any)
{
    console.error("Error signing out: ", error);
    toast({
      variant: "destructive",
      title: "Error signing out",
      description: error.message,
    });
  }
};
