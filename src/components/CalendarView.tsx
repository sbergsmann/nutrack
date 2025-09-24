"use client";

import { useRouter, usePathname } from "next/navigation";
import { format, parseISO, addDays, subDays, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarView({
  selectedDate,
  trackedDates,
}: {
  selectedDate: Date;
  trackedDates: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    if (pathname.startsWith("/day")) {
      router.push(`/day/${formattedDate}`);
    } else {
       if (isSameDay(day, new Date())) {
        router.push(`/`);
      } else {
        router.push(`/day/${formattedDate}`);
      }
    }
  };
  
  const today = new Date();

  const daysToShow = 7;
  const startOfWeek = subDays(selectedDate, Math.floor(daysToShow / 2));

  const weekDays = Array.from({ length: daysToShow }).map((_, i) =>
    addDays(startOfWeek, i)
  );

  const navigateDays = (days: number) => {
    handleDayClick(addDays(selectedDate, days));
  };


  return (
    <div className="flex items-center justify-between gap-2 p-4 rounded-lg bg-card border shadow-sm">
      <Button variant="ghost" size="icon" onClick={() => navigateDays(-1)}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1 grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
        {weekDays.map((day) => {
          const formattedDate = format(day, "yyyy-MM-dd");
          const isTracked = trackedDates.includes(formattedDate);
          const isToday = isSameDay(day, today);
          
          return (
            <Button
              key={formattedDate}
              variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
              className={cn("flex flex-col h-auto p-2", 
                isToday && !isSameDay(day, selectedDate) && "bg-accent/80 text-accent-foreground",
                isTracked && !isSameDay(day, selectedDate) && "bg-primary/30 text-primary-foreground font-bold"
              )}
              onClick={() => handleDayClick(day)}
            >
              <span className="text-xs font-medium uppercase">
                {format(day, "eee")}
              </span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
            </Button>
          );
        })}
      </div>
      <Button variant="ghost" size="icon" onClick={() => navigateDays(1)}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}