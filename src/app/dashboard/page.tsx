// src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateWebsiteDialog } from "@/components/create-website-dialog";
import WebsiteList from "@/components/WebsiteList";
import { Globe, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: websites, error } = await supabase
    .from('websites')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching websites:', error);
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your websites and settings.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <nav className="grid gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="font-semibold text-primary flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Websites
          </Link>
          <Link href="#" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Websites</CardTitle>
                  <CardDescription>
                    Here are the projects you've already created.
                  </CardDescription>
                </div>
                <CreateWebsiteDialog />
              </div>
            </CardHeader>
            <CardContent>
              <WebsiteList websites={websites || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}