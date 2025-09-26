"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

export default function ChatInterface({ websiteName }: { websiteName: string }) {
  return (
    <Card className="flex flex-col h-full rounded-none border-0">
      <CardHeader>
        <CardTitle>Editing: {websiteName}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto">
        {/* Chat messages will go here */}
        <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-lg text-secondary-foreground max-w-xs">
                Hello! What would you like to change on your site today?
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form className="flex w-full items-center space-x-2">
          <Input id="message" placeholder="Change the hero title to..." className="flex-1" />
          <Button type="submit" size="icon">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}