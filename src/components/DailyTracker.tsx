"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { logFood, selectMood, deleteFood } from "@/lib/actions";
import type { DailyEntry, Mood } from "@/lib/types";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Smile, Meh, Frown, Zap, Battery, Utensils, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

const moodOptions: { value: Mood; label: string; icon: React.ReactNode }[] = [
  { value: "Happy", label: "Happy", icon: <Smile /> },
  { value: "Neutral", label: "Neutral", icon: <Meh /> },
  { value: "Sad", label: "Sad", icon: <Frown /> },
  { value: "Energetic", label: "Energetic", icon: <Zap /> },
  { value: "Tired", label: "Tired", icon: <Battery /> },
];

export function DailyTracker({
  entry,
  isToday,
}: {
  entry: DailyEntry;
  isToday: boolean;
}) {
  const [state, formAction] = useActionState(logFood, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(state).length === 0) {
      formRef.current?.reset();
    }
  }, [state]);

  const [isPending, startTransition] = useTransition();

  const handleMoodChange = (mood: Mood) => {
    if (mood === entry.mood || !isToday) return;
    const formData = new FormData();
    formData.append("mood", mood);
    formData.append("date", entry.date);
    startTransition(() => {
      selectMood(formData);
    });
  };

  const handleDeleteFood = (food: string) => {
    if (!isToday) return;
    const formData = new FormData();
    formData.append("food", food);
    formData.append("date", entry.date);
    startTransition(() => {
      deleteFood(formData);
    });
  }

  const displayDate = format(parseISO(entry.date), "MMMM d, yyyy");

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">
            {displayDate}
          </CardTitle>
          <CardDescription>
            {isToday
              ? "Log your food and mood for the day."
              : "A summary of your food and mood."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isToday && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-medium text-sm">
                  {entry.mood ? `You're feeling: ${entry.mood}` : "How are you feeling?"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={entry.mood === option.value ? "default" : "outline"}
                      onClick={() => handleMoodChange(option.value)}
                      disabled={isPending || !isToday}
                      className={cn("flex-1 md:flex-none justify-center",
                        entry.mood === option.value && "shadow-md"
                      )}
                    >
                      {option.icon}
                      <span className="ml-2">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
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
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Logged Foods</h3>
            {entry.foods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entry.foods.map((food, index) => (
                   <Card key={index} className="shadow-sm relative group">
                     <CardContent className="p-4 flex items-center gap-4">
                       <div className="bg-primary/20 text-primary p-2 rounded-full">
                         <Utensils className="h-5 w-5" />
                       </div>
                       <p className="text-sm font-medium">{food}</p>
                     </CardContent>
                     {isToday && (
                       <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-2 -translate-y-1/2"
                          onClick={() => handleDeleteFood(food)}
                          aria-label={`Delete ${food}`}
                          disabled={isPending}
                        >
                          <Trash className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                        </Button>
                     )}
                   </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm p-4 bg-background/50 border rounded-md">
                <p>No food logged for this day yet.</p>
              </div>
            )}
          </div>
          
          {!isToday && (
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
          )}

        </CardContent>
      </Card>
    </div>
  );
}
