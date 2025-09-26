
"use client";

import { format } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { DailyTracker } from "@/components/DailyTracker";
import { useUser } from "@/firebase/auth/use-user";
import { useState, useEffect } from "react";
import type { DailyEntry } from "@/lib/types";
import { useFirestore } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { getDictionary } from "@/lib/get-dictionary";

function TrackingPage({ dictionary }: { dictionary: any }) {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const today = new Date();
  const todayDateString = format(today, "yyyy-MM-dd");

  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      if (!userLoading) {
        setTodayEntry({ date: todayDateString, foods: [], mood: null });
        setAllEntries([]);
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const [todayEntryData, allEntriesData] = await Promise.all([
        getEntry(firestore, user.uid, todayDateString),
        getAllEntries(firestore, user.uid),
      ]);
      setTodayEntry(todayEntryData);
      setAllEntries(allEntriesData);
      setLoading(false);
    };

    fetchData();
  }, [user, todayDateString, firestore, userLoading]);

  const trackedDates = allEntries
    .filter((entry) => (entry.foods && entry.foods.length > 0) || entry.mood)
    .map((entry) => entry.date);

  const isLoading = userLoading || loading;

  if (isLoading || !dictionary) {
    return (
      <div className="container mx-auto space-y-8 p-4 md:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
        <DailyTracker 
            entry={todayEntry ?? {date: todayDateString, foods: [], mood: null}} 
            isToday={true} 
            isLoading={isLoading}
            trackedDates={trackedDates}
            dictionary={dictionary}
        />
    </div>
  );
}

async function TrackingPageLoader({ params }: { params: { lang: string } }) {
  const dictionary = await getDictionary(params.lang);
  return <TrackingPage dictionary={dictionary.dailyTracker} />;
}

export default TrackingPageLoader;
