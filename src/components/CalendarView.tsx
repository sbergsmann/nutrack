"use client";

import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

export function CalendarView({ trackedDates }: { trackedDates: string[] }) {
  const router = useRouter();

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      const formattedDate = format(day, "yyyy-MM-dd");
      router.push(`/day/${formattedDate}`);
    }
  };

  const today = new Date();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-2 md:p-4 flex justify-center">
        <Calendar
          mode="single"
          onSelect={handleDayClick}
          className="rounded-md"
          modifiers={{
            tracked: (date) => trackedDates.includes(format(date, "yyyy-MM-dd")),
            today: (date) => isSameDay(date, today),
          }}
          modifiersClassNames={{
            tracked: "bg-primary/30 text-primary-foreground font-bold",
            today: "bg-accent/80 text-accent-foreground",
          }}
        />
      </CardContent>
    </Card>
  );
}
