"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useFormStatus } from 'react-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? "Creating..." : "Create New Website"}
    </Button>
  );
}

interface DashboardFormProps {
    createWebsiteAction: (formData: FormData) => void;
}

export default function DashboardForm({ createWebsiteAction }: DashboardFormProps) {
    return (
        <Card className="p-4">
            <CardHeader className="p-0">
                <CardTitle className="text-xl">Your Websites</CardTitle>
                <CardDescription>Create and manage your web projects.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4 flex items-center justify-center border-2 border-dashed rounded-lg p-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <form action={createWebsiteAction}>
                    <div className="text-center">
                        <Plus className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-50">No websites created yet</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new website.</p>
                        <div className="mt-6 flex flex-col items-center space-y-4">
                            <div className="w-full">
                                <Label htmlFor="website-name" className="sr-only">Website Name</Label>
                                <Input id="website-name" name="website-name" placeholder="Enter website name" required />
                            </div>
                            <SubmitButton />
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}