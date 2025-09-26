
"use client"

import { useMemo } from "react";
import type { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Beef, Droplet, Flame, Info, Sparkles } from "lucide-react";

type RecommendedIntakeProps = {
    userProfile: Partial<UserProfile>;
    dictionary: any;
};

export function RecommendedIntake({ userProfile, dictionary }: RecommendedIntakeProps) {
  
  const nutritionGoals = useMemo(() => {
    const { height, weight, age, gender, activityLevel } = userProfile;
    if (!height || !weight || !age || !gender || !activityLevel) {
      return null;
    }

    let bmr: number;
    if (gender === 'Male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender === 'Female') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else { // 'Other'
        // Averaging male and female formulas
        const bmrMale = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        const bmrFemale = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        bmr = (bmrMale + bmrFemale) / 2;
    }
    
    const activityFactors: Record<typeof activityLevel, number> = {
        'Sedentary': 1.2,
        'Lightly active': 1.375,
        'Moderately active': 1.55,
        'Very active': 1.725,
        'Extra active': 1.9,
    };
    const tdee = bmr * activityFactors[activityLevel];

    return {
        calories: { min: Math.round(tdee - 100), max: Math.round(tdee + 100) },
        carbs: { min: Math.round((tdee * 0.45) / 4), max: Math.round((tdee * 0.65) / 4) },
        proteins: { min: Math.round(weight * 0.8), max: Math.round(weight * 2.0) },
        fats: { min: Math.round((tdee * 0.20) / 9), max: Math.round((tdee * 0.35) / 9) },
    };
  }, [userProfile]);

  if (!nutritionGoals || !dictionary) {
    return null;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dictionary.title}
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              {dictionary.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-chart-1/10 border border-chart-1/20 rounded-lg">
                      <Sparkles className="h-6 w-6 text-chart-1" />
                      <p className="text-sm text-muted-foreground">{dictionary.nutrients.calories}</p>
                      <p className="font-bold text-lg">{nutritionGoals.calories.min} - {nutritionGoals.calories.max}</p>
                    </div>
                    <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-chart-2/10 border border-chart-2/20 rounded-lg">
                      <Flame className="h-6 w-6 text-chart-2" />
                      <p className="text-sm text-muted-foreground">{dictionary.nutrients.carbs}</p>
                      <p className="font-bold text-lg">{nutritionGoals.carbs.min} - {nutritionGoals.carbs.max}g</p>
                    </div>
                    <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-chart-3/10 border border-chart-3/20 rounded-lg">
                      <Beef className="h-6 w-6 text-chart-3" />
                      <p className="text-sm text-muted-foreground">{dictionary.nutrients.protein}</p>
                      <p className="font-bold text-lg">{nutritionGoals.proteins.min} - {nutritionGoals.proteins.max}g</p>
                    </div>
                    <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-chart-4/10 border border-chart-4/20 rounded-lg">
                      <Droplet className="h-6 w-6 text-chart-4" />
                      <p className="text-sm text-muted-foreground">{dictionary.nutrients.fat}</p>
                      <p className="font-bold text-lg">{nutritionGoals.fats.min} - {nutritionGoals.fats.max}g</p>
                    </div>
              </div>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-center text-sm">
        <p>{dictionary.infoPopover}</p>
      </PopoverContent>
    </Popover>
  )
}
