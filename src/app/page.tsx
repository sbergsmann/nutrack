
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { WelcomePage } from "@/components/WelcomePage";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendedIntake } from "@/components/RecommendedIntake";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();

  const profileComplete = !!(
    user?.height &&
    user?.weight &&
    user?.age &&
    user?.gender &&
    user?.activityLevel
  );

  if (userLoading) {
    return (
      <div className="container mx-auto space-y-8 p-4 md:p-8">
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
        <RecommendedIntake userProfile={user} />
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
