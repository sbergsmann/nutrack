
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Smile, Meh, Frown, Zap, Battery, Trash, Minus, Calendar as CalendarIcon, Flame, Beef, Droplet, Sparkles, ArrowDownUp, SortDesc, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackDialog } from "./FeedbackDialog";
import FoodIcon from "./FoodIcon";

const moodOptions: { value: Mood; labelKey: string; icon: React.ReactNode }[] = [
  { value: "Happy", labelKey: "happy", icon: <Smile className="h-4 w-4" /> },
  { value: "Neutral", labelKey: "neutral", icon: <Meh className="h-4 w-4" /> },
  { value: "Sad", labelKey: "sad", icon: <Frown className="h-4 w-4" /> },
  { value: "Energetic", labelKey: "energetic", icon: <Zap className="h-4 w-4" /> },
  { value: "Tired", labelKey: "tired", icon: <Battery className="h-4 w-4" /> },
];

type SortKey = "calories" | "carbs" | "proteins" | "fats";

export function DailyTracker({
  entry,
  isToday,
  isLoading,
  trackedDates = [],
  dictionary,
}: {
  entry: DailyEntry;
  isToday: boolean;
  isLoading: boolean;
  trackedDates?: string[];
  dictionary: any;
}) {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang;
  const { toast } = useToast();

  const [currentMood, setCurrentMood] = useState<Mood | null>(entry.mood);
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>(entry.foods);
  const [foodInput, setFoodInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);


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
      router.refresh();
    });
  };

  const handleDeleteFood = (foodId: string) => {
    if (!user || !firestore) return;
    setLoggedFoods(currentFoods => currentFoods.filter(f => f.food.id !== foodId));
    removeFood(firestore, user.uid, entry.date, foodId).then(() => {
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

  const handleAddFood = async (foodName: string) => {
    if (!user || !firestore) return;
    
    const trimmedFoodName = foodName.trim();
    if (!trimmedFoodName) return;

    setIsPending(true);
    setShowSuggestions(false);
    setFoodInput("");

    try {
      const addedFood = await addFood(firestore, user.uid, entry.date, trimmedFoodName);
      
      setLoggedFoods(currentFoods => {
        const foodExists = currentFoods.some(f => f.food.id === addedFood.id);
        let newFoods;
        if (foodExists) {
          newFoods = currentFoods.map(f => 
            f.food.id === addedFood.id 
              ? { ...f, quantity: f.quantity + 1, food: addedFood } 
              : f
          );
        } else {
          newFoods = [...currentFoods, { food: addedFood, quantity: 1 }];
        }

        // Check for feedback condition
        if (!foodExists && newFoods.length === 5) {
          const hasShownFeedback = localStorage.getItem("hasShownFifthFoodFeedback");
          if (!hasShownFeedback) {
            setFeedbackOpen(true);
            localStorage.setItem("hasShownFifthFoodFeedback", "true");
          }
        }
        return newFoods;
      });

      router.refresh();
    } catch (error) {
      console.error("Failed to log food:", error);
      toast({
        variant: "destructive",
        title: dictionary.toasts.logFoodFailed.title,
        description: dictionary.toasts.logFoodFailed.description,
      });
      setLoggedFoods(entry.foods); // Revert optimistic update on error
    } finally {
      setIsPending(false);
    }
  };

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    const formattedDate = format(day, "yyyy-MM-dd");
    const href = isSameDay(day, new Date()) ? `/${lang}/tracking` : `/${lang}/day/${formattedDate}`;
    router.push(href, { scroll: false });
    setCalendarOpen(false);
  };
  
  const trackedDateObjects = trackedDates.map(dateStr => parseISO(dateStr));
  const displayDate = format(selectedDate, "MMMM d, yyyy");

  const nutrientTotals = useMemo(() => {
    return loggedFoods.reduce(
      (acc, { food, quantity }) => {
        acc.calories += (food.calories ?? 0) * quantity;
        acc.carbs += (food.carbs ?? 0) * quantity;
        acc.proteins += (food.proteins ?? 0) * quantity;
        acc.fats += (food.fats ?? 0) * quantity;
        return acc;
      },
      { calories: 0, carbs: 0, proteins: 0, fats: 0 }
    );
  }, [loggedFoods]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortKey(null); // Revert to default sort (by name)
    } else {
      setSortKey(key);
    }
  };

  const sortedLoggedFoods = useMemo(() => {
    const sorted = [...loggedFoods];
    if (sortKey) {
      sorted.sort((a, b) => {
        const aVal = (a.food[sortKey] ?? 0) * a.quantity;
        const bVal = (b.food[sortKey] ?? 0) * b.quantity;
        return bVal - aVal; // Always descending for nutrients
      });
    } else {
      sorted.sort((a, b) => a.food.name.localeCompare(b.food.name)); // Default sort by name
    }
    return sorted;
  }, [loggedFoods, sortKey]);

  const renderSortIcon = (key: SortKey) => {
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        {sortKey === key ? (
          <SortDesc className="h-4 w-4" />
        ) : (
          <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    );
  };

  if (isLoading || !dictionary) {
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
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} dictionary={dictionary.feedbackDialog}>
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
                      <Link href={`/${lang}/tracking`}>{dictionary.goToToday}</Link>
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <CardTitle className="font-headline">{displayDate}</CardTitle>
          </div>
          <CardDescription>
            { user ? dictionary.description : dictionary.loginPrompt }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-medium text-sm">
                    {currentMood ? `${dictionary.feeling}: ${dictionary.moods[currentMood.toLowerCase()]}` : dictionary.howFeeling}
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
                        <span className="ml-2">{dictionary.moods[option.labelKey]}</span>
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
                    {dictionary.addFoodLabel}
                  </label>
                  <div className="flex gap-2 relative" ref={containerRef}>
                     <Input
                      id="food-input"
                      name="food"
                      placeholder={dictionary.foodPlaceholder}
                      className="flex-grow"
                      required
                      disabled={isPending}
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" aria-label={dictionary.addFoodAria} disabled={isPending}>
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
                <h3 className="font-semibold text-sm">{dictionary.loggedFoods}</h3>

                {loggedFoods && loggedFoods.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button variant={sortKey === 'calories' ? 'secondary' : 'outline'} className="h-auto p-3 flex justify-start items-center gap-3 bg-chart-1/10 border-chart-1/20 hover:bg-chart-1/20" onClick={() => handleSort('calories')}>
                        {renderSortIcon('calories')}
                        <Sparkles className="h-5 w-5 text-chart-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.nutrients.calories}</p>
                          <p className="font-bold">{nutrientTotals.calories.toFixed(0)}</p>
                        </div>
                      </Button>
                      <Button variant={sortKey === 'carbs' ? 'secondary' : 'outline'} className="h-auto p-3 flex justify-start items-center gap-3 bg-chart-2/10 border-chart-2/20 hover:bg-chart-2/20" onClick={() => handleSort('carbs')}>
                        {renderSortIcon('carbs')}
                        <Flame className="h-5 w-5 text-chart-2" />
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.nutrients.carbs}</p>
                          <p className="font-bold">{nutrientTotals.carbs.toFixed(0)}g</p>
                        </div>
                      </Button>
                      <Button variant={sortKey === 'proteins' ? 'secondary' : 'outline'} className="h-auto p-3 flex justify-start items-center gap-3 bg-chart-3/10 border-chart-3/20 hover:bg-chart-3/20" onClick={() => handleSort('proteins')}>
                        {renderSortIcon('proteins')}
                        <Beef className="h-5 w-5 text-chart-3" />
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.nutrients.protein}</p>
                          <p className="font-bold">{nutrientTotals.proteins.toFixed(0)}g</p>
                        </div>
                      </Button>
                      <Button variant={sortKey === 'fats' ? 'secondary' : 'outline'} className="h-auto p-3 flex justify-start items-center gap-3 bg-chart-4/10 border-chart-4/20 hover:bg-chart-4/20" onClick={() => handleSort('fats')}>
                         {renderSortIcon('fats')}
                        <Droplet className="h-5 w-5 text-chart-4" />
                        <div>
                          <p className="text-xs text-muted-foreground">{dictionary.nutrients.fat}</p>
                          <p className="font-bold">{nutrientTotals.fats.toFixed(0)}g</p>
                        </div>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {sortedLoggedFoods.map(({food, quantity}) => (
                        <Card key={food.id} className="shadow-sm">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 overflow-hidden flex-1">
                              <div className="bg-primary/20 text-primary p-2 rounded-full">
                                  <FoodIcon iconName={food.icon} className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium truncate">{food.name}</p>
                                  {food.description && (
                                    <Popover>
                                      <PopoverTrigger>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                                      </PopoverTrigger>
                                      <PopoverContent className="text-sm max-w-xs text-center">
                                        {food.description}
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                {(food.portion != null && (food.calories != null || food.carbs != null || food.proteins != null || food.fats != null)) ? (
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1" title={dictionary.nutrients.calories}>
                                      <Sparkles className="h-3 w-3 text-chart-1" />
                                      <span>{food.calories?.toFixed(0) ?? '–'}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title={dictionary.nutrients.carbs}>
                                      <Flame className="h-3 w-3 text-chart-2" />
                                      <span>{food.carbs?.toFixed(0) ?? '–'}g</span>
                                    </div>
                                    <div className="flex items-center gap-1" title={dictionary.nutrients.protein}>
                                      <Beef className="h-3 w-3 text-chart-3" />
                                      <span>{food.proteins?.toFixed(0) ?? '–'}g</span>
                                    </div>
                                    <div className="flex items-center gap-1" title={dictionary.nutrients.fat}>
                                      <Droplet className="h-3 w-3 text-chart-4" />
                                      <span>{food.fats?.toFixed(0) ?? '–'}g</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-primary/80" title={dictionary.totalPortion}>
                                        <span>
                                            {quantity > 1 ? `${quantity}x${food.portion}g` : `${food.portion}g`}
                                        </span>
                                    </div>
                                  </div>
                                ) : <div className="h-4" /> /* Placeholder for height consistency */
                                }
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(food, -1)}
                                disabled={isPending}
                                aria-label={`${dictionary.decreaseAria} ${food.name}`}
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
                                aria-label={`${dictionary.increaseAria} ${food.name}`}
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
                              aria-label={`${dictionary.deleteAria} ${food.name}`}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground text-sm p-4 bg-background/50 border rounded-md">
                    <p>{dictionary.noFoodLogged}</p>
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
