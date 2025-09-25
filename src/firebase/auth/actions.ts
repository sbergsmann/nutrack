
"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  connectAuthEmulator,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { firebaseConfig } from "@/firebase/config";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // Sometimes in dev environments, explicitly setting the auth domain can help.
    auth.tenantId = null;
    auth.languageCode = 'en';
    if (firebaseConfig.authDomain) {
      auth.useDeviceLanguage();
      auth.settings.authDomain = firebaseConfig.authDomain;
    }

    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
