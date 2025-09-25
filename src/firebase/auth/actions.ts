
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
  console.log("Attempting to sign in with Google...");
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    console.log("Google sign-in successful. User:", result.user);
  } catch (error: any) {
    console.log("Caught an error during Google sign-in:", error);
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.log("Sign-in popup was closed by the user or the request was cancelled.");
      // User closed the popup, this is not an error to be reported to the user via toast.
      return;
    }
    console.error("Full error object signing in with Google: ", error);
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
  } catch (error: any) {
    console.error("Error signing out: ", error);
    toast({
      variant: "destructive",
      title: "Error signing out",
      description: error.message,
    });
  }
};
