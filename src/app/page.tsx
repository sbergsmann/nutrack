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
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <CalendarView selectedDate={today} trackedDates={trackedDates} />
      <DailyTracker entry={todayEntry} isToday={true} />
    </div>
  );
}
