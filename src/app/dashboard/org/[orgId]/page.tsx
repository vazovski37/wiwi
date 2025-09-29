import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Database } from "../../../../types/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import ProjectList from "@/components/ProjectList";

type OrgPageProps = {
  params: {
    orgId: string; // This will be the public_id (UUID) from the URL
  };
};

export default async function OrganizationPage({ params }: OrgPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch the organization using the public_id from the URL
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, public_id")
    .eq("public_id", params.orgId)
    .single();

  if (orgError || !organization) {
    console.error("Error fetching organization or not found:", orgError);
    return notFound();
  }

  // Security Check: Verify the user is a member of this organization before proceeding
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select()
    .eq('organization_id', organization.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if(memberError || !member) {
    console.error("Security check failed: User is not a member of this organization.", memberError);
    return notFound();
  }


  // Fetch projects for this organization
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organization.id);
  
  if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      // Decide how to handle this - maybe show an error message but still render the page
  }


  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
       <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">
          {organization.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your projects, members, and settings.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>
                        Websites, CRM, and AI assistants live inside projects.
                        </CardDescription>
                    </div>
                    <CreateProjectDialog organizationId={organization.id} />
                </div>
            </CardHeader>
            <CardContent>
                <ProjectList projects={projects || []} organization={organization} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

