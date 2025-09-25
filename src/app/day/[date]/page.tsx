
"use client";

import { format, isSameDay, parseISO, isValid } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { DailyTracker } from "@/components/DailyTracker";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase/auth/use-user";
import { useEffect, useState, use } from "react";
import type { DailyEntry } from "@/lib/types";
import { notFound } from "next/navigation";
import { useFirestore } from "@/firebase/provider";


export default function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date: dateString } = use(params);
  const firestore = useFirestore();

  const { data: user, loading: userLoading } = useUser();
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    notFound();
  }

  const selectedDate = parseISO(dateString);
  if (!isValid(selectedDate)) {
    notFound();
  }
  
  const [dayEntry, setDayEntry] = useState<DailyEntry | null>(null);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  useEffect(() => {
    if (!user || !firestore) return;

    const fetchData = async () => {
      setLoading(true);
      const [dayEntryData, allEntriesData] = await Promise.all([
        getEntry(firestore, user.uid, dateString),
        getAllEntries(firestore, user.uid),
      ]);
      setDayEntry(dayEntryData);
      setAllEntries(allEntriesData);
      setLoading(false);
    };

    fetchData();
  }, [user, dateString, firestore]);

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
        <DailyTracker 
          entry={dayEntry ?? {date: dateString, foods: [], mood: null}} 
          isToday={isToday} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
