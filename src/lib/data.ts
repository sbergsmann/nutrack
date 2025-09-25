
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
import type { DailyEntry, Mood } from "@/lib/types";

const getEntriesCollection = (firestore: Firestore, userId: string) =>
  collection(firestore, "users", userId, "entries");

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
  firestore: Firestore,
  userId: string,
  date: string,
  food: string
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  
  try {
    await updateDoc(entryRef, {
      foods: arrayUnion(food),
    });
  } catch (error: any) {
    if (error.code === 'not-found') {
      await setDoc(entryRef, {
        date: date,
        foods: [food],
        mood: null
      }, { merge: true });
    } else {
      throw error;
    }
  }
}

export async function removeFood(
  firestore: Firestore,
  userId: string,
  date: string,
  food: string
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  await updateDoc(entryRef, {
    foods: arrayRemove(food),
  });
}

export async function setMood(
  firestore: Firestore,
  userId: string,
  date: string,
  mood: Mood
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  await setDoc(
    entryRef,
    {
      date,
      mood,
    },
    { merge: true }
  );
}
