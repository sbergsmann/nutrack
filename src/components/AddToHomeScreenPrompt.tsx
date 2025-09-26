
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Smartphone, Share, MoreVertical, PlusSquare, X } from "lucide-react";

export function AddToHomeScreenPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed-a2hs");
    if (dismissed !== "true") {
      setIsVisible(true);
    }
    
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/i.test(userAgent)) {
      setPlatform("android");
    }

  }, []);

  const handleDismiss = () => {
    localStorage.setItem("dismissed-a2hs", "true");
    setIsVisible(false);
  };

  if (!isVisible || platform === 'other') {
    return null;
  }

  const instructions = {
    ios: [
      { text: "Tap the Share button", icon: <Share className="h-5 w-5" /> },
      { text: "Scroll down and select 'Add to Home Screen'", icon: <PlusSquare className="h-5 w-5" /> },
    ],
    android: [
      { text: "Tap the Menu button", icon: <MoreVertical className="h-5 w-5" /> },
      { text: "Select 'Add to Home screen'", icon: <Smartphone className="h-5 w-5" /> },
    ],
  };

  return (
    <div className="animate-fade-in">
        <Card className="relative bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Smartphone />
                Get Quick Access
                </CardTitle>
                <CardDescription>
                Add Nutrack9 to your home screen for a faster, app-like experience.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="font-medium mb-3">
                    {platform === "ios" ? "On your iPhone or iPad:" : "On your Android device:"}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                {(instructions[platform] || []).map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary/20 text-primary rounded-full p-2">
                        {step.icon}
                    </div>
                    <span className="text-sm">{step.text}</span>
                    </div>
                ))}
                </div>
            </CardContent>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-6 w-6"
                onClick={handleDismiss}
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </Button>
        </Card>
    </div>
  );
}


