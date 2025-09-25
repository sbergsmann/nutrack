
"use client";

import { useEffect, useState } from "react";
import { type User as AuthUser, onAuthStateChanged } from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase/provider";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { stripe } from "@/lib/stripe";

export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser: AuthUser | null) => {
      if (authUser) {
        const userRef = doc(firestore, "users", authUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            setUser(userSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // Create a new user profile in Firestore
            // and a new customer in Stripe
            const customer = await stripe.customers.create({
              email: authUser.email ?? undefined,
              name: authUser.displayName ?? undefined,
              metadata: {
                firebaseUID: authUser.uid,
              },
            });

            const newUser: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL,
              plan: "Basic",
              stripeCustomerId: customer.id,
            };
            await setDoc(userRef, newUser);
            // The snapshot listener will pick up this change and set the user
            setLoading(false);
          }
        }, (error) => {
          console.error("Error with user snapshot:", error);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  return { data: user, loading };
};
