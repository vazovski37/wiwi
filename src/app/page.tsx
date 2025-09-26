// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Index() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const handleLogin = async () => {
    "use server";
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      return;
    }
    if (data.url) {
      redirect(data.url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <Card className="w-full max-w-3xl text-center">
          <CardHeader>
            <CardTitle className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Build Your Dream Website
            </CardTitle>
            <CardDescription className="max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto pt-4">
              Create stunning websites with our powerful AI-driven builder. No coding required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {user ? (
                <Link href="/dashboard" passHref>
                  <Button size="lg" className="px-8 py-4 text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <form action={handleLogin}>
                  <Button size="lg" className="px-8 py-4 text-lg">
                    Get Started
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-gray-400 dark:text-gray-600">
        © 2025 Web Builder. All rights reserved.
      </footer>
    </div>
  );
}