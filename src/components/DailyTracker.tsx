
"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { removeFood, setMood } from "@/lib/data";
import { logFood } from "@/lib/actions";
import type { DailyEntry, FoodItem, Mood } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  isLoading,
}: {
  entry: DailyEntry;
  isToday: boolean;
  isLoading: boolean;
}) {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [currentMood, setCurrentMood] = useState<Mood | null>(entry.mood);
  const [loggedFoods, setLoggedFoods] = useState<FoodItem[]>(entry.foods);

  const [state, formAction, isPending] = useActionState(logFood, { message: ''});
  const formRef = useRef<HTMLFormElement>(null);


  useEffect(() => {
    setCurrentMood(entry.mood);
    setLoggedFoods(entry.foods);
  }, [entry]);

  const handleMoodChange = (mood: Mood) => {
    if (!user || !firestore) return;
    if (mood === currentMood) return;

    // Optimistic update
    setCurrentMood(mood);

    // Backend request
    setMood(firestore, user.uid, entry.date, mood).then(() => {
      toast({
        title: "Mood updated!",
        description: `Your mood has been set to ${mood}.`,
      });
      // While we do an optimistic update, we also refresh to ensure consistency
      router.refresh();
    });
  };

  const handleDeleteFood = (foodId: string) => {
    if (!user || !firestore) return;

    // Optimistic update
    setLoggedFoods(currentFoods => currentFoods.filter(f => f.id !== foodId));
    
    // Backend request
    removeFood(firestore, user.uid, entry.date, foodId).then(() => {
      toast({
        title: "Food removed",
      });
      router.refresh();
    });
  }

  const handleOptimisticAddFood = (formData: FormData) => {
    const foodName = formData.get('food') as string;
    if (!foodName.trim()) return;

    const newFood: FoodItem = {
      id: `temp-${Date.now()}`, // Temporary ID for rendering
      name: foodName,
      lastAddedAt: new Date(),
    };

    setLoggedFoods(currentFoods => [...currentFoods, newFood]);
    formRef.current?.reset();
  };

  const displayDate = format(parseISO(entry.date), "MMMM d, yyyy");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24 flex-1 md:flex-none" />
                ))}
              </div>
            </div>
             <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-grow" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">
            {displayDate}
          </CardTitle>
          <CardDescription>
            { user ? "Log your food and mood for the day." : "Please log in to track your food and mood."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-medium text-sm">
                    {currentMood ? `You're feeling: ${currentMood}` : "How are you feeling?"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {moodOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={currentMood === option.value ? "default" : "outline"}
                        onClick={() => handleMoodChange(option.value)}
                        disabled={isPending}
                        className={cn("flex-1 md:flex-none justify-center",
                          currentMood === option.value && "shadow-md"
                        )}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                 <form
                  ref={formRef}
                  action={formAction}
                  onSubmit={(e) => {
                    handleOptimisticAddFood(new FormData(e.currentTarget));
                  }}
                  className="space-y-2"
                >
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
                      disabled={isPending}
                    />
                    <input type="hidden" name="date" value={entry.date} />
                    <Button type="submit" size="icon" aria-label="Add food" disabled={isPending}>
                      <Plus />
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Logged Foods</h3>
                {loggedFoods && loggedFoods.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loggedFoods.map((food) => (
                      <Card key={food.id} className="shadow-sm relative group">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="bg-primary/20 text-primary p-2 rounded-full">
                            <Utensils className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium">{food.name}</p>
                        </CardContent>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-2 -translate-y-1/2"
                          onClick={() => handleDeleteFood(food.id)}
                          aria-label={`Delete ${food.name}`}
                          disabled={isPending}
                        >
                          <Trash className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm p-4 bg-background/50 border rounded-md">
                    <p>No food logged for this day yet.</p>

                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
