
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle } from "@/firebase/auth/actions";
import { BarChart, BrainCircuit, UtensilsCrossed } from "lucide-react";

export function WelcomePage({ dictionary }: { dictionary: any }) {
  return (
    <div className="animate-fade-in">
      <section className="bg-background">
        <div className="container mx-auto flex flex-col items-center justify-center space-y-6 px-4 py-16 text-center md:py-24">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
            {dictionary.title}
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            {dictionary.subtitle}
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={signInWithGoogle}>
              {dictionary.getStarted}
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-card/50">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-3 md:py-24">
          <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
            <CardHeader className="items-center text-center">
              <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <CardTitle>{dictionary.features.nutrition.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {dictionary.features.nutrition.description}
            </CardContent>
          </Card>
          <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
            <CardHeader className="items-center text-center">
              <div className="mb-4 rounded-full bg-accent/20 p-4 text-accent-foreground">
                <BrainCircuit className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle>{dictionary.features.mood.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {dictionary.features.mood.description}
            </CardContent>
          </Card>
          <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
            <CardHeader className="items-center text-center">
              <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                <BarChart className="h-8 w-8" />
              </div>
              <CardTitle>{dictionary.features.connections.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {dictionary.features.connections.description}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
