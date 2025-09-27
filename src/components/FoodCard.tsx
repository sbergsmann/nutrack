
"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash, Sparkles, Flame, Beef, Droplet, Package, UtensilsCrossed, Info } from "lucide-react";
import FoodIcon from "./FoodIcon";
import type { FoodItem } from "@/lib/types";

export function FoodCard({
  food,
  quantity,
  isPending,
  onQuantityChange,
  onDelete,
  dictionary,
}: {
  food: FoodItem;
  quantity: number;
  isPending: boolean;
  onQuantityChange: (food: FoodItem, change: 1 | -1) => void;
  onDelete: (foodId: string) => void;
  dictionary: any;
}) {
  return (
    <Popover>
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <PopoverTrigger asChild>
            <div className="flex items-center gap-4 overflow-hidden flex-1 cursor-pointer">
              <div className="bg-primary/20 text-primary p-2 rounded-full">
                <FoodIcon iconName={food.icon} className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{food.name}</p>
                  {food.type === 'grocery' && <Package className="h-4 w-4 text-muted-foreground shrink-0" title={dictionary.foodTypes.grocery} />}
                  {food.type === 'meal' && <UtensilsCrossed className="h-4 w-4 text-muted-foreground shrink-0" title={dictionary.foodTypes.meal} />}
                  <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1" title={dictionary.nutrients.calories}>
                    <Sparkles className="h-3 w-3 text-chart-1" />
                    <span>{(food.calories ?? 0) * quantity}</span>
                  </div>
                  <div className="flex items-center gap-1" title={dictionary.nutrients.carbs}>
                    <Flame className="h-3 w-3 text-chart-2" />
                    <span>{(food.carbs ?? 0) * quantity}g</span>
                  </div>
                  <div className="flex items-center gap-1" title={dictionary.nutrients.protein}>
                    <Beef className="h-3 w-3 text-chart-3" />
                    <span>{(food.proteins ?? 0) * quantity}g</span>
                  </div>
                  <div className="flex items-center gap-1" title={dictionary.nutrients.fat}>
                    <Droplet className="h-3 w-3 text-chart-4" />
                    <span>{(food.fats ?? 0) * quantity}g</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onQuantityChange(food, -1); }}
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
              onClick={(e) => { e.stopPropagation(); onQuantityChange(food, 1); }}
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
            onClick={(e) => { e.stopPropagation(); onDelete(food.id); }}
            disabled={isPending}
            aria-label={`${dictionary.deleteAria} ${food.name}`}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      <PopoverContent className="text-sm max-w-xs w-auto">
        <div className="space-y-3">
          <div>
            <h4 className="font-bold">{food.name}</h4>
            {food.type && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {food.type === 'grocery' && <Package className="h-4 w-4 shrink-0" />}
                    {food.type === 'meal' && <UtensilsCrossed className="h-4 w-4 shrink-0" />}
                    <span>{dictionary.foodTypes?.[food.type] ?? food.type}</span>
                </div>
            )}
            {food.description && <p className="text-muted-foreground text-xs mt-2">{food.description}</p>}
          </div>
          {food.portion && (
            <div className="space-y-2 text-xs">
              <p className="font-medium">{dictionary.nutrients.perPortion} ({food.portion}g)</p>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1" title={dictionary.nutrients.calories}>
                  <Sparkles className="h-3 w-3 text-chart-1" />
                  <span>{food.calories?.toFixed(0) ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1" title={dictionary.nutrients.carbs}>
                  <Flame className="h-3 w-3 text-chart-2" />
                  <span>{food.carbs?.toFixed(0) ?? 'N/A'}g</span>
                </div>
                <div className="flex items-center gap-1" title={dictionary.nutrients.protein}>
                  <Beef className="h-3 w-3 text-chart-3" />
                  <span>{food.proteins?.toFixed(0) ?? 'N/A'}g</span>
                </div>
                <div className="flex items-center gap-1" title={dictionary.nutrients.fat}>
                  <Droplet className="h-3 w-3 text-chart-4" />
                  <span>{food.fats?.toFixed(0) ?? 'N/A'}g</span>
                </div>
              </div>
            </div>
          )}
          {quantity > 1 && (
            <div className="space-y-2 text-xs border-t pt-2">
              <p className="font-medium">{dictionary.totalPortion} ({quantity}x)</p>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1" title={dictionary.nutrients.calories}>
                  <Sparkles className="h-3 w-3 text-chart-1" />
                  <span>{((food.calories ?? 0) * quantity).toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1" title={dictionary.nutrients.carbs}>
                  <Flame className="h-3 w-3 text-chart-2" />
                  <span>{((food.carbs ?? 0) * quantity).toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1" title={dictionary.nutrients.protein}>
                  <Beef className="h-3 w-3 text-chart-3" />
                  <span>{((food.proteins ?? 0) * quantity).toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1" title={dictionary.nutrients.fat}>
                  <Droplet className="h-3 w-3 text-chart-4" />
                  <span>{((food.fats ?? 0) * quantity).toFixed(0)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
