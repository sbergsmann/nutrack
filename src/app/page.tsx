import { format } from "date-fns";
import { getAllEntries, getEntry } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { DailyTracker } from "@/components/DailyTracker";

export default async function HomePage() {
  const today = new Date();
  const todayDateString = format(today, "yyyy-MM-dd");

  const [todayEntry, allEntries] = await Promise.all([
    getEntry(todayDateString),
    getAllEntries(),
  ]);

  const trackedDates = allEntries
    .filter((entry) => entry.foods.length > 0 || entry.mood)
    .map((entry) => entry.date);

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-2 space-y-6">
        <DailyTracker entry={todayEntry} isToday={true} />
      </div>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-headline">Calendar</h2>
        <CalendarView trackedDates={trackedDates} />
      </div>
    </div>
  );
}
