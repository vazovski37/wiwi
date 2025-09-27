"use server"

import { createAndDeployWebsite } from "@/lib/google-cloud/api-service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const projectId = process.env.GCLOUD_PROJECT_ID;
  const githubOrg = process.env.GITHUB_ORG;
  const templateRepoUrl = process.env.GITHUB_TEMPLATE_REPO_URL;
  const githubToken = process.env.GITHUB_TOKEN;
  const gcloudCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  // --- NEW: Fetch the privileged SA email from the environment ---
  const publisherSaEmail = process.env.PUBLISHER_SA_EMAIL;

  if (
    !websiteName || !projectId || !githubOrg || !templateRepoUrl || !githubToken || !gcloudCreds || !publisherSaEmail
  ) {
    console.error("❌ Missing required environment variables or website name. Check PUBLISHER_SA_EMAIL.");
    return {
      message: "Server configuration error. Please ensure all required environment variables are set.",
      status: "error" as const,
    };
  }

  const result = await createAndDeployWebsite(
    projectId,
    githubOrg,
    websiteName,
    templateRepoUrl,
    githubToken,
    // --- NEW: Pass the SA email to the deployment service ---
    publisherSaEmail
  );

  if (result.success && result.repo) {
    const { error } = await supabase.from('websites').insert({
      name: websiteName,      // The user-friendly name, e.g., "vector"
      repo_name: result.repo, // The full unique name, e.g., "vazovski37/vector-cahu9z"
      url: result.url,
      status: "Deploying",
      user_id: user.id,
    });

    if (error) {
      console.error('Error saving website to Supabase:', error);
      return {
        message: '❌ Failed to save website to database.',
        status: 'error' as const,
      };
    }
    
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
}
