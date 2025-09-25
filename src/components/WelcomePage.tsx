
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle } from "@/firebase/auth/actions";
import { BarChart, BrainCircuit, UtensilsCrossed } from "lucide-react";

export function WelcomePage() {
  return (
    <div className="animate-fade-in">
      <section className="bg-background">
        <div className="container mx-auto flex flex-col items-center justify-center space-y-6 px-4 py-16 text-center md:py-24">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
            Unlock the Connection Between Food and Mood
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Nutrack is a simple, mindful tool to help you discover how your diet
            affects your well-being. Track your meals and moods to find
            patterns and feel your best.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={signInWithGoogle}>
              Get Started for Free
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
              <CardTitle>Track Your Nutrition</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Effortlessly log the foods you eat each day. Our smart suggestion
              tool makes it fast and simple.
            </CardContent>
          </Card>
          <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
            <CardHeader className="items-center text-center">
              <div className="mb-4 rounded-full bg-accent/20 p-4 text-accent-foreground">
                <BrainCircuit className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle>Understand Your Mood</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Quickly record your mood throughout the day to see how your
              emotional state fluctuates.
            </CardContent>
          </Card>
          <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
            <CardHeader className="items-center text-center">
              <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                <BarChart className="h-8 w-8" />
              </div>
              <CardTitle>Discover Connections</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Our calendar view helps you visualize the relationship between
              what you ate and how you felt.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
