import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebsiteList from "@/components/WebsiteList";
import { CreateWebsiteDialog } from "@/components/create-website-dialog";

type ProjectPageProps = {
  params: {
    orgId: string; // Organization public_id
    projectId: string; // Project public_id
  };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { orgId, projectId } = params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
        id,
        name,
        organization:organizations (
            id,
            name
        )
    `)
    .eq("public_id", projectId)
    .single();
    
  if (projectError || !project || !project.organization) {
    console.error("Error fetching project or its organization:", projectError);
    return notFound();
  }
  
  // Security check: ensure the user is part of the organization
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('user_id', { count: 'exact' })
    .eq('organization_id', project.organization.id)
    .eq('user_id', user.id)
    .single();

  if(memberError || !member) {
    console.error("Security check failed: User is not a member of this project's organization.", memberError);
    return notFound();
  }
  
  const { data: websites, error: websitesError } = await supabase
    .from('websites')
    .select('*')
    .eq('project_id', project.id);

  if (websitesError) {
      console.error("Error fetching websites:", websitesError);
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
       <div className="mx-auto grid w-full max-w-6xl gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Organization: {project.organization.name}
        </p>
        <h1 className="text-3xl font-semibold">
          Project: {project.name}
        </h1>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
        <Tabs defaultValue="website">
            <TabsList>
                <TabsTrigger value="website">Website</TabsTrigger>
                <TabsTrigger value="crm">CRM</TabsTrigger>
                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="website">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Website</CardTitle>
                                <CardDescription>
                                Manage your deployed websites for this project.
                                </CardDescription>
                            </div>
                            <CreateWebsiteDialog projectId={project.id} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <WebsiteList 
                            websites={websites || []} 
                            orgId={orgId} 
                            projectId={projectId}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="crm">
                <Card><CardHeader><CardTitle>CRM</CardTitle></CardHeader><CardContent><p>CRM features coming soon.</p></CardContent></Card>
            </TabsContent>
             <TabsContent value="assistant">
                <Card><CardHeader><CardTitle>AI Assistant</CardTitle></CardHeader><CardContent><p>AI Assistant features coming soon.</p></CardContent></Card>
            </TabsContent>
             <TabsContent value="tasks">
                <Card><CardHeader><CardTitle>Tasks</CardTitle></CardHeader><CardContent><p>Task tracking features coming soon.</p></CardContent></Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

