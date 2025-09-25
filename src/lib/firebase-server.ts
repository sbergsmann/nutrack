import "server-only";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { firebaseConfig } from "@/firebase/config";

const CHAT_GPT_SESSION_COOKIE = "AuthToken";

async function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  const response = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/firebase-adminsdk-to23x@demo-sr-id-dev.iam.gserviceaccount.com"
  );
  const data = await response.json();
  return initializeApp({
    credential: cert(data),
    projectId: firebaseConfig.projectId,
  });
}

async function getTokens() {
  const cookie = cookies().get(CHAT_GPT_SESSION_COOKIE);
  if (cookie) {
    const app = await getFirebaseAdminApp();
    const auth = getAuth(app);
    try {
      const tokens = await auth.verifySessionCookie(cookie.value, true);
      return tokens;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  return null;
}

export async function getDb() {
  const app = await getFirebaseAdminApp();
  return getFirestore(app);
}

export async function getAuthenticatedAppForUser() {
  const tokens = await getTokens();
  if (!tokens) {
    return null;
  }

  const app = await getFirebaseAdminApp();
  return { app: app, user: tokens };
}