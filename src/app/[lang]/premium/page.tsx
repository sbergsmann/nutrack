
"use client";

import { Check, StarIcon } from "lucide-react";
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
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "@/lib/types";
import { getDictionary } from "@/lib/get-dictionary";
import { Skeleton } from "@/components/ui/skeleton";

type PlanName = UserProfile["plan"];

export default function PremiumPage({ dictionary }: { dictionary: any }) {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang;
  const [isPending, setIsPending] = useState<PlanName | null>(null);

  const plans: {
    name: PlanName;
    price: string;
    pricePeriod: string;
    description: string;
    features: string[];
    isPopular: boolean;
  }[] = [
    {
      name: "Basic",
      price: dictionary?.basic.price ?? "Free",
      pricePeriod: "",
      description: dictionary?.basic.description ?? "The essentials for getting started.",
      features: dictionary?.basic.features ?? [
          "Daily food and mood logging",
          "Calendar view",
          "Basic food suggestions"
      ],
      isPopular: false,
    },
    {
      name: "Monthly",
      price: "$10",
      pricePeriod: dictionary?.monthly.pricePeriod ?? "/month",
      description: dictionary?.monthly.description ?? "Unlock advanced insights.",
      features: dictionary?.monthly.features ?? [
        "Unlimited daily logs",
        "Advanced mood analysis",
        "Export your data",
      ],
      isPopular: false,
    },
    {
      name: "Yearly",
      price: "$100",
      pricePeriod: dictionary?.yearly.pricePeriod ?? "/year",
      description: dictionary?.yearly.description ?? "Save 20% and get all features.",
      features: dictionary?.yearly.features ?? [
        "All features from the Monthly plan",
        "AI-powered meal suggestions",
        "Priority support",
      ],
      isPopular: true,
    },
  ];

  const handleChoosePlan = async (planName: PlanName) => {
    if (!user || !firestore) return;
    setIsPending(planName);

    try {
      await updateUserPlan(firestore, user.uid, planName);
      toast({
        title: dictionary.toasts.planUpdated.title,
        description: `${dictionary.toasts.planUpdated.description} ${planName}.`,
      });
      router.push(`/${lang}/`);
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast({
        variant: "destructive",
        title: dictionary.toasts.error.title,
        description: dictionary.toasts.error.planUpdate,
      });
    } finally {
      setIsPending(null);
    }
  };

  if (!dictionary) {
    return <div className="container mx-auto max-w-5xl p-4 md:p-8 animate-fade-in">
        <Skeleton className="h-96 w-full" />
      </div>;
  }

  const isLoading = userLoading || !!isPending;

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">
          {dictionary.title}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
          {dictionary.subtitle}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
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
              <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold rounded-t-lg flex items-center justify-center gap-2">
                <StarIcon className="h-4 w-4" />
                {dictionary.mostPopular}
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
                  <li key={feature} className="flex items-start">
                    <Check className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
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
                disabled={isLoading || user?.plan === plan.name}
              >
                {user?.plan === plan.name
                  ? dictionary.buttons.currentPlan
                  : isPending === plan.name
                  ? dictionary.buttons.processing
                  : plan.name === 'Basic'
                  ? dictionary.buttons.downgrade
                  : `${dictionary.buttons.upgrade} ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function PremiumPageLoader({ params }: { params: { lang: string } }) {
  const dictionary = await getDictionary(params.lang);
  return <PremiumPage dictionary={dictionary.premium} />;
}
