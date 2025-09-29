"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from 'react-dom';
import { createProjectAction } from "@/app/actions";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner"

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? "Creating..." : "Create Project"}
    </Button>
  );
}

export function CreateProjectDialog({ organizationId }: { organizationId: number }) {
    const [open, setOpen] = useState(false);

    const formAction = async (formData: FormData) => {
        // Add the organizationId to the form data
        formData.append('organization-id', organizationId.toString());

        const result = await createProjectAction(formData);
        if (result.status === "success") {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    };

  return (
    <>
        <Toaster />
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Project
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Create a New Project</DialogTitle>
            <DialogDescription>
                Enter a name for your new project.
            </DialogDescription>
            </DialogHeader>
            <form action={formAction}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="project-name" className="text-right">
                    Name
                </Label>
                <Input
                    id="project-name"
                    name="project-name"
                    placeholder="My First Website"
                    className="col-span-3"
                    required
                />
                </div>
            </div>
            <div className="flex justify-end">
                <SubmitButton />
            </div>
            </form>
        </DialogContent>
        </Dialog>
    </>
  );
}

