
"use client"

import { useMemo, useState } from "react";
import type { UserProfile, DailyEntry } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposedChart, Area, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, parseISO } from "date-fns";
import { Beef, Droplet, Flame, Sparkles } from "lucide-react";

type IntakeChartProps = {
  userProfile: UserProfile;
  entries: DailyEntry[];
  dictionary: any;
};

type ChartData = {
  date: string;
  actual: number;
  recommended: [number, number];
};

type NutrientKey = "calories" | "carbs" | "proteins" | "fats";


const CustomTooltip = ({ active, payload, label, unit, dictionary }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background/80 backdrop-blur-sm p-3 border rounded-md shadow-sm">
        <p className="font-bold">{label}</p>
        <p style={{ color: payload.find(p => p.dataKey === 'actual')?.stroke }}>
          {dictionary.actual}: {data.actual.toFixed(0)} {unit}
        </p>
        <p style={{ color: payload.find(p => p.dataKey === 'recommended')?.stroke }}>
          {dictionary.recommended}: {data.recommended[0].toFixed(0)} - {data.recommended[1].toFixed(0)} {unit}
        </p>
      </div>
    );
  }
  return null;
};


export function IntakeChart({ userProfile, entries, dictionary }: IntakeChartProps) {
  const [activeNutrient, setActiveNutrient] = useState<NutrientKey>("calories");

  const nutrientConfig = {
    calories: { label: dictionary.nutrients.calories, icon: Sparkles, unit: "", color: "hsl(var(--chart-1))" },
    carbs: { label: dictionary.nutrients.carbs, icon: Flame, unit: "g", color: "hsl(var(--chart-2))" },
    proteins: { label: dictionary.nutrients.protein, icon: Beef, unit: "g", color: "hsl(var(--chart-3))" },
    fats: { label: dictionary.nutrients.fat, icon: Droplet, unit: "g", color: "hsl(var(--chart-4))" },
  };

  const { nutritionGoals, chartData } = useMemo(() => {
    const { height, weight, age, gender, activityLevel } = userProfile;
    if (!height || !weight || !age || !gender || !activityLevel) {
      return { nutritionGoals: null, chartData: {} };
    }

    let bmr: number;
    if (gender === 'Male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender === 'Female') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
      const bmrMale = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      const bmrFemale = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      bmr = (bmrMale + bmrFemale) / 2;
    }
    
    const activityFactors = {
      'Sedentary': 1.2, 'Lightly active': 1.375, 'Moderately active': 1.55,
      'Very active': 1.725, 'Extra active': 1.9,
    };
    const tdee = bmr * activityFactors[activityLevel];

    const goals = {
      calories: { min: Math.round(tdee - 200), max: Math.round(tdee + 200) },
      carbs: { min: Math.round((tdee * 0.45) / 4), max: Math.round((tdee * 0.65) / 4) },
      proteins: { min: Math.round(weight * 0.8), max: Math.round(weight * 1.8) },
      fats: { min: Math.round((tdee * 0.20) / 9), max: Math.round((tdee * 0.35) / 9) },
    };

    const nutrientTotalsByDate = entries.reduce((acc, entry) => {
      if (entry.foods.length > 0) {
        const totals = entry.foods.reduce((totals, { food, quantity }) => {
          totals.calories += (food.calories ?? 0) * quantity;
          totals.carbs += (food.carbs ?? 0) * quantity;
          totals.proteins += (food.proteins ?? 0) * quantity;
          totals.fats += (food.fats ?? 0) * quantity;
          return totals;
        }, { calories: 0, carbs: 0, proteins: 0, fats: 0 });
        acc[entry.date] = totals;
      }
      return acc;
    }, {} as Record<string, Record<NutrientKey, number>>);

    const data: Record<NutrientKey, ChartData[]> = {
      calories: [], carbs: [], proteins: [], fats: []
    };

    const sortedDates = Object.keys(nutrientTotalsByDate).sort((a,b) => parseISO(a).getTime() - parseISO(b).getTime());

    sortedDates.forEach(date => {
      (Object.keys(goals) as NutrientKey[]).forEach(nutrient => {
        data[nutrient].push({
          date: format(parseISO(date), "MMM d"),
          actual: nutrientTotalsByDate[date]?.[nutrient] ?? 0,
          recommended: [goals[nutrient].min, goals[nutrient].max],
        });
      });
    });
    
    return { nutritionGoals: goals, chartData: data };
  }, [userProfile, entries]);

  if (!nutritionGoals || !chartData[activeNutrient] || chartData[activeNutrient].length < 2) {
    return null;
  }
  
  const currentData = chartData[activeNutrient];
  const { icon: Icon, unit } = nutrientConfig[activeNutrient];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>
          {dictionary.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeNutrient} onValueChange={(value) => setActiveNutrient(value as NutrientKey)} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            {Object.entries(nutrientConfig).map(([key, { label, icon: TabIcon }]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <TabIcon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(nutrientConfig) as NutrientKey[]).map(key => (
            <TabsContent key={key} value={key} className="h-[400px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData[key]}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                            tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                            domain={['dataMin - 20', 'dataMax + 20']}
                        />
                        <Tooltip content={<CustomTooltip unit={nutrientConfig[key].unit} dictionary={dictionary.tooltip} />} />
                        <Area 
                            type="monotone" 
                            dataKey="recommended" 
                            stroke={nutrientConfig[key].color} 
                            fill={nutrientConfig[key].color} 
                            fillOpacity={0.2}
                            strokeOpacity={0.4}
                            strokeDasharray="5 5"
                            name={dictionary.legend.recommended}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke={nutrientConfig[key].color}
                            strokeWidth={2}
                            name={dictionary.legend.actual}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
