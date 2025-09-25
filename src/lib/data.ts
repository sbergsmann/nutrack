
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
  updateDoc,
  deleteField,
} from "firebase/firestore";
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import type { DailyEntry, FoodItem, LoggedFood, Mood, UserProfile } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from "@/firebase/errors";
import { enrichFood } from "@/ai/flows/enrich-food-flow";

const getEntriesCollection = (
  firestore: Firestore | AdminFirestore,
  userId: string
) => collection(firestore as Firestore, "users", userId, "dailyLogs");

const getFoodsCollection = (firestore: Firestore | AdminFirestore) =>
  collection(firestore as Firestore, "foods");

const getFeedbackCollection = (firestore: Firestore | AdminFirestore) =>
  collection(firestore as Firestore, "feedback");

async function triggerFoodEnrichment(firestore: Firestore, foodId: string, foodName: string) {
    try {
        console.log(`Enriching food: ${foodName} (${foodId})`);
        const enrichedData = await enrichFood({ foodName });

        if (enrichedData) {
            await updateDoc(doc(firestore, "foods", foodId), enrichedData);
            console.log(`Successfully enriched food: ${foodName} (${foodId})`);
        }
    } catch (error) {
        console.error(`Failed to enrich food: ${foodName} (${foodId})`, error);
    }
}


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
      ...data
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
    ...data,
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
  firestore: Firestore,
  foodName: string
): Promise<FoodItem> {
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
    const foodData = foodDoc.data();
    const foodRef = doc(foodsRef as Firestore, foodDoc.id);
    updateDoc(foodRef, { lastAddedAt: serverTimestamp() });
    
    const needsEnrichment = !foodData.portion || foodData.calories === undefined || foodData.carbs === undefined || foodData.proteins === undefined || foodData.fats === undefined;
    if (needsEnrichment) {
      triggerFoodEnrichment(firestore, foodDoc.id, trimmedFoodName);
    }
    
    return {
      id: foodDoc.id,
      name: foodData.name,
      lastAddedAt: (foodData.lastAddedAt as Timestamp)?.toDate() ?? new Date(),
      ...foodData
    } as FoodItem;

  } else {
    const newFoodData = {
      name: trimmedFoodName,
      lastAddedAt: serverTimestamp(),
    };
    const newFoodDocRef = await addDoc(foodsRef, newFoodData);
    triggerFoodEnrichment(firestore, newFoodDocRef.id, trimmedFoodName);
    return {
      id: newFoodDocRef.id,
      name: trimmedFoodName,
      lastAddedAt: new Date(),
    } as FoodItem;
  }
}

export async function addFood(
  firestore: Firestore,
  userId: string,
  date: string,
  foodName: string
): Promise<FoodItem> {
  const foodItem = await getOrCreateFood(firestore, foodName);
  const entryRef = doc(getEntriesCollection(firestore, userId), date);

  try {
    await runTransaction(firestore, async (transaction) => {
      const entryDoc = await transaction.get(entryRef);
      if (!entryDoc.exists()) {
        const newEntry = {
          date: date,
          foods: [{ foodId: foodItem.id, quantity: 1 }],
          mood: null,
          userId: userId,
        };
        transaction.set(entryRef, newEntry);
      } else {
        const currentFoods = (entryDoc.data().foods || []) as { foodId: string; quantity: number }[];
        const foodIndex = currentFoods.findIndex(f => f.foodId === foodItem.id);
        
        if (foodIndex > -1) {
          // Increment quantity
          currentFoods[foodIndex].quantity += 1;
        } else {
          // Add new food
          currentFoods.push({ foodId: foodItem.id, quantity: 1 });
        }
        transaction.update(entryRef, { foods: currentFoods });
      }
    });
    return foodItem;
  } catch (e) {
    console.error("Transaction failure:", e);
    const permissionError = new FirestorePermissionError({
      path: entryRef.path,
      operation: "update",
      requestResourceData: { foodName },
    } satisfies SecurityRuleContext);
    errorEmitter.emit("permission-error", permissionError);
    if (!(e instanceof FirestorePermissionError)) {
      throw e;
    }
    // Rethrow to be caught by the caller
    throw e;
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
    userId: userId,
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

export async function updateUserPlan(
  firestore: Firestore | AdminFirestore,
  userId: string,
  plan: UserProfile['plan']
): Promise<void> {
  const userRef = doc(firestore as Firestore, 'users', userId);
  const data = { plan };
  // Use client-side SDK for optimistic updates if on client
  if (typeof window !== "undefined") {
    updateDoc(userRef, data).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  } else {
    // Use admin SDK on server
    await (firestore as AdminFirestore).collection('users').doc(userId).update(data);
  }
}

export async function updateUserProfile(
    firestore: Firestore,
    userId: string,
    data: Partial<Pick<UserProfile, 'height' | 'weight'>>
): Promise<void> {
    const userRef = doc(firestore, 'users', userId);

    const updateData: { [key: string]: any } = {};
    if (data.height === null) {
      updateData.height = deleteField();
    } else if (data.height !== undefined) {
      updateData.height = data.height;
    }

    if (data.weight === null) {
      updateData.weight = deleteField();
    } else if (data.weight !== undefined) {
      updateData.weight = data.weight;
    }
    
    updateDoc(userRef, updateData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

export async function getUser(
    firestore: Firestore | AdminFirestore,
    userId: string
): Promise<UserProfile | null> {
    const userRef = doc(firestore as Firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    } else {
        return null;
    }
}
