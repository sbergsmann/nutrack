import "server-only";
import { getDb } from "@/lib/firebase-server";
import type { DailyEntry, Mood } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

const getEntriesCollection = (db: FirebaseFirestore.Firestore) =>
  db.collection("entries");

export async function getEntry(date: string): Promise<DailyEntry> {
  const db = await getDb();
  const entryDoc = await getEntriesCollection(db).doc(date).get();

  if (!entryDoc.exists) {
    return {
      date,
      foods: [],
      mood: null,
    };
  }

  return entryDoc.data() as DailyEntry;
}

export async function getAllEntries(): Promise<DailyEntry[]> {
  const db = await getDb();
  const snapshot = await getEntriesCollection(db).get();
  return snapshot.docs.map((doc) => doc.data() as DailyEntry);
}

export async function addFood(
  date: string,
  food: string
): Promise<DailyEntry> {
  const db = await getDb();
  const entryRef = getEntriesCollection(db).doc(date);
  await entryRef.set(
    {
      date: date,
      foods: FieldValue.arrayUnion(food),
    },
    { merge: true }
  );

  const doc = await entryRef.get();
  return doc.data() as DailyEntry;
}

export async function removeFood(
  date: string,
  food: string
): Promise<DailyEntry> {
  const db = await getDb();
  const entryRef = getEntriesCollection(db).doc(date);
  await entryRef.update({
    foods: FieldValue.arrayRemove(food),
  });
  const doc = await entryRef.get();
  return doc.data() as DailyEntry;
}

export async function setMood(date: string, mood: Mood): Promise<DailyEntry> {
  const db = await getDb();
  const entryRef = getEntriesCollection(db).doc(date);
  await entryRef.set(
    {
      date,
      mood,
    },
    { merge: true }
  );
  const doc = await entryRef.get();
  return doc.data() as DailyEntry;
}