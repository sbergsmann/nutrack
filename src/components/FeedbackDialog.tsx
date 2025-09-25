
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { addFeedback } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export function FeedbackDialog({ children }: { children: React.ReactNode }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [open, setOpen] = useState(false);

  const { data: user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleFeedbackSubmit = async () => {
    if (!user || !firestore) return;
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Please select a rating.",
      });
      return;
    }

    try {
      await addFeedback(firestore, user.uid, rating, feedbackText);
      toast({
        title: "Feedback sent!",
        description: "Thank you for helping us improve.",
      });
      setOpen(false);
      setRating(0);
      setFeedbackText("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send feedback",
        description: "Please try again later.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send us your feedback</DialogTitle>
          <DialogDescription>
            We'd love to hear what you think about Nutrack.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-8 w-8 cursor-pointer transition-colors",
                  (hoverRating >= star || rating >= star)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground"
                )}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
          <Textarea
            placeholder="Tell us what you think..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleFeedbackSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
