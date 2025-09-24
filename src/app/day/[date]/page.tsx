import { format, isSameDay, parseISO, isValid } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { DailyTracker } from "@/components/DailyTracker";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DayPage({ params }: { params: { date: string } }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    notFound();
  }

  const selectedDate = parseISO(params.date);
  if (!isValid(selectedDate)) {
    notFound();
  }

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const [dayEntry, allEntries] = await Promise.all([
    getEntry(params.date),
    getAllEntries(),
  ]);

  const trackedDates = allEntries
    .filter((entry) => entry.foods.length > 0 || entry.mood)
    .map((entry) => entry.date);

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-2 space-y-6">
        {!isToday && (
          <Button asChild variant="outline">
            <Link href="/">Back to Today's Log</Link>
          </Button>
        )}
        <DailyTracker entry={dayEntry} isToday={isToday} />
      </div>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-headline">Calendar</h2>
        <CalendarView trackedDates={trackedDates} />
      </div>
    </div>
  );
}
