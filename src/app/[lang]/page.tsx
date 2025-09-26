
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
import { getDictionary } from "@/lib/get-dictionary";

function HomePageClient({ dictionary }: { dictionary: any }) {
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
    return <WelcomePage dictionary={dictionary.welcome} />;
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.dashboard.welcomeTitle}, {user.displayName || 'User'}!</CardTitle>
          <CardDescription>
            {dictionary.dashboard.welcomeDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Flame className={cn("h-7 w-7", streakData.streak > 0 ? "text-primary" : "text-muted-foreground")} />
              <span>{streakData.streak} {dictionary.dashboard.dayStreak}</span>
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
      
      <AddToHomeScreenPrompt dictionary={dictionary.a2hs} />

      {profileComplete ? (
        <>
          <RecommendedIntake userProfile={user} dictionary={dictionary.recommendedIntake} />
          {allEntries.length > 1 ? (
            <IntakeChart userProfile={user} entries={allEntries} dictionary={dictionary.intakeChart} />
          ) : (
             <Card>
              <CardHeader>
                <CardTitle>{dictionary.dashboard.startJourneyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {allEntries.length > 0 ? dictionary.dashboard.logOneMoreDay : dictionary.dashboard.noLogsYet}
                </p>
              </CardContent>
              <CardFooter>
                 <Button asChild>
                    <Link href={`/${lang}/tracking`}>
                      {dictionary.dashboard.goToTracking}
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
            <CardTitle>{dictionary.dashboard.getPersonalizedTitle}</CardTitle>
            <CardDescription>
              {dictionary.dashboard.getPersonalizedDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {dictionary.dashboard.getPersonalizedContent}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={`/${lang}/settings`}>
                {dictionary.dashboard.goToSettings}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default async function HomePage({ params }: { params: { lang: string } }) {
  const dictionary = await getDictionary(params.lang as any);
  return <HomePageClient dictionary={dictionary} />;
}

    