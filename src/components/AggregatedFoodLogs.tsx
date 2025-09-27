
"use client";

import { useMemo, useState } from "react";
import type { DailyEntry, LoggedFood } from "@/lib/types";
import { addDays, isAfter, startOfToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FoodIcon from "./FoodIcon";
import { ChevronDown, ChevronUp } from "lucide-react";

type AggregatedFood = {
  name: string;
  quantity: number;
  icon?: string;
};

export function AggregatedFoodLogs({ entries, dictionary }: { entries: DailyEntry[], dictionary: any }) {
  const [showAll, setShowAll] = useState(false);

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
            });
          }
        }
      }
    }

    return Array.from(foodMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [entries]);

  if (aggregatedFoods.length === 0) {
    return null;
  }

  const itemsToShow = showAll ? aggregatedFoods : aggregatedFoods.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {itemsToShow.length > 0 ? (
          <div className="space-y-4">
            <ul className="space-y-3">
              {itemsToShow.map((food, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 text-primary p-2 rounded-full">
                      <FoodIcon iconName={food.icon} className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">{food.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    x{food.quantity}
                  </div>
                </li>
              ))}
            </ul>
            {aggregatedFoods.length > 5 && (
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
        ) : (
          <p className="text-sm text-muted-foreground">{dictionary.noRecentFoods}</p>
        )}
      </CardContent>
    </Card>
  );
}
