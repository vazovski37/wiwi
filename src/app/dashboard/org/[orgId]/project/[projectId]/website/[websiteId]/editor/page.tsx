import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditorClient from "@/components/EditorClient";

type EditorPageProps = {
  params: {
    websiteId: string; // This is the website's public_id
  };
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { websiteId } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch the website and its parent organization for a security check
  const { data: website, error } = await supabase
    .from("websites")
    .select(`
      name,
      repo_name,
      url,
      project:projects (
        organization_id
      )
    `)
    .eq("public_id", websiteId)
    .single();

  if (error || !website || !website.project) {
    console.error(`Website with public_id '${websiteId}' not found or project link missing.`);
    return notFound();
  }

  // Security Check: Verify the user is a member of the organization that owns this website
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('user_id', { count: 'exact' })
    .eq('organization_id', website.project.organization_id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !member) {
    console.error("Security check failed: User is not a member of this website's organization.", memberError);
    return notFound();
  }

  if (!website.repo_name || !website.url) {
    console.error(`Website '${website.name}' is missing repo_name or url.`);
    // You might want a different page for this state, e.g., "Deployment in progress"
    return notFound();
  }

  return (
    <EditorClient
      websiteName={website.name}
      repoName={website.repo_name}
      serviceUrl={website.url}
    />
  );
}
