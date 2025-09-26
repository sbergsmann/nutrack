
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAccount } from "@/lib/actions";
import { signOut } from "@/firebase/auth/actions";

export function DeleteAccountDialog({ children, dictionary }: { children: React.ReactNode, dictionary: any }) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const confirmationText = dictionary.confirmationText;

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount(user.uid);
      if (result.success) {
        toast({
          title: dictionary.toasts.success.title,
          description: dictionary.toasts.success.description,
        });
        await signOut(); // This will trigger a redirect via useUser hook
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: dictionary.toasts.error.title,
        description: error.message || dictionary.toasts.error.description,
      });
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dictionary.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dictionary.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: dictionary.confirmPrompt.replace('{confirmationText}', confirmationText) }} />
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setInputValue("")}>{dictionary.buttons.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={inputValue !== confirmationText || isDeleting}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? dictionary.buttons.deleting : dictionary.buttons.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
