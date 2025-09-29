import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, ServerCrash } from "lucide-react";
import { Database } from "@/types/supabase";
import type { VariantProps } from "class-variance-authority";

// Use the generated type from Supabase for a single website
type Website = Database['public']['Tables']['websites']['Row'];

// Define the props interface for this component
interface WebsiteListProps {
    websites: Website[];
    orgId: string;
    projectId: string;
}

// Helper to determine badge color based on status
const getBadgeVariant = (status: string | null): VariantProps<typeof badgeVariants>["variant"] => {
  if (!status) return 'outline';
  switch (status.toLowerCase()) {
    case 'live':
    case 'deploying':
      return 'default';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function WebsiteList({ websites, orgId, projectId }: WebsiteListProps) {
  return (
    <div>
      {websites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((site) => (
            <Card key={site.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-secondary p-3 rounded-md">
                            <Globe className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{site.name}</CardTitle>
                            <CardDescription>
                                <a
                                href={site.url ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:underline flex items-center gap-1 break-all"
                                >
                                {site.url ?? 'URL not available'}
                                </a>
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={getBadgeVariant(site.status)} className="capitalize">
                        {site.status ?? 'Unknown'}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/org/${orgId}/project/${projectId}/website/${site.public_id}/editor`}>
                    Open Editor
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <ServerCrash className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">No websites found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click "Create New Website" to get started.</p>
        </div>
      )}
    </div>
  );
}

