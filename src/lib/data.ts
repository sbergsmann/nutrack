
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
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";


const getEntriesCollection = (firestore: Firestore | AdminFirestore, userId: string) =>
  collection(firestore as Firestore, "users", userId, "dailyLogs");

export async function getEntry(
  firestore: Firestore | AdminFirestore,
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
  firestore: Firestore | AdminFirestore,
  userId: string
): Promise<DailyEntry[]> {
  const snapshot = await getDocs(getEntriesCollection(firestore, userId));
  return snapshot.docs.map((doc) => doc.data() as DailyEntry);
}

export async function addFood(
  firestore: Firestore | AdminFirestore,
  userId: string,
  date: string,
  food: string
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  
  const docSnap = await getDoc(entryRef);
  if (docSnap.exists()) {
      updateDoc(entryRef, {
          foods: arrayUnion(food),
      }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: entryRef.path,
          operation: 'update',
          requestResourceData: { foods: arrayUnion(food) },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  } else {
      const newEntry: DailyEntry = {
        date: date,
        foods: [food],
        mood: null
      };
      setDoc(entryRef, newEntry, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: entryRef.path,
          operation: 'create',
          requestResourceData: newEntry,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }
}

export async function removeFood(
  firestore: Firestore | AdminFirestore,
  userId: string,
  date: string,
  food: string
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  updateDoc(entryRef, {
    foods: arrayRemove(food),
  }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: 'update',
      requestResourceData: { foods: arrayRemove(food) },
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function setMood(
  firestore: Firestore | AdminFirestore,
  userId: string,
  date: string,
  mood: Mood
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  const data = {
    date,
    mood,
  };
  setDoc(
    entryRef,
    data,
    { merge: true }
  ).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: 'update',
      requestResourceData: data,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
  });
}
