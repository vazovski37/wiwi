import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createAndDeployWebsite } from "@/lib/google-cloud/api-service";
import DashboardForm from "@/components/dashboard-form";

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

  /**
   * Server action to create a new website.
   * Reads all required environment variables and uses
   * service account credentials via GOOGLE_APPLICATION_CREDENTIALS.
   */
  const createWebsiteAction = async (formData: FormData) => {
    "use server";
    const websiteName = formData.get("website-name") as string;

    const projectId = process.env.GCLOUD_PROJECT_ID;
    const githubOrg = process.env.GITHUB_ORG;
    const templateRepoUrl = process.env.GITHUB_TEMPLATE_REPO_URL;
    const githubToken = process.env.GITHUB_TOKEN;
    const gcloudCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (
      !websiteName ||
      !projectId ||
      !githubOrg ||
      !templateRepoUrl ||
      !githubToken ||
      !gcloudCreds
    ) {
      console.error("❌ Missing required environment variables or website name.");
      return {
        message: "Server configuration error. Please contact support.",
        status: "error" as const,
      };
    }

    const result = await createAndDeployWebsite(
      projectId,
      githubOrg,
      websiteName,
      templateRepoUrl,
      githubToken
    );

    if (result.success) {
      revalidatePath("/dashboard");
      return {
        message: `✅ Successfully created ${websiteName}!`,
        status: "success" as const,
      };
    } else {
      return {
        message: result.error || "❌ An unknown error occurred.",
        status: "error" as const,
      };
    }
  };

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
            <DashboardForm createWebsiteAction={createWebsiteAction} />
          </div>
        </div>
      </main>
    </div>
  );
}
