
"use client";

import { useMemo, useState } from "react";
import type { DailyEntry } from "@/lib/types";
import { addDays, isAfter, startOfToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FoodIcon from "./FoodIcon";
import { ChevronDown, ChevronUp, Package, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AggregatedFood = {
  name: string;
  quantity: number;
  icon?: string;
  type?: "grocery" | "meal";
};

type FilterType = "all" | "meal" | "grocery";

export function AggregatedFoodLogs({ entries, dictionary }: { entries: DailyEntry[], dictionary: any }) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const aggregatedFoods = useMemo(() => {
    const nineDaysAgo = addDays(startOfToday(), -8);
    const foodMap = new Map<string, AggregatedFood>();

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      if (isAfter(entryDate, nineDaysAgo) || entryDate.getTime() === nineDaysAgo.getTime()) {
        for (const loggedFood of entry.foods) {
          const { food, quantity } = loggedFood;
          if (foodMap.has(food.id)) {
            const existing = foodMap.get(food.id)!;
            existing.quantity += quantity;
          } else {
            foodMap.set(food.id, {
              name: food.name,
              quantity: quantity,
              icon: food.icon,
              type: food.type,
            });
          }
        }
      }
    }
    
    return Array.from(foodMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [entries]);

  const filteredFoods = useMemo(() => {
    if (filter === "all") {
      return aggregatedFoods;
    }
    return aggregatedFoods.filter(food => food.type === filter);
  }, [aggregatedFoods, filter]);

  if (aggregatedFoods.length === 0) {
    return null;
  }

  const itemsToShow = showAll ? filteredFoods : filteredFoods.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">{dictionary.filters.all}</TabsTrigger>
            <TabsTrigger value="meal">{dictionary.filters.meals}</TabsTrigger>
            <TabsTrigger value="grocery">{dictionary.filters.groceries}</TabsTrigger>
          </TabsList>
          <div className="space-y-4 mt-4">
            {itemsToShow.length > 0 ? (
              <ul className="space-y-3">
                {itemsToShow.map((food, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/20 text-primary p-2 rounded-full">
                        <FoodIcon iconName={food.icon} className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{food.name}</span>
                          {food.type === 'grocery' && <Package className="h-4 w-4 text-muted-foreground" title={dictionary.foodTypes?.grocery}/>}
                          {food.type === 'meal' && <UtensilsCrossed className="h-4 w-4 text-muted-foreground" title={dictionary.foodTypes?.meal} />}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      x{food.quantity}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
                <p className="text-center text-sm text-muted-foreground p-4">{dictionary.noItemsFound}</p>
            )}
            {filteredFoods.length > 5 && (
              <Button variant="ghost" onClick={() => setShowAll(!showAll)} className="w-full">
                {showAll ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    {dictionary.showLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {dictionary.showMore}
                  </>
                )}
              </Button>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
