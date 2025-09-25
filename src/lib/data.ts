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
  serverTimestamp,
  Timestamp,
  query,
  where,
  limit,
  addDoc,
} from "firebase/firestore";
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import type { DailyEntry, FoodItem, Mood } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from "@/firebase/errors";

const getEntriesCollection = (
  firestore: Firestore | AdminFirestore,
  userId: string
) => collection(firestore as Firestore, "users", userId, "dailyLogs");

const getFoodsCollection = (firestore: Firestore | AdminFirestore) =>
  collection(firestore as Firestore, "foods");

export async function getFoodItem(
  firestore: Firestore | AdminFirestore,
  foodId: string
): Promise<FoodItem | null> {
  const foodDocRef = doc(getFoodsCollection(firestore), foodId);
  const foodDoc = await getDoc(foodDocRef);
  if (!foodDoc.exists()) {
    return null;
  }
  const data = foodDoc.data();
  return {
    id: foodDoc.id,
    name: data.name,
    lastAddedAt: (data.lastAddedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

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

  const entryData = entryDoc.data();
  const foodIds = (entryData.foods || []) as string[];

  const foodItems = (
    await Promise.all(
      foodIds.map((id) => getFoodItem(firestore, id))
    )
  ).filter((food): food is FoodItem => food !== null);

  return {
    ...entryData,
    foods: foodItems,
  } as DailyEntry;
}

export async function getAllEntries(
  firestore: Firestore | AdminFirestore,
  userId: string
): Promise<DailyEntry[]> {
  const snapshot = await getDocs(getEntriesCollection(firestore, userId));
  const entries = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const entryData = doc.data();
      const foodIds = (entryData.foods || []) as string[];
      
      const foodItems = (
        await Promise.all(
          foodIds.map((id) => getFoodItem(firestore, id))
        )
      ).filter((food): food is FoodItem => food !== null);

      return {
        ...entryData,
        foods: foodItems,
      } as DailyEntry;
    })
  );
  return entries;
}

export async function getOrCreateFood(
  firestore: Firestore | AdminFirestore,
  foodName: string
): Promise<string> {
  const trimmedFoodName = foodName.trim();
  const foodsRef = getFoodsCollection(firestore);

  // Query to see if the food item already exists
  const q = query(
    foodsRef,
    where("name", "==", trimmedFoodName),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Food exists, update timestamp and return its ID
    const foodDoc = querySnapshot.docs[0];
    const foodRef = doc(foodsRef, foodDoc.id);
    await updateDoc(foodRef, { lastAddedAt: serverTimestamp() });
    return foodDoc.id;
  } else {
    // Food doesn't exist, create it with an auto-generated ID
    const newFoodDocRef = await addDoc(foodsRef, {
      name: trimmedFoodName,
      lastAddedAt: serverTimestamp(),
    });
    return newFoodDocRef.id;
  }
}

export async function addFood(
  firestore: Firestore,
  userId: string,
  date: string,
  foodName: string
): Promise<void> {
  const foodId = await getOrCreateFood(firestore, foodName);
  const entryRef = doc(getEntriesCollection(firestore, userId), date);

  const docSnap = await getDoc(entryRef);
  if (docSnap.exists()) {
    updateDoc(entryRef, {
      foods: arrayUnion(foodId),
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: entryRef.path,
        operation: "update",
        requestResourceData: { foods: arrayUnion(foodId) },
      } satisfies SecurityRuleContext);
      errorEmitter.emit("permission-error", permissionError);
    });
  } else {
    const newEntry = {
      date: date,
      foods: [foodId],
      mood: null,
      id: userId,
    };
    setDoc(entryRef, newEntry, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: entryRef.path,
        operation: "create",
        requestResourceData: newEntry,
      } satisfies SecurityRuleContext);
      errorEmitter.emit("permission-error", permissionError);
    });
  }
}

export async function removeFood(
  firestore: Firestore,
  userId: string,
  date: string,
  foodId: string
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  updateDoc(entryRef, {
    foods: arrayRemove(foodId),
  }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: "update",
      requestResourceData: { foods: arrayRemove(foodId) },
    } satisfies SecurityRuleContext);
    errorEmitter.emit("permission-error", permissionError);
  });
}

export async function setMood(
  firestore: Firestore,
  userId: string,
  date: string,
  mood: Mood
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  const data = {
    date,
    mood,
    id: userId,
  };
  setDoc(entryRef, data, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: "update",
      requestResourceData: data,
    } satisfies SecurityRuleContext);
    errorEmitter.emit("permission-error", permissionError);
  });
}
