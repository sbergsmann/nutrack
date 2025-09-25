
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addFood, removeFood, searchFoods, setMood } from "@/lib/data";
import type { DailyEntry, FoodItem, Mood } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

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
  const [foodInput, setFoodInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedFoodInput = useDebounce(foodInput, 300);

  useEffect(() => {
    setCurrentMood(entry.mood);
    setLoggedFoods(entry.foods);
  }, [entry]);

  useEffect(() => {
    if (debouncedFoodInput.length > 1 && firestore) {
      searchFoods(firestore, debouncedFoodInput).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [debouncedFoodInput, firestore]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMoodChange = (mood: Mood) => {
    if (!user || !firestore) return;
    if (mood === currentMood) return;

    setCurrentMood(mood);
    setMood(firestore, user.uid, entry.date, mood).then(() => {
      toast({
        title: "Mood updated!",
        description: `Your mood has been set to ${mood}.`,
      });
      router.refresh();
    });
  };

  const handleDeleteFood = (foodId: string) => {
    if (!user || !firestore) return;
    setLoggedFoods(currentFoods => currentFoods.filter(f => f.id !== foodId));
    removeFood(firestore, user.uid, entry.date, foodId).then(() => {
      toast({
        title: "Food removed",
      });
      router.refresh();
    });
  }

  const handleAddFood = async (foodName: string) => {
    if (!user || !firestore) return;
    
    const trimmedFoodName = foodName.trim();
    if (!trimmedFoodName) return;

    setIsPending(true);
    setShowSuggestions(false);

    const newFood: FoodItem = {
      id: `temp-${Date.now()}`,
      name: trimmedFoodName,
      lastAddedAt: new Date(),
    };
    setLoggedFoods(currentFoods => [...currentFoods, newFood]);
    setFoodInput("");

    try {
      await addFood(firestore, user.uid, entry.date, trimmedFoodName);
      toast({
        title: "Food logged!",
        description: `${trimmedFoodName} has been added to your log.`,
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to log food:", error);
      toast({
        variant: "destructive",
        title: "Failed to log food",
        description: "Please try again.",
      });
      setLoggedFoods(currentFoods => currentFoods.filter(f => f.id !== newFood.id));
    } finally {
      setIsPending(false);
    }
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddFood(foodInput);
                  }}
                  className="space-y-2"
                >
                  <label htmlFor="food-input" className="font-medium text-sm">
                    Add a food item
                  </label>
                  <div className="flex gap-2 relative" ref={containerRef}>
                     <Input
                      id="food-input"
                      name="food"
                      placeholder="e.g., Avocado toast"
                      className="flex-grow"
                      required
                      disabled={isPending}
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" aria-label="Add food" disabled={isPending}>
                      <Plus />
                    </Button>

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-10">
                        <ul className="py-1">
                          {suggestions.map((s) => (
                            <li
                              key={s.id}
                              className="px-3 py-2 hover:bg-accent cursor-pointer"
                              onClick={() => handleAddFood(s.name)}
                            >
                              {s.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
