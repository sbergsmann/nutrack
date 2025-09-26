
"use client";

import { useState, useEffect } from "react";
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

type FeedbackDialogProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dictionary: any;
};

export function FeedbackDialog({ children, open, onOpenChange, dictionary }: FeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : isDialogOpen;
  const setDialogOpen = isControlled ? onOpenChange : setIsDialogOpen;

  // Reset state when dialog opens or closes
  useEffect(() => {
    if (!dialogOpen) {
      setRating(0);
      setHoverRating(0);
      setFeedbackText("");
    }
  }, [dialogOpen]);

  const handleFeedbackSubmit = async () => {
    if (!user || !firestore) return;
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: dictionary.toasts.noRating,
      });
      return;
    }

    try {
      await addFeedback(firestore, user.uid, rating, feedbackText);
      toast({
        title: dictionary.toasts.success.title,
        description: dictionary.toasts.success.description,
      });
      setDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.toasts.error.title,
        description: dictionary.toasts.error.description,
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dictionary.title}</DialogTitle>
          <DialogDescription>
            {dictionary.description}
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
            placeholder={dictionary.placeholder}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {dictionary.buttons.cancel}
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleFeedbackSubmit}>
            {dictionary.buttons.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
