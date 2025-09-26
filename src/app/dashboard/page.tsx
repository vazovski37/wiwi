// src/app/dashboard/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DashboardForm from "@/components/dashboard-form";
import { createWebsiteAction } from "../actions"; // Import the server action

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const handleLogout = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/");
  };
  
  const { data: websites, error } = await supabase
    .from('websites')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching websites:', error);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <span className="sr-only">Web Builder</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 md:grow-0" />
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm font-medium">Hello, {user.email}</span>
            <form action={handleLogout}>
              <Button variant="ghost" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your websites and settings.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="font-semibold text-primary">
              Websites
            </Link>
            <Link href="#">Settings</Link>
          </nav>
          <div className="grid gap-6">
            <DashboardForm createWebsiteAction={createWebsiteAction} websites={websites || []} />
          </div>
        </div>
      </main>
    </div>
  );
}