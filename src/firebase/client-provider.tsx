
"use client";

import { FirebaseProvider } from "./provider";
import { firebaseApp, auth, firestore } from "./client";
import { ReactNode } from "react";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider value={{ firebaseApp, auth, firestore }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
