
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { WelcomePage } from "@/components/WelcomePage";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendedIntake } from "@/components/RecommendedIntake";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { DailyEntry } from "@/lib/types";
import { useFirestore } from "@/firebase/provider";
import { getAllEntries } from "@/lib/data";
import { IntakeChart } from "@/components/IntakeChart";

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

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
      </Card>
      
      {profileComplete ? (
        <>
          <RecommendedIntake userProfile={user} />
          {allEntries.length > 0 ? (
            <IntakeChart userProfile={user} entries={allEntries} />
          ) : (
             <Card>
              <CardHeader>
                <CardTitle>Start Your Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You haven't logged any food yet. Go to the Tracking page to start your first log and see your progress here!
                </p>
              </CardContent>
              <CardFooter>
                 <Button asChild>
                    <Link href="/tracking">
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
              <Link href="/settings">
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
