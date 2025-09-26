import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditorClient from "@/components/EditorClient";

type EditorPageProps = {
  params: {
    websiteName: string;
  };
};

export default async function EditorPage({ params }: EditorPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }
  
  const { websiteName } = params;

  const { data: website } = await supabase
    .from("websites")
    .select("name, repo_name")
    .eq("name", websiteName)
    .eq("user_id", user.id)
    .single();

  if (!website || !website.repo_name) {
    console.error(`Website '${websiteName}' not found or its repo_name is missing.`);
    return notFound();
  }

  return (
    <EditorClient
      websiteName={website.name}
      repoName={website.repo_name}
    />
  );
}