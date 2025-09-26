// src/components/navigation.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe } from "lucide-react";

export default async function Navigation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const handleLogout = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/");
  };
  
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
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Globe className="h-6 w-6" />
          <p className="">WIWI</p>
        </Link>
        {user && (
            <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
            >
                Dashboard
            </Link>
        )}
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 md:grow-0" />
        <div className="flex items-center space-x-4">
            {user ? (
                <>
                    <span className="text-sm font-medium">Hello, {user.email}</span>
                    <form action={handleLogout}>
                    <Button variant="ghost" type="submit">
                        Sign Out
                    </Button>
                    </form>
                </>
            ) : (
                <form action={handleLogin}>
                    <Button type="submit">Sign In with Google</Button>
                </form>
            )}
        </div>
      </div>
    </header>
  );
}