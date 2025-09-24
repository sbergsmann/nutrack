"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef, useTransition } from "react";
import { logFood, selectMood } from "@/lib/actions";
import type { DailyEntry, Mood } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Smile, Meh, Frown, Zap, Battery } from "lucide-react";

const moodOptions: { value: Mood; label: string; icon: React.ReactNode }[] = [
  { value: "Happy", label: "Happy", icon: <Smile className="h-4 w-4" /> },
  { value: "Neutral", label: "Neutral", icon: <Meh className="h-4 w-4" /> },
  { value: "Sad", label: "Sad", icon: <Frown className="h-4 w-4" /> },
  { value: "Energetic", label: "Energetic", icon: <Zap className="h-4 w-4" /> },
  { value: "Tired", label: "Tired", icon: <Battery className="h-4 w-4" /> },
];

export function DailyTracker({
  entry,
  isToday,
}: {
  entry: DailyEntry;
  isToday: boolean;
}) {
  const [state, formAction] = useFormState(logFood, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(state).length === 0) {
      formRef.current?.reset();
    }
  }, [state]);

  const [isPending, startTransition] = useTransition();

  const handleMoodChange = (mood: Mood) => {
    const formData = new FormData();
    formData.append("mood", mood);
    formData.append("date", entry.date);
    startTransition(() => {
      selectMood(formData);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">
            {isToday ? "Today's Log" : `Log for ${entry.date}`}
          </CardTitle>
          <CardDescription>
            {isToday
              ? "Log your food and mood for the day."
              : "A summary of your food and mood."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isToday && (
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <form ref={formRef} action={formAction} className="space-y-2">
                <label htmlFor="food-input" className="font-medium text-sm">
                  Add a food item
                </label>
                <div className="flex gap-2">
                  <Input
                    id="food-input"
                    name="food"
                    placeholder="e.g., Avocado toast"
                    className="flex-grow"
                    required
                  />
                  <input type="hidden" name="date" value={entry.date} />
                  <Button type="submit" size="icon" aria-label="Add food">
                    <Plus />
                  </Button>
                </div>
                {state.errors?.food && (
                  <p className="text-sm text-destructive">{state.errors.food[0]}</p>
                )}
              </form>
              <div className="space-y-2">
                <label
                  htmlFor="mood-select-trigger"
                  className="font-medium text-sm"
                >
                  How are you feeling?
                </label>
                <Select
                  onValueChange={handleMoodChange}
                  defaultValue={entry.mood || undefined}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="mood-select-trigger"
                    className="w-full"
                    aria-label="Select mood"
                  >
                    <SelectValue placeholder="Select your mood..." />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Logged Foods</h3>
            {entry.foods.length > 0 ? (
              <ul className="list-disc list-inside bg-background/50 p-4 rounded-md border space-y-1 text-sm">
                {entry.foods.map((food, index) => (
                  <li key={index}>{food}</li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground text-sm p-4 bg-background/50 border rounded-md">
                <p>No food logged for this day yet.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Mood</h3>
            {entry.mood ? (
              <div className="flex items-center gap-2 bg-background/50 p-3 rounded-md border w-fit text-sm">
                {moodOptions.find((o) => o.value === entry.mood)?.icon}
                <p>{entry.mood}</p>
              </div>
            ) : (
               <div className="text-center text-muted-foreground text-sm p-4 bg-background/50 border rounded-md">
                <p>No mood selected for this day.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
