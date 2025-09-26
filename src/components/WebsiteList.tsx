// src/components/WebsiteList.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, ArrowUpRight } from "lucide-react";

// Define a type for a single website based on the Supabase schema
type Website = {
  id: number;
  name: string;
  url: string;
  status: string;
};

export default function WebsiteList({ websites }: { websites: Website[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Websites</CardTitle>
        <CardDescription>
          Here are the projects you've already created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {websites.length > 0 ? (
            websites.map((site) => (
              <div key={site.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="bg-secondary p-2 rounded-md">
                    <Globe className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
                      {site.url}
                    </a>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/editor/${site.name}`}>
                    Manage
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">You haven't created any websites yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}