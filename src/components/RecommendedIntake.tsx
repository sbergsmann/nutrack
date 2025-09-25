
"use client"

import { useMemo } from "react";
import type { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Beef, Droplet, Flame, Info, Sparkles } from "lucide-react";

type RecommendedIntakeProps = {
    userProfile: Partial<UserProfile>;
};

export function RecommendedIntake({ userProfile }: RecommendedIntakeProps) {
  
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

  if (!nutritionGoals) {
    return null;
  }
  
  return (
     <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recommended Daily Intake
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-center">
                        <p>These are estimated ranges based on the Mifflin-St Jeor formula for BMR and standard activity multipliers. Your individual needs may vary.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Based on your information, here are your estimated daily nutritional goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                    <p className="text-sm text-muted-foreground">Calories</p>
                    <p className="font-bold text-lg">{nutritionGoals.calories.min} - {nutritionGoals.calories.max}</p>
                  </div>
                  <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <Flame className="h-6 w-6 text-orange-400" />
                    <p className="text-sm text-muted-foreground">Carbs</p>
                    <p className="font-bold text-lg">{nutritionGoals.carbs.min} - {nutritionGoals.carbs.max}g</p>
                  </div>
                  <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <Beef className="h-6 w-6 text-red-400" />
                    <p className="text-sm text-muted-foreground">Protein</p>
                    <p className="font-bold text-lg">{nutritionGoals.proteins.min} - {nutritionGoals.proteins.max}g</p>
                  </div>
                  <div className="h-auto p-4 flex flex-col justify-start items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <Droplet className="h-6 w-6 text-yellow-400" />
                    <p className="text-sm text-muted-foreground">Fat</p>
                    <p className="font-bold text-lg">{nutritionGoals.fats.min} - {nutritionGoals.fats.max}g</p>
                  </div>
            </div>
        </CardContent>
      </Card>
  )
}
