
"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { updateUserPlan } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/types";

type PlanName = UserProfile["plan"];

const plans: {
  name: PlanName;
  price: string;
  pricePeriod: string;
  description: string;
  features: string[];
  isPopular: boolean;
}[] = [
  {
    name: "Monthly",
    price: "$10",
    pricePeriod: "/month",
    description: "Get started with our basic features.",
    features: [
      "Unlimited daily logs",
      "Advanced mood analysis",
      "Export your data",
    ],
    isPopular: false,
  },
  {
    name: "Yearly",
    price: "$100",
    pricePeriod: "/year",
    description: "Save 20% and unlock all features.",
    features: [
      "All features from the Monthly plan",
      "AI-powered meal suggestions",
      "Priority support",
    ],
    isPopular: true,
  },
];

export default function PremiumPage() {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, setIsPending] = useState<PlanName | null>(null);

  const handleChoosePlan = async (planName: PlanName) => {
    if (!user || !firestore) return;

    if (user.plan === planName) {
      toast({
        title: "You are already on this plan.",
      });
      return;
    }

    setIsPending(planName);

    try {
      await updateUserPlan(firestore, user.uid, planName);
      toast({
        title: "Plan updated!",
        description: `You are now on the ${planName} plan.`,
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not update your plan.",
      });
    } finally {
      setIsPending(null);
    }
  };

  const isLoading = userLoading || !!isPending;

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <Link
          href="/"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">
          Choose Your Plan
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
          Unlock powerful features to supercharge your health journey.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex flex-col",
              plan.isPopular && "border-primary ring-2 ring-primary",
              user?.plan === plan.name && "bg-muted"
            )}
          >
            {plan.isPopular && (
              <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold rounded-t-lg">
                Most Popular
              </div>
            )}
            <CardHeader className="items-center text-center">
              <CardTitle className="text-2xl font-headline">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-center mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.pricePeriod}</span>
              </div>
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.isPopular ? "default" : "outline"}
                onClick={() => handleChoosePlan(plan.name)}
                disabled={isLoading}
              >
                {user?.plan === plan.name
                  ? "Current Plan"
                  : isPending === plan.name
                  ? "Choosing..."
                  : "Choose Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
