
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addFood, getUser, updateUserPlan } from "@/lib/data";
import { headers } from "next/headers";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { stripe } from "./stripe";
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


export async function getUserIdFromToken(idToken: string): Promise<string | null> {
    try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        const err = error as { code?: string };
        if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
            return null;
        }
        console.error("Error verifying token:", error);
        return null;
    }
}


const subscribeSchema = z.object({
  plan: z.enum(["Monthly", "Yearly"]),
  idToken: z.string(),
});

export async function createCheckoutSession(formData: FormData) {
  const result = subscribeSchema.safeParse({
    plan: formData.get("plan"),
    idToken: formData.get("idToken"),
  });

  if (!result.success) {
    return { error: "Invalid input." };
  }

  const { plan, idToken } = result.data;
  
  const userId = await getUserIdFromToken(idToken);
  if (!userId) {
    return { error: "You must be logged in to subscribe." };
  }

  const firestore = getFirestore();
  const user = await getUser(firestore, userId);

  if (!user) {
    return { error: "User not found." };
  }
  
  const priceId =
    plan === "Monthly"
      ? process.env.STRIPE_MONTHLY_PLAN_PRICE_ID
      : process.env.STRIPE_YEARLY_PLAN_PRICE_ID;

  if (!priceId) {
    return { error: "Price ID is not configured." };
  }
  
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: user.stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${getURL()}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getURL()}/premium?canceled=true`,
      metadata: {
        plan: plan,
      },
      client_reference_id: userId, // Pass userId to identify user in webhook
    });

    return { sessionId: checkoutSession.id };
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return { error: "Could not create checkout session." };
  }
}
