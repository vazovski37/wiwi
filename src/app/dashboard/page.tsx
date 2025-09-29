import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import OrganizationList from "@/components/OrganizationList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Settings } from "lucide-react";
import Link from "next/link";
import { Database } from "../../types/supabase";

// Define a specific type for the organizations we're fetching and passing down.
export type OrganizationForList = Pick<Database['public']['Tables']['organizations']['Row'], 'id' | 'name' | 'public_id' | 'created_at'>;


export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch organizations the user is a member of through the join table
  const { data: orgMembers, error } = await supabase
    .from('organization_members')
    .select(`
      organizations (
        id,
        public_id,
        name,
        created_at
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching organizations:', error);
    // You might want to show an error page here
  }

  // Extract the organization data from the join table result.
  const userOrganizations: OrganizationForList[] = orgMembers
    ?.map(item => item.organizations)
    .filter((org): org is NonNullable<typeof org> => org !== null) || [];


  // If the user has no organizations, show the create dialog prominently.
  if (userOrganizations.length === 0) {
    return (
        <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10 items-center justify-center">
             <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle>Welcome to wiwi!</CardTitle>
                    <CardDescription>Create an organization to get started with your first project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateOrganizationDialog />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select an organization or create a new one.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <nav className="grid gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="font-semibold text-primary flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organizations
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
                            <CardTitle>Your Organizations</CardTitle>
                            <CardDescription>
                            Select an organization to manage its projects.
                            </CardDescription>
                        </div>
                        <CreateOrganizationDialog />
                    </div>
                </CardHeader>
                <CardContent>
                    <OrganizationList organizations={userOrganizations} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

