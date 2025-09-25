
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addFood, removeFood, searchFoods, setMood, updateFoodQuantity } from "@/lib/data";
import type { DailyEntry, FoodItem, LoggedFood, Mood } from "@/lib/types";
import { format, isSameDay, parseISO } from "date-fns";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Smile, Meh, Frown, Zap, Battery, Trash, Minus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackDialog } from "./FeedbackDialog";
import FoodIcon from "./FoodIcon";

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
  isLoading,
  trackedDates = [],
}: {
  entry: DailyEntry;
  isToday: boolean;
  isLoading: boolean;
  trackedDates?: string[];
}) {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [currentMood, setCurrentMood] = useState<Mood | null>(entry.mood);
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>(entry.foods);
  const [foodInput, setFoodInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);


  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedFoodInput = useDebounce(foodInput, 300);
  const selectedDate = parseISO(entry.date);

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
    setLoggedFoods(currentFoods => currentFoods.filter(f => f.food.id !== foodId));
    removeFood(firestore, user.uid, entry.date, foodId).then(() => {
      toast({
        title: "Food removed",
      });
      router.refresh();
    });
  }

  const handleQuantityChange = (food: FoodItem, change: 1 | -1) => {
    if (!user || !firestore) return;
  
    setIsPending(true);
  
    const originalQuantity = loggedFoods.find(f => f.food.id === food.id)?.quantity ?? 0;
  
    setLoggedFoods(currentFoods => {
      const existingFood = currentFoods.find(f => f.food.id === food.id);
      if (existingFood) {
        const newQuantity = existingFood.quantity + change;
        if (newQuantity > 0) {
          return currentFoods.map(f => f.food.id === food.id ? { ...f, quantity: newQuantity } : f);
        } else {
          return currentFoods.filter(f => f.food.id !== food.id);
        }
      }
      return currentFoods;
    });
  
    let dbPromise;
    if (change === 1) {
      dbPromise = addFood(firestore, user.uid, entry.date, food.name);
    } else {
      if (originalQuantity > 1) {
        dbPromise = updateFoodQuantity(firestore, user.uid, entry.date, food.id, originalQuantity - 1);
      } else {
        dbPromise = removeFood(firestore, user.uid, entry.date, food.id);
      }
    }
  
    dbPromise.then(() => {
      router.refresh();
    }).catch(error => {
      console.error("Failed to update quantity:", error);
      toast({ variant: "destructive", title: "Failed to update quantity" });
      setLoggedFoods(entry.foods); 
    }).finally(() => {
      setIsPending(false);
    });
  };

  const handleAddFood = (foodName: string) => {
    if (!user || !firestore) return;
    
    const trimmedFoodName = foodName.trim();
    if (!trimmedFoodName) return;

    setIsPending(true);
    setShowSuggestions(false);
    setFoodInput("");

    let newFoodAdded = false;
    let newFoods: LoggedFood[] = [];

    setLoggedFoods(currentFoods => {
      const existingFood = currentFoods.find(f => f.food.name.toLowerCase() === trimmedFoodName.toLowerCase());
      if (existingFood) {
        newFoods = currentFoods.map(f => f.food.name.toLowerCase() === trimmedFoodName.toLowerCase() ? { ...f, quantity: f.quantity + 1 } : f);
      } else {
        newFoodAdded = true;
        const newFood: LoggedFood = {
          food: {
            id: `temp-${Date.now()}`,
            name: trimmedFoodName,
            lastAddedAt: new Date(),
          },
          quantity: 1,
        };
        newFoods = [...currentFoods, newFood];
      }
      
      // Check for feedback condition
      if (newFoodAdded && newFoods.length === 5) {
        const hasShownFeedback = localStorage.getItem("hasShownFifthFoodFeedback");
        if (!hasShownFeedback) {
          setFeedbackOpen(true);
          localStorage.setItem("hasShownFifthFoodFeedback", "true");
        }
      }
      
      return newFoods;
    });

    addFood(firestore, user.uid, entry.date, trimmedFoodName).then(() => {
      toast({
        title: "Food logged!",
        description: `${trimmedFoodName} has been added to your log.`,
      });
      router.refresh();
    }).catch(error => {
      console.error("Failed to log food:", error);
      toast({
        variant: "destructive",
        title: "Failed to log food",
        description: "Please try again.",
      });
      setLoggedFoods(entry.foods);
    }).finally(() => {
      setIsPending(false);
    });
  };

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    const formattedDate = format(day, "yyyy-MM-dd");
    const href = isSameDay(day, new Date()) ? `/` : `/day/${formattedDate}`;
    router.push(href, { scroll: false });
    setCalendarOpen(false);
  };
  
  const trackedDateObjects = trackedDates.map(dateStr => parseISO(dateStr));
  const displayDate = format(selectedDate, "MMMM d, yyyy");

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
              <div className="flex flex-col gap-2">
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
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        {/* This is a dummy trigger, as the dialog is controlled programmatically */}
        <span />
      </FeedbackDialog>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                {!isToday && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/">Go to Today</Link>
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <CardTitle className="font-headline">{displayDate}</CardTitle>
          </div>
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
                  <div className="flex flex-col gap-2">
                    {loggedFoods.map(({food, quantity}) => (
                      <Card key={food.id} className="shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4 overflow-hidden flex-1">
                            <div className="bg-primary/20 text-primary p-2 rounded-full">
                                <FoodIcon iconName={food.icon} className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-medium truncate">{food.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(food, -1)}
                              disabled={isPending || quantity <= 1}
                              aria-label={`Decrease quantity of ${food.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                             <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(food, 1)}
                              disabled={isPending}
                              aria-label={`Increase quantity of ${food.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/70 hover:text-destructive"
                            onClick={() => handleDeleteFood(food.id)}
                            disabled={isPending}
                            aria-label={`Delete ${food.name}`}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </CardContent>
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
