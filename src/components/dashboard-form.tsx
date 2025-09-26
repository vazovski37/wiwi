// src/components/dashboard-form.tsx

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useFormStatus } from 'react-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import WebsiteList from "./WebsiteList";
import { useState } from "react";
import { createWebsiteAction } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? "Creating..." : "Create New Website"}
    </Button>
  );
}

interface DashboardFormProps {
  websites: { id: number; name: string; url: string; status: string }[];
}

export default function DashboardForm({ websites }: DashboardFormProps) {
  const [showCreateForm, setShowCreateForm] = useState(websites.length === 0);

  return (
    <div className="w-full">
      {showCreateForm ? (
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle className="text-xl">Create a New Website</CardTitle>
            <CardDescription>
              Enter a name for your new web project.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <form action={createWebsiteAction}>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full">
                  <Label htmlFor="website-name" className="sr-only">Website Name</Label>
                  <Input id="website-name" name="website-name" placeholder="Enter website name" required />
                </div>
                <SubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <WebsiteList websites={websites} />
          <Button onClick={() => setShowCreateForm(true)} className="w-full mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create New Website
          </Button>
        </>
      )}
    </div>
  );
}