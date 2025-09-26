
"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { toast } from "@/hooks/use-toast";
import { getDictionary } from "@/lib/get-dictionary";
import { i18n } from "@/i18n.config";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User closed the popup, this is not an error to be reported to the user via toast.
      return;
    }
    
    // Attempt to get locale from URL to show toast in correct language
    const lang = window.location.pathname.split('/')[1] || i18n.defaultLocale;
    const dictionary = await getDictionary(lang as any);

    toast({
      variant: "destructive",
      title: dictionary.toasts.error.signIn,
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
    const lang = window.location.pathname.split('/')[1] || i18n.defaultLocale;
    const dictionary = await getDictionary(lang as any);
    toast({
      variant: "destructive",
      title: dictionary.toasts.error.signOut,
      description: error.message,
    });
  }
};
