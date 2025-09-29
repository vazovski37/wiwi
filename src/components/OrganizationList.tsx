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
import { Building, ServerCrash } from "lucide-react";
import { OrganizationForList } from "../app/dashboard/page";

export default function OrganizationList({ organizations }: { organizations: OrganizationForList[] }) {
  return (
    <div>
      {organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-3 rounded-md">
                    <Building className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription>
                      Created on: {new Date(org.created_at!).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardFooter>
                <Button asChild className="w-full">
                  {/* Correctly link to the organization's page using the secure public_id */}
                  <Link href={`/dashboard/org/${org.public_id}`}>
                    Manage Organization
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <ServerCrash className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-200">No organizations found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click "Create New Organization" to get started.</p>
        </div>
      )}
    </div>
  );
}

