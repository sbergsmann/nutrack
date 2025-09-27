
"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, MessageSquare, User as UserIcon, BadgeCheck, Trash2, Languages, ChevronsUpDown } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { signInWithGoogle, signOut } from "@/firebase/auth/actions";
import { FeedbackDialog } from "./FeedbackDialog";
import { Badge } from "./ui/badge";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { usePathname, useParams, useRouter } from "next/navigation";
import { i18n, type Locale } from "@/i18n.config";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase/provider";
import { updateUserLanguage } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export function UserProfile({ dictionary }: { dictionary: any }) {
  const { data: user, loading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const lang = params.lang as Locale;
  const [isLanguageOpen, setLanguageOpen] = useState(false);

  const handleLanguageChange = async (newLocale: Locale) => {
    if (!pathname || !user || !firestore) return;
    if (newLocale === lang) return;

    try {
      await updateUserLanguage(firestore, user.uid, newLocale);
      const newPath = pathname.replace(`/${lang}`, `/${newLocale}`);
      window.location.assign(newPath);
    } catch (error) {
      console.error("Failed to change language:", error);
      toast({
        variant: "destructive",
        title: "Failed to change language",
        description: "Please try again.",
      });
    }
  };

  if (loading) {
    return <Button variant="ghost" size="icon" disabled className="animate-pulse" />;
  }

  if (!user) {
    return (
      <Button variant="ghost" onClick={signInWithGoogle}>
        <LogIn className="mr-2 h-4 w-4" />
        {dictionary.login}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.photoURL ?? ""}
              alt={user.displayName ?? "User"}
            />
            <AvatarFallback>
              <UserIcon />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <BadgeCheck className="mr-2 h-4 w-4" />
              <span>{dictionary.plan}</span>
            </div>
            <Badge variant="secondary">{user.plan}</Badge>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Collapsible open={isLanguageOpen} onOpenChange={setLanguageOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setLanguageOpen(!isLanguageOpen); }}>
                <Languages className="mr-2 h-4 w-4" />
                <span>{dictionary.language}</span>
                <ChevronsUpDown className={cn("ml-auto h-4 w-4 transition-transform", isLanguageOpen && "rotate-180")} />
            </DropdownMenuItem>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2">
             <DropdownMenuItem onClick={() => handleLanguageChange('en')} className="pl-6">
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('de')} className="pl-6">
                Deutsch
              </DropdownMenuItem>
          </CollapsibleContent>
        </Collapsible>
        <FeedbackDialog dictionary={dictionary.feedback}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>{dictionary.sendFeedback}</span>
          </DropdownMenuItem>
        </FeedbackDialog>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{dictionary.logout}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteAccountDialog dictionary={dictionary.deleteAccount}>
            <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{dictionary.deleteAccount.title}</span>
            </DropdownMenuItem>
        </DeleteAccountDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
