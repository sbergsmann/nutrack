
"use client";

import { ArrowLeft, Beef, Droplet, Flame, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase/provider";
import { updateUserProfile } from "@/lib/data";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/lib/types";

const activityLevels: UserProfile['activityLevel'][] = ["Sedentary", "Lightly active", "Moderately active", "Very active", "Extra active"];

const profileFormSchema = z.object({
  height: z.preprocess(
    (a) => (a === "" || a === null ? undefined : parseFloat(String(a))),
    z.number({ invalid_type_error: "Must be a number" }).positive().optional().nullable()
  ),
  weight: z.preprocess(
    (a) => (a === "" || a === null ? undefined : parseFloat(String(a))),
    z.number({ invalid_type_error: "Must be a number" }).positive().optional().nullable()
  ),
  age: z.preprocess(
    (a) => (a === "" || a === null ? undefined : parseInt(String(a), 10)),
    z.number({ invalid_type_error: "Must be a number" }).positive().int().optional().nullable()
  ),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  activityLevel: z.enum(["Sedentary", "Lightly active", "Moderately active", "Very active", "Extra active"]).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      height: undefined,
      weight: undefined,
      age: undefined,
      gender: undefined,
      activityLevel: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        height: user.height || null,
        weight: user.weight || null,
        age: user.age || null,
        gender: user.gender || null,
        activityLevel: user.activityLevel || null,
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      const updateData = {
        height: data.height === undefined ? null : data.height,
        weight: data.weight === undefined ? null : data.weight,
        age: data.age === undefined ? null : data.age,
        gender: data.gender === undefined ? null : data.gender,
        activityLevel: data.activityLevel === undefined ? null : data.activityLevel,
      };
      await updateUserProfile(firestore, user.uid, updateData);
      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not save your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      await updateUserProfile(firestore, user.uid, { height: null, weight: null, age: null, gender: null, activityLevel: null });
      form.reset({ height: null, weight: null, age: null, gender: null, activityLevel: null });
      toast({
        title: "Profile cleared",
        description: "Your personal information has been removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not clear your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const appVersion = "0.1.0";
  const hasMeasurements = !!(user?.height || user?.weight || user?.age || user?.gender || user?.activityLevel);

  const nutritionGoals = useMemo(() => {
    const { height, weight, age, gender, activityLevel } = form.getValues();
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
}, [form.watch()]);

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <Link
          href="/"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">
            Settings
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
            Manage your account and application settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Provide this information to get personalized daily nutritional recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 175"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 70"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 30"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value ?? undefined}
                            value={field.value ?? undefined}
                           >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="md:col-span-2">
                        <FormField
                        control={form.control}
                        name="activityLevel"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Activity Level</FormLabel>
                            <Select 
                                onValueChange={field.onChange}
                                defaultValue={field.value ?? undefined}
                                value={field.value ?? undefined}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your activity level" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {activityLevels.map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      disabled={isSaving || (!hasMeasurements && !form.formState.isDirty)}
                    >
                      {isSaving ? "Clearing..." : "Clear All"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {nutritionGoals && (
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
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Version {appVersion}</p>
        </div>
      </div>
    </div>
  );
}
