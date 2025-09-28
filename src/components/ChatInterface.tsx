// src/components/ChatInterface.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
};

export default function ChatInterface({ websiteName }: { websiteName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const aiMessage: Message = { id: Date.now() + 1, text: data.text, sender: 'ai' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = { id: Date.now() + 1, text: 'Sorry, something went wrong. Please try again.', sender: 'ai' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full rounded-none border-0">
      <CardHeader>
        <CardTitle>Editing: {websiteName}</CardTitle>
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg max-w-xs ${
              message.sender === 'user'
                ? 'bg-primary text-primary-foreground ml-auto'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {message.text}
          </div>
        ))}
        {isLoading && (
          <div className="p-3 bg-secondary rounded-lg text-secondary-foreground max-w-xs">
            ...
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder="Change the hero title to..."
            className="flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}