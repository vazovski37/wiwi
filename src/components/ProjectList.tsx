import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Box, ServerCrash } from "lucide-react";
import { Database } from "@/types/supabase";

type Project = Database['public']['Tables']['projects']['Row'];
type Organization = Pick<Database['public']['Tables']['organizations']['Row'], 'public_id'>;


export default function ProjectList({ projects, organization }: { projects: Project[], organization: Organization }) {
  return (
    <div>
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-3 rounded-md">
                    <Box className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>
                      Created on: {new Date(project.created_at!).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardFooter>
                <Button asChild className="w-full">
                  {/* TODO: Create the project page at this link */}
                  <Link href={`/dashboard/org/${organization.public_id}/project/${project.public_id}`}>
                    Manage Project
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <ServerCrash className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">No projects found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click "Create New Project" to get started.</p>
        </div>
      )}
    </div>
  );
}

