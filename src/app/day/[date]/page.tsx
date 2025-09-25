
"use client";

import { format, isSameDay, parseISO, isValid } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { DailyTracker } from "@/components/DailyTracker";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase/auth/use-user";
import { useEffect, useState } from "react";
import type { DailyEntry } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";


export default function DayPage({ params }: { params: { date: string } }) {
  const { data: user, loading: userLoading } = useUser();
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    notFound();
  }

  const selectedDate = parseISO(params.date);
  if (!isValid(selectedDate)) {
    notFound();
  }
  
  const [dayEntry, setDayEntry] = useState<DailyEntry | null>(null);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [dayEntryData, allEntriesData] = await Promise.all([
        getEntry(user.uid, params.date),
        getAllEntries(user.uid),
      ]);
      setDayEntry(dayEntryData);
      setAllEntries(allEntriesData);
      setLoading(false);
    };

    fetchData();
  }, [user, params.date]);

  const trackedDates = allEntries
    .filter((entry) => entry.foods.length > 0 || entry.mood)
    .map((entry) => entry.date);

  const isLoading = userLoading || (user && loading);

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <CalendarView selectedDate={selectedDate} trackedDates={trackedDates} />
       <div className="space-y-6">
        {!isToday && (
          <Button asChild variant="outline">
            <Link href="/">Back to Today's Log</Link>
          </Button>
        )}
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : dayEntry ? (
          <DailyTracker entry={dayEntry} isToday={isToday} />
        ) : <DailyTracker entry={{date: params.date, foods: [], mood: null}} isToday={isToday}/>}
      </div>
    </div>
  );
}
