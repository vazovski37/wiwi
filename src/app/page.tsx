import Link from "next/link";
import { Button } from "@/components/ui/button";
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

  const handleLogout = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Web Builder</h1>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Hello, {user.email}</span>
              <form action={handleLogout}>
                <Button variant="ghost" type="submit">Sign Out</Button>
              </form>
            </div>
          ) : (
            <form action={handleLogin}>
              <Button type="submit">Sign In with Google</Button>
            </form>
          )}
        </div>
      </header>
      <main className="flex flex-col items-center justify-center text-center p-8 space-y-6">
        <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Build Your Dream Website
        </h2>
        <p className="max-w-2xl text-xl text-gray-500 dark:text-gray-400">
          Create stunning websites with our powerful AI-driven builder. No coding required.
        </p>
        <div className="flex space-x-4">
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
      </main>
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-gray-400 dark:text-gray-600">
        © 2025 Web Builder. All rights reserved.
      </footer>
    </div>
  );
}