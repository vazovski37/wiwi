"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useActionState } from "react-dom";

// Define a type for the state of the server action form.
type FormState = {
  message: string;
  status: "success" | "error";
} | null;

/**
 * The form component for making a Cloud Run service public.
 * It uses server actions to make the API call.
 */
export default function PublicAccessForm({
  makePublicAction,
}: {
  makePublicAction: (
    formData: FormData
  ) => Promise<FormState>;
}) {
  const [formState, formAction] = useActionState(makePublicAction, null);
  const { pending } = useFormStatus();
  const [selectedRegion, setSelectedRegion] = useState("us-central1");

  useEffect(() => {
    if (formState) {
      alert(formState.message);
    }
  }, [formState]);

  return (
    <form action={formAction} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="service-name" className="text-right">
          Service Name
        </Label>
        <Input
          id="service-name"
          name="service-name"
          required
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="region" className="text-right">
          Region
        </Label>
        <Select
          name="region"
          required
          onValueChange={(value) => setSelectedRegion(value)}
          defaultValue={selectedRegion}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us-central1">us-central1</SelectItem>
            <SelectItem value="us-east1">us-east1</SelectItem>
            <SelectItem value="europe-west1">europe-west1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Applying..." : "Make Public"}
      </Button>
    </form>
  );
}
