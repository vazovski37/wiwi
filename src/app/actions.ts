"use server"

import { createAndDeployWebsite } from "@/lib/google-cloud/api-service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrganizationAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "Authentication error.",
      status: "error" as const,
    };
  }

  const organizationName = formData.get("organization-name") as string;
  
  if (!organizationName) {
    return {
      message: "Organization name is required.",
      status: "error" as const,
    };
  }

  const { error } = await supabase.from('organizations').insert({
    name: organizationName,
    owner_id: user.id,
  });

  if (error) {
    console.error('Error creating organization:', error);
    return {
      message: 'Failed to create organization.',
      status: 'error' as const,
    };
  }
  
  revalidatePath("/dashboard");
  return {
    message: `Successfully created ${organizationName}!`,
    status: "success" as const,
  };
}


export async function createProjectAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "Authentication error.",
      status: "error" as const,
    };
  }

  const projectName = formData.get("project-name") as string;
  const organizationId = formData.get("organization-id") as string;

  if (!projectName || !organizationId) {
    return {
      message: "Project name and organization ID are required.",
      status: "error" as const,
    };
  }
  
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select()
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError || !member) {
      return {
          message: 'You are not authorized to create projects for this organization.',
          status: 'error' as const,
      }
  }

  const { error: projectError } = await supabase.from('projects').insert({
    name: projectName,
    organization_id: parseInt(organizationId, 10),
  });

  if (projectError) {
    console.error('Error creating project:', projectError);
    return {
      message: 'Failed to create project.',
      status: 'error' as const,
    };
  }
  
  const { data: org } = await supabase
    .from('organizations')
    .select('public_id')
    .eq('id', organizationId)
    .single();

  if (org) {
    revalidatePath(`/dashboard/org/${org.public_id}`);
  } else {
    revalidatePath('/dashboard');
  }

  return {
    message: `Successfully created project "${projectName}"!`,
    status: "success" as const,
  };
}

// --- NEW ACTION ---
export async function createWebsiteAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "Authentication error.",
      status: "error" as const,
    };
  }

  const websiteName = formData.get("website-name") as string;
  const projectId = formData.get("project-id") as string;

  if (!websiteName || !projectId) {
    return { message: "Website name and project ID are required.", status: "error" as const };
  }

  // Security Check: Verify the user is a member of the organization that owns the project
  const { data: projectData, error: projectAuthError } = await supabase
    .from('projects')
    .select(`
      id,
      organization_id,
      organizations ( public_id )
    `)
    .eq('id', projectId)
    .single();

  if (projectAuthError || !projectData) {
    return { message: "Project not found.", status: "error" as const };
  }

  const { count: memberCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', projectData.organization_id)
    .eq('user_id', user.id);
  
  if (memberCount === 0) {
    return { message: "You are not authorized to perform this action.", status: "error" as const };
  }

  const gcloudProjectId = process.env.GCLOUD_PROJECT_ID;
  const githubOrg = process.env.GITHUB_ORG;
  const templateRepoUrl = process.env.GITHUB_TEMPLATE_REPO_URL;
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!gcloudProjectId || !githubOrg || !templateRepoUrl || !githubToken) {
    return { message: "Server configuration error for deployment.", status: "error" as const };
  }

  const result = await createAndDeployWebsite(
    gcloudProjectId,
    githubOrg,
    websiteName,
    templateRepoUrl,
    githubToken
  );

  if (result.success && result.repo) {
    const { error: insertError } = await supabase.from('websites').insert({
      name: websiteName,
      repo_name: result.repo,
      url: result.url,
      status: "Deploying",
      project_id: parseInt(projectId, 10),
    });

    if (insertError) {
      console.error('Error saving website to Supabase:', insertError);
      return { message: 'Failed to save website to database.', status: 'error' as const };
    }
    
    // Revalidate the specific project page
    const orgPublicId = projectData.organizations?.public_id;
    const projectPublicId = (await supabase.from('projects').select('public_id').eq('id', projectId).single()).data?.public_id;

    if (orgPublicId && projectPublicId) {
        revalidatePath(`/dashboard/org/${orgPublicId}/project/${projectPublicId}`);
    }

    return { message: `Successfully creating ${websiteName}! Deployment has started.`, status: "success" as const };
  } else {
    return { message: result.error || "An unknown error occurred during deployment.", status: "error" as const };
  }
}

