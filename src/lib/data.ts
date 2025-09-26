
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

function generateNgrams(name: string): string[] {
    const ngrams = new Set<string>();
    if (!name) return [];
    
    const lowerCaseName = name.toLowerCase();
    const words = lowerCaseName.split(' ');

    for (const word of words) {
        if(word.length === 0) continue;
        for (let i = 1; i <= word.length; i++) {
            ngrams.add(word.substring(0, i));
        }
    }
    
    return Array.from(ngrams);
}

export async function searchFoods(
  firestore: Firestore,
  searchTerm: string
): Promise<FoodItem[]> {
  const foodsRef = getFoodsCollection(firestore);
  const lowercasedSearchTerm = searchTerm.toLowerCase();

  if (lowercasedSearchTerm.length < 1) {
    return [];
  }

  // Query for new documents with n-grams for substring matching
  const ngramQuery = query(
      foodsRef,
      where("name_ngrams", "array-contains", lowercasedSearchTerm),
      limit(5)
  );

  // Fallback query for old documents without n-grams (prefix search)
  const prefixQuery = query(
      foodsRef,
      where("name_lowercase", ">=", lowercasedSearchTerm),
      where("name_lowercase", "<=", lowercasedSearchTerm + "\uf8ff"),
      orderBy("name_lowercase"),
      limit(5)
  );

  const [ngramSnapshot, prefixSnapshot] = await Promise.all([
      getDocs(ngramQuery),
      getDocs(prefixQuery),
  ]);

  const results = new Map<string, FoodItem>();

  const processDoc = (doc: any) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        lastAddedAt: (data.lastAddedAt as Timestamp)?.toDate() ?? new Date(),
    } as FoodItem;
  };

  ngramSnapshot.docs.forEach(doc => {
      results.set(doc.id, processDoc(doc));
  });

  prefixSnapshot.docs.forEach(doc => {
      if (!results.has(doc.id)) {
          results.set(doc.id, processDoc(doc));
      }
  });


  // Since array-contains doesn't guarantee order, we sort client-side
  // to prioritize results that start with the search term.
  return Array.from(results.values())
    .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(lowercasedSearchTerm);
        const bStarts = bName.startsWith(lowercasedSearchTerm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName); // Alphabetical for others
    })
    .slice(0, 5); // Take top 5 after sorting
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
  const lowercasedFoodName = trimmedFoodName.toLowerCase();
  const foodsRef = getFoodsCollection(firestore);

  const q = query(
    foodsRef,
    where("name_lowercase", "==", lowercasedFoodName),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const foodDoc = querySnapshot.docs[0];
    const foodData = foodDoc.data();
    const foodRef = doc(foodsRef as Firestore, foodDoc.id);

    const updatePayload: { [key: string]: any } = { lastAddedAt: serverTimestamp() };
    
    let needsUpdate = false;
    // Backfill name_lowercase if it's missing
    if (!foodData.name_lowercase) {
      updatePayload.name_lowercase = foodData.name.toLowerCase();
      needsUpdate = true;
    }
    // Backfill n-grams if they are missing
    if (!foodData.name_ngrams) {
        updatePayload.name_ngrams = generateNgrams(foodData.name);
        needsUpdate = true;
    }

    if (needsUpdate) {
        await updateDoc(foodRef, updatePayload);
    } else {
        await updateDoc(foodRef, { lastAddedAt: serverTimestamp() });
    }
    
    const needsEnrichment = foodData.portion == null || foodData.calories == null || foodData.carbs == null || foodData.proteins == null || foodData.fats == null;
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
      name_lowercase: lowercasedFoodName,
      name_ngrams: generateNgrams(trimmedFoodName),
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
    data: Partial<Pick<UserProfile, 'height' | 'weight' | 'age' | 'gender' | 'activityLevel'>>
): Promise<void> {
    const userRef = doc(firestore, 'users', userId);

    const updateData: { [key: string]: any } = {};
    
    (Object.keys(data) as Array<keyof typeof data>).forEach(key => {
        if (data[key] === null) {
            updateData[key] = deleteField();
        } else if (data[key] !== undefined) {
            updateData[key] = data[key];
        }
    });
    
    await updateDoc(userRef, updateData).catch(async (serverError) => {
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

    

    