
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay, addDays, subDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function CalendarView({
  selectedDate,
  trackedDates,
}: {
  selectedDate: Date;
  trackedDates: string[];
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const getDayLink = (day: Date | undefined) => {
    if (!day) return "/";
    const formattedDate = format(day, "yyyy-MM-dd");
    if (isSameDay(day, new Date())) {
      return `/`;
    }
    return `/day/${formattedDate}`;
  };

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    const href = getDayLink(day);
    router.push(href, { scroll: false });
    setIsExpanded(false); // Close popover on date selection
  };

  const today = new Date();

  const daysToShow = 7;
  const startOfWeek = subDays(selectedDate, Math.floor(daysToShow / 2));

  const weekDays = Array.from({ length: daysToShow }).map((_, i) =>
    addDays(startOfWeek, i)
  );

  const prevDay = subDays(selectedDate, 1);
  const nextDay = addDays(selectedDate, 1);

  const trackedDateObjects = trackedDates.map(dateStr => parseISO(dateStr));

  return (
    <div className="flex items-center justify-between gap-2 p-4 rounded-lg bg-card border shadow-sm animate-fade-in">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDayClick(prevDay)}
      >
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
              className={cn(
                "flex flex-col h-auto p-2",
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
      
      <Popover open={isExpanded} onOpenChange={setIsExpanded}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <CalendarIcon className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
           <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDayClick}
            initialFocus
            modifiers={{
              tracked: trackedDateObjects,
            }}
            modifiersClassNames={{
              tracked: "bg-primary/30 text-primary-foreground font-bold",
            }}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDayClick(nextDay)}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
