
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
  orderBy,
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

export async function searchFoods(
  firestore: Firestore,
  searchTerm: string
): Promise<FoodItem[]> {
  const foodsRef = getFoodsCollection(firestore);
  const q = query(
    foodsRef,
    where("name", ">=", searchTerm),
    where("name", "<=", searchTerm + "\uf8ff"),
    orderBy("name"),
    limit(5)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      lastAddedAt: (data.lastAddedAt as Timestamp)?.toDate() ?? new Date(),
    };
  });
}

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
    date: entryData.date,
    mood: entryData.mood,
    foods: foodItems.sort((a, b) => (a.name > b.name ? 1 : -1)),
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
        date: entryData.date,
        mood: entryData.mood,
        foods: foodItems.sort((a, b) => (a.name > b.name ? 1 : -1)),
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

  const q = query(
    foodsRef,
    where("name", "==", trimmedFoodName),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const foodDoc = querySnapshot.docs[0];
    const foodRef = doc(foodsRef, foodDoc.id);
    await updateDoc(foodRef, { lastAddedAt: serverTimestamp() });
    return foodDoc.id;
  } else {
    const newFoodData = {
      name: trimmedFoodName,
      lastAddedAt: serverTimestamp(),
    };
    const newFoodDocRef = await addDoc(foodsRef, newFoodData);
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
  const docSnap = await getDoc(entryRef);
  if (!docSnap.exists()) return; // Nothing to remove from

  const foodItems = docSnap.data().foods as string[];
  const itemToRemove = foodItems.find(id => id === foodId)
  
  if (itemToRemove) {
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
