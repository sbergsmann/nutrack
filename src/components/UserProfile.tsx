
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, MessageSquare, User as UserIcon, Star, BadgeCheck, Trash2, Languages } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { signInWithGoogle, signOut } from "@/firebase/auth/actions";
import { FeedbackDialog } from "./FeedbackDialog";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { usePathname, useParams } from "next/navigation";
import { i18n } from "@/i18n.config";

export function UserProfile() {
  const { data: user, loading } = useUser();
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang;

  const handleLanguageChange = (newLocale: string) => {
    if (!pathname) return;
    const newPath = pathname.replace(`/${lang}`, `/${newLocale}`);
    window.location.href = newPath;
  };

  if (loading) {
    return <Button variant="ghost" size="icon" disabled className="animate-pulse" />;
  }

  if (!user) {
    return (
      <Button variant="ghost" onClick={signInWithGoogle}>
        <LogIn className="mr-2 h-4 w-4" />
        Login
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
              <span>Plan</span>
            </div>
            <Badge variant="secondary">{user.plan}</Badge>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${lang}/premium`}>
            <Star className="mr-2 h-4 w-4" />
            <span>Go Premium</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>Language</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('de')}>
                Deutsch
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <FeedbackDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Send Feedback</span>
          </DropdownMenuItem>
        </FeedbackDialog>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteAccountDialog>
            <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Account</span>
            </DropdownMenuItem>
        </DeleteAccountDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
