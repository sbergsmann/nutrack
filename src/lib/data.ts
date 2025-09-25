
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  type Firestore,
  serverTimestamp,
  Timestamp,
  query,
  where,
  limit,
  addDoc,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import type { DailyEntry, FoodItem, LoggedFood, Mood } from "@/lib/types";
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

const getFeedbackCollection = (firestore: Firestore | AdminFirestore) =>
  collection(firestore as Firestore, "feedback");

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
  const foodEntries = (entryData.foods || []) as { foodId: string; quantity: number }[];

  const loggedFoods = (
    await Promise.all(
      foodEntries.map(async ({ foodId, quantity }) => {
        const food = await getFoodItem(firestore, foodId);
        if (!food) return null;
        return { food, quantity };
      })
    )
  ).filter((food): food is LoggedFood => food !== null);

  return {
    ...entryData,
    date: entryData.date,
    mood: entryData.mood,
    foods: loggedFoods.sort((a, b) => (a.food.name > b.food.name ? 1 : -1)),
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
      const foodEntries = (entryData.foods || []) as { foodId: string; quantity: number }[];
      
      const loggedFoods = (
        await Promise.all(
          foodEntries.map(async ({ foodId, quantity }) => {
            const food = await getFoodItem(firestore, foodId);
            if (!food) return null;
            return { food, quantity };
          })
        )
      ).filter((food): food is LoggedFood => food !== null);

      return {
        ...entryData,
        date: entryData.date,
        mood: entryData.mood,
        foods: loggedFoods.sort((a, b) => (a.food.name > b.food.name ? 1 : -1)),
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
    const foodRef = doc(foodsRef as Firestore, foodDoc.id);
    setDoc(foodRef, { lastAddedAt: serverTimestamp() }, { merge: true });
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

  try {
    await runTransaction(firestore, async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists()) {
        const newEntry = {
          date: date,
          foods: [{ foodId, quantity: 1 }],
          mood: null,
          id: userId,
        };
        transaction.set(entryRef, newEntry);
      } else {
        const currentFoods = (entryDoc.data().foods || []) as { foodId: string; quantity: number }[];
        const foodIndex = currentFoods.findIndex(f => f.foodId === foodId);
        
        if (foodIndex > -1) {
          // Increment quantity
          currentFoods[foodIndex].quantity += 1;
        } else {
          // Add new food
          currentFoods.push({ foodId, quantity: 1 });
        }
        transaction.update(entryRef, { foods: currentFoods });
      }
    });
  } catch (e) {
    console.error("Transaction failure:", e);
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: "update",
      requestResourceData: { foodName },
    } satisfies SecurityRuleContext);
    errorEmitter.emit("permission-error", permissionError);
    // Re-throw the original error if it's not a permission issue
    if (!(e instanceof FirestorePermissionError)) {
      throw e;
    }
  }
}

export async function removeFood(
  firestore: Firestore,
  userId: string,
  date: string,
  foodId: string
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);
  try {
    await runTransaction(firestore, async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists()) return;

      const currentFoods = (entryDoc.data().foods || []) as { foodId: string; quantity: number }[];
      const updatedFoods = currentFoods.filter(f => f.foodId !== foodId);
      transaction.update(entryRef, { foods: updatedFoods });
    });
  } catch (e) {
    console.error("Transaction failure:", e);
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: "update",
    } satisfies SecurityRuleContext);
    errorEmitter.emit("permission-error", permissionError);
    if (!(e instanceof FirestorePermissionError)) {
      throw e;
    }
  }
}

export async function updateFoodQuantity(
  firestore: Firestore,
  userId: string,
  date: string,
  foodId: string,
  newQuantity: number
): Promise<void> {
  const entryRef = doc(getEntriesCollection(firestore, userId), date);

  try {
    await runTransaction(firestore, async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists()) return;

      const currentFoods = (entryDoc.data().foods || []) as { foodId: string; quantity: number }[];
      const foodIndex = currentFoods.findIndex(f => f.foodId === foodId);
      
      if (foodIndex > -1) {
        if (newQuantity > 0) {
          currentFoods[foodIndex].quantity = newQuantity;
          transaction.update(entryRef, { foods: currentFoods });
        } else {
          // If quantity is 0 or less, remove the food
          const updatedFoods = currentFoods.filter(f => f.foodId !== foodId);
          transaction.update(entryRef, { foods: updatedFoods });
        }
      }
    });
  } catch (e) {
    console.error("Transaction failure:", e);
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: "update",
    } satisfies SecurityRuleContext);
    errorEmitter.emit("permission-error", permissionError);
    if (!(e instanceof FirestorePermissionError)) {
      throw e;
    }
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

export async function addFeedback(
  firestore: Firestore,
  userId: string,
  rating: number,
  text: string
): Promise<void> {
  const feedbackCollection = getFeedbackCollection(firestore);
  const feedbackData = {
    userId,
    rating,
    text,
    createdAt: serverTimestamp(),
  };

  const feedbackRef = doc(feedbackCollection);
  addDoc(feedbackCollection, feedbackData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: feedbackRef.path,
      operation: 'create',
      requestResourceData: feedbackData,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
  });
}
