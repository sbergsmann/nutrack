
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase/provider";
import { updateUserProfile } from "@/lib/data";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/lib/types";

const activityLevels: UserProfile['activityLevel'][] = ["Sedentary", "Lightly active", "Moderately active", "Very active", "Extra active"];

const profileFormSchema = z.object({
  height: z.preprocess(
    (a) => (a === "" || a === null ? undefined : parseFloat(String(a))),
    z.number({ invalid_type_error: "Must be a number" }).positive().optional().nullable()
  ),
  weight: z.preprocess(
    (a) => (a === "" || a === null ? undefined : parseFloat(String(a))),
    z.number({ invalid_type_error: "Must be a number" }).positive().optional().nullable()
  ),
  age: z.preprocess(
    (a) => (a === "" || a === null ? undefined : parseInt(String(a), 10)),
    z.number({ invalid_type_error: "Must be a number" }).positive().int().optional().nullable()
  ),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  activityLevel: z.enum(["Sedentary", "Lightly active", "Moderately active", "Very active", "Extra active"]).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function SettingsPageClient({ dictionary }: { dictionary: any }) {
  const { data: user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      height: undefined,
      weight: undefined,
      age: undefined,
      gender: undefined,
      activityLevel: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        height: user.height || null,
        weight: user.weight || null,
        age: user.age || null,
        gender: user.gender || null,
        activityLevel: user.activityLevel || null,
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      const updateData = {
        height: data.height === undefined ? null : data.height,
        weight: data.weight === undefined ? null : data.weight,
        age: data.age === undefined ? null : data.age,
        gender: data.gender === undefined ? null : data.gender,
        activityLevel: data.activityLevel === undefined ? null : data.activityLevel,
      };
      await updateUserProfile(firestore, user.uid, updateData);
      toast({
        title: dictionary.toasts.profileUpdated.title,
        description: dictionary.toasts.profileUpdated.description,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.toasts.error.title,
        description: dictionary.toasts.error.profileSave,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      await updateUserProfile(firestore, user.uid, { height: null, weight: null, age: null, gender: null, activityLevel: null });
      form.reset({ height: null, weight: null, age: null, gender: null, activityLevel: null });
      toast({
        title: dictionary.toasts.profileCleared.title,
        description: dictionary.toasts.profileCleared.description,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.toasts.error.title,
        description: dictionary.toasts.error.profileClear,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const appVersion = "1.1.2";
  const hasMeasurements = !!(user?.height || user?.weight || user?.age || user?.gender || user?.activityLevel);

  if (!dictionary) {
    return <div className="container mx-auto max-w-5xl p-4 md:p-8 animate-fade-in"><Skeleton className="w-full h-96" /></div>;
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-4 md:p-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">
          {dictionary.title}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
          {dictionary.subtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.personalInfo.title}</CardTitle>
          <CardDescription>
            {dictionary.personalInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dictionary.fields.height}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={dictionary.fields.heightPlaceholder}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dictionary.fields.weight}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={dictionary.fields.weightPlaceholder}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dictionary.fields.age}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={dictionary.fields.agePlaceholder}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dictionary.fields.gender}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value ?? undefined}
                          value={field.value ?? undefined}
                         >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={dictionary.fields.genderPlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">{dictionary.genderOptions.male}</SelectItem>
                            <SelectItem value="Female">{dictionary.genderOptions.female}</SelectItem>
                            <SelectItem value="Other">{dictionary.genderOptions.other}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="md:col-span-2">
                      <FormField
                      control={form.control}
                      name="activityLevel"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{dictionary.fields.activityLevel}</FormLabel>
                          <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value ?? undefined}
                              value={field.value ?? undefined}
                          >
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder={dictionary.fields.activityLevelPlaceholder} />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              {activityLevels.map(level => (
                                  <SelectItem key={level} value={level}>{dictionary.activityLevelOptions[level.replace(" ", "")]}</SelectItem>
                              ))}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                    {isSaving ? dictionary.buttons.saving : dictionary.buttons.save}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isSaving || (!hasMeasurements && !form.formState.isDirty)}
                  >
                    {isSaving ? dictionary.buttons.clearing : dictionary.buttons.clear}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>{dictionary.version} {appVersion}</p>
      </div>
    </div>
  );
}
