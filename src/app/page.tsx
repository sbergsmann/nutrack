
"use client";

import { format } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { DailyTracker } from "@/components/DailyTracker";
import { useUser } from "@/firebase/auth/use-user";
import { useEffect, useState } from "react";
import type { DailyEntry } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const today = new Date();
  const todayDateString = format(today, "yyyy-MM-dd");

  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [todayEntryData, allEntriesData] = await Promise.all([
        getEntry(user.uid, todayDateString),
        getAllEntries(user.uid),
      ]);
      setTodayEntry(todayEntryData);
      setAllEntries(allEntriesData);
      setLoading(false);
    };

    fetchData();
  }, [user, todayDateString]);

  const trackedDates = allEntries
    .filter((entry) => entry.foods.length > 0 || entry.mood)
    .map((entry) => entry.date);

  const isLoading = userLoading || (user && loading);

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <CalendarView selectedDate={today} trackedDates={trackedDates} />
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : todayEntry ? (
        <DailyTracker entry={todayEntry} isToday={true} />
      ) : <DailyTracker entry={{date: todayDateString, foods: [], mood: null}} isToday={true}/>}
    </div>
  );
}
