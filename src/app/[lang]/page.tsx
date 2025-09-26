
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { WelcomePage } from "@/components/WelcomePage";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendedIntake } from "@/components/RecommendedIntake";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DailyEntry } from "@/lib/types";
import { useFirestore } from "@/firebase/provider";
import { getAllEntries } from "@/lib/data";
import { IntakeChart } from "@/components/IntakeChart";
import { cn } from "@/lib/utils";
import { addDays, differenceInCalendarDays, endOfDay, format, startOfDay } from "date-fns";
import { AddToHomeScreenPrompt } from "@/components/AddToHomeScreenPrompt";
import { useParams } from "next/navigation";

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const params = useParams();
  const lang = params.lang;

  const profileComplete = !!(
    user?.height &&
    user?.weight &&
    user?.age &&
    user?.gender &&
    user?.activityLevel
  );

  useEffect(() => {
    if (user && firestore) {
      setEntriesLoading(true);
      getAllEntries(firestore, user.uid)
        .then(setAllEntries)
        .finally(() => setEntriesLoading(false));
    } else if (!userLoading) {
      setEntriesLoading(false);
    }
  }, [user, firestore, userLoading]);

  const streakData = useMemo(() => {
    if (!user?.createdAt || allEntries.length === 0) {
      return { streak: 0, days: Array(9).fill({ filled: false, isToday: false }) };
    }
  
    const today = endOfDay(new Date());
    const createdAt = startOfDay(user.createdAt);
    const totalDaysSinceSignup = differenceInCalendarDays(today, createdAt) + 1;
    const daysToCheck = Math.min(9, totalDaysSinceSignup);
  
    let currentStreak = 0;
    let streakEnded = false;
  
    const days = Array.from({ length: 9 }, (_, i) => {
      const date = addDays(today, i - (9 - 1));
      
      // Don't check future dates or dates before account creation
      if (date > today || date < createdAt) {
        return { date, filled: false, isToday: false };
      }
      
      const dateString = format(date, 'yyyy-MM-dd');
      const entry = allEntries.find(e => e.date === dateString);
      const isFilled = !!(entry && entry.mood && entry.foods.length > 0);
  
      if (!streakEnded && isFilled) {
        currentStreak++;
      } else if (!streakEnded && !isFilled) {
        // Allow for today to be incomplete without breaking streak
        if (!isSameDay(date, today)) {
          streakEnded = true;
          currentStreak = 0; // Reset if a past day is missed
        }
      }
      
      return { date, filled: isFilled, isToday: isSameDay(date, today) };
    });
  
    // Recalculate streak from the last day backwards
    let finalStreak = 0;
    let continuous = true;
    [...days].reverse().forEach(day => {
      if (continuous) {
        if (day.filled) {
          finalStreak++;
        } else if (!day.isToday) { // An empty past day breaks the streak
          continuous = false;
        }
      }
    });
  
    return { streak: finalStreak, days };
  
  }, [allEntries, user?.createdAt]);
  
  function isSameDay(d1: Date, d2: Date) {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  }


  const isLoading = userLoading || entriesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-8 p-4 md:p-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.displayName || 'User'}!</CardTitle>
          <CardDescription>
            Here's an overview of your journey with Nutrack9.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Flame className={cn("h-7 w-7", streakData.streak > 0 ? "text-primary" : "text-muted-foreground")} />
              <span>{streakData.streak} Day Streak</span>
            </div>
            <div className="flex gap-1">
              {streakData.days.map((day, index) => (
                <div key={index} className={cn(
                  "h-5 w-5 rounded-full",
                  day.filled ? "bg-primary/80" : "bg-muted",
                  day.isToday && !day.filled && "animate-pulse bg-primary/50"
                )} title={day.date ? format(day.date, 'MMM d') : ''} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AddToHomeScreenPrompt />

      {profileComplete ? (
        <>
          <RecommendedIntake userProfile={user} />
          {allEntries.length > 1 ? (
            <IntakeChart userProfile={user} entries={allEntries} />
          ) : (
             <Card>
              <CardHeader>
                <CardTitle>Start Your Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {allEntries.length > 0 ? "Log at least one more day to see your progress chart." : "You haven't logged any food yet. Go to the Tracking page to start your first log and see your progress here!"}
                </p>
              </CardContent>
              <CardFooter>
                 <Button asChild>
                    <Link href={`/${lang}/tracking`}>
                      Go to Tracking
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
              </CardFooter>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get Personalized Recommendations</CardTitle>
            <CardDescription>
              Fill out your personal information to unlock daily nutritional goals tailored just for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              By providing your height, weight, age, gender, and activity level, we can estimate your daily calorie and macronutrient needs to help you reach your goals.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={`/${lang}/settings`}>
                Go to Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
