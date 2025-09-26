// src/components/create-website-dialog.tsx
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
import { createWebsiteAction } from "@/app/actions";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner"

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? "Creating..." : "Create"}
    </Button>
  );
}

export function CreateWebsiteDialog() {
    const [open, setOpen] = useState(false);

    const formAction = async (formData: FormData) => {
        const result = await createWebsiteAction(formData);
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
                Create New Website
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Create a New Website</DialogTitle>
            <DialogDescription>
                Enter a name for your new web project.
            </DialogDescription>
            </DialogHeader>
            <form action={formAction}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="website-name" className="text-right">
                    Name
                </Label>
                <Input
                    id="website-name"
                    name="website-name"
                    placeholder="My Awesome Project"
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