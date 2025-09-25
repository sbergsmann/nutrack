
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { WelcomePage } from "@/components/WelcomePage";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  
  if (userLoading) {
    return (
      <div className="container mx-auto space-y-8 p-4 md:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
        <Card className="mt-6">
        <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            This is your new dashboard. More features and insights will be
            available here soon!
            </p>
        </CardContent>
        </Card>
    </div>
  );
}
