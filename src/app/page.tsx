
"use client";

import { format } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { DailyTracker } from "@/components/DailyTracker";
import { useUser } from "@/firebase/auth/use-user";
import { useEffect, useState } from "react";
import type { DailyEntry } from "@/lib/types";
import { useFirestore } from "@/firebase/provider";


export default function HomePage() {
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
    .filter((entry) => entry.foods.length > 0 || entry.mood)
    .map((entry) => entry.date);

  const isLoading = userLoading || loading;

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <CalendarView selectedDate={today} trackedDates={trackedDates} />
      <DailyTracker 
        entry={todayEntry ?? {date: todayDateString, foods: [], mood: null}} 
        isToday={true} 
        isLoading={isLoading}
      />
    </div>
  );
}
