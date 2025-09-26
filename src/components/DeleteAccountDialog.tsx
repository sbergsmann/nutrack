
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

export function DeleteAccountDialog({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const confirmationText = "delete";

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount(user.uid);
      if (result.success) {
        toast({
          title: "Account deleted",
          description: "Your account and all associated data have been permanently deleted.",
        });
        await signOut(); // This will trigger a redirect via useUser hook
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "An unexpected error occurred. Please try again.",
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
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove all of your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
                To confirm, please type "<b>{confirmationText}</b>" in the box below.
            </p>
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setInputValue("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={inputValue !== confirmationText || isDeleting}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
