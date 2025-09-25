
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  arrayUnion,
  updateDoc,
  arrayRemove,
  type Firestore,
} from "firebase/firestore";
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import type { DailyEntry, Mood } from "@/lib/types";

const getEntriesCollection = (firestore: Firestore | AdminFirestore, userId: string) =>
  collection(firestore as Firestore, "users", userId, "entries");

export async function getEntry(
  firestore: Firestore,
  userId: string,
  date: string
): Promise<DailyEntry> {
  const entryDocRef = doc(getEntriesCollection(firestore, userId), date);
  const entryDoc = await getDoc(entryDocRef);

  if (!entryDoc.exists()) {
    return {
      date,
      foods: [],
      mood: null,
    };
  }

  return entryDoc.data() as DailyEntry;
}

export async function getAllEntries(
  firestore: Firestore,
  userId: string
): Promise<DailyEntry[]> {
  const snapshot = await getDocs(getEntriesCollection(firestore, userId));
  return snapshot.docs.map((doc) => doc.data() as DailyEntry);
}

export async function addFood(
  firestore: AdminFirestore,
  userId: string,
  date: string,
  food: string
): Promise<void> {
  const entryRef = firestore.collection("users").doc(userId).collection("entries").doc(date);
  
  try {
    const doc = await entryRef.get();
    if (doc.exists) {
        await entryRef.update({
            foods: arrayUnion(food),
        });
    } else {
        await entryRef.set({
            date: date,
            foods: [food],
            mood: null
        }, { merge: true });
    }
  } catch (error: any) {
      console.error("Error adding food:", error);
      throw error;
  }
}

export async function removeFood(
  firestore: AdminFirestore,
  userId: string,
  date: string,
  food: string
): Promise<void> {
  const entryRef = firestore.collection("users").doc(userId).collection("entries").doc(date);
  await entryRef.update({
    foods: arrayRemove(food),
  });
}

export async function setMood(
  firestore: AdminFirestore,
  userId: string,
  date: string,
  mood: Mood
): Promise<void> {
  const entryRef = firestore.collection("users").doc(userId).collection("entries").doc(date);
  await entryRef.set(
    {
      date,
      mood,
    },
    { merge: true }
  );
}
