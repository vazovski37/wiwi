"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Bot, CheckCircle2, Code, File, Loader2, Pencil, Sparkles, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Plan, ToolCall } from "@/lib/ai/schema";

// --- Helper function for simulating delays ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Updated Message type to include execution status ---
type Message = {
  id: string;
  type: 'user' | 'ai' | 'agent-plan' | 'agent-step';
  content: string | Plan | ToolCall;
  status?: 'executing' | 'done' | 'error';
};

// --- Updated ToolIcon to show execution status ---
const ToolIcon = ({ tool, status }: { tool: ToolCall['tool'], status?: Message['status'] }) => {
    if (status === 'executing') {
        return <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />;
    }
    if (status === 'done') {
        return <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />;
    }
  
    switch (tool) {
        case 'readFile': return <File className="h-4 w-4 mr-2" />;
        case 'writeFile': return <File className="h-4 w-4 mr-2" />;
        case 'listFiles': return <File className="h-4 w-4 mr-2" />;
        case 'generateCode': return <Sparkles className="h-4 w-4 mr-2" />;
        case 'modifyCode': return <Pencil className="h-4 w-4 mr-2" />;
        case 'askUser': return <User className="h-4 w-4 mr-2" />;
        default: return <Code className="h-4 w-4 mr-2" />;
    }
};

export default function ChatInterface({ websiteName }: { websiteName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false); // State to track plan execution

  const mockFileTree = `
- src/
  - app/
    - page.tsx
    - layout.tsx
  - components/
    - Header.tsx
    - Footer.tsx
- package.json
  `;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || isLoading || isExecuting) return;

    const userMessage: Message = { id: crypto.randomUUID(), type: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, fileTree: mockFileTree }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.plan) {
        const agentPlan: Message = { id: crypto.randomUUID(), type: 'agent-plan', content: data.plan };
        setMessages((prev) => [...prev, agentPlan]);
      } else {
        throw new Error("Invalid response structure from API.");
      }

    } catch (error) {
      console.error('Failed to get agent plan:', error);
      const errorMessageContent = error instanceof Error ? error.message : 'Sorry, I was unable to create a plan.';
      const errorMessage: Message = { id: crypto.randomUUID(), type: 'ai', content: errorMessageContent };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePlan = async (plan: Plan) => {
    setIsExecuting(true);
    
    // Loop through each step in the plan
    for (const step of plan) {
        const stepMessage: Message = {
            id: crypto.randomUUID(),
            type: 'agent-step',
            content: step,
            status: 'executing',
        };
        // Add the "executing" step to the chat
        setMessages((prev) => [...prev, stepMessage]);

        // Simulate network/execution time
        await sleep(1500);

        // In a real app, you would call an API to execute the step.
        // For this simulation, we'll just mark it as 'done'.
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === stepMessage.id ? { ...msg, status: 'done' } : msg
            )
        );
    }
    
    const finalMessage: Message = {
      id: crypto.randomUUID(),
      type: 'ai',
      content: 'I have finished executing the plan. Your website should be updated.',
    };
    setMessages((prev) => [...prev, finalMessage]);
    setIsExecuting(false);
  };
  
  const renderMessage = (message: Message) => {
    switch(message.type) {
        case 'user':
            return (
                <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-lg">
                        <p>{message.content as string}</p>
                    </div>
                    <User className="h-8 w-8 rounded-full" />
                </div>
            );
        case 'ai':
             return (
                <div className="flex items-start gap-3">
                    <Bot className="h-8 w-8" />
                    <div className="bg-secondary p-3 rounded-lg max-w-lg">
                       <p>{message.content as string}</p>
                    </div>
                </div>
            );
        case 'agent-plan':
            const plan = message.content as Plan;
            return (
                 <div className="flex items-start gap-3">
                    <Bot className="h-8 w-8 text-blue-500" />
                    <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 p-4 rounded-lg w-full">
                        <p className="font-semibold mb-2">Here's my plan:</p>
                        <ul className="space-y-2">
                            {plan.map((step, index) => (
                                <li key={index} className="text-sm p-2 bg-background rounded-md flex items-center">
                                    <ToolIcon tool={step.tool} />
                                    <span>{step.reason}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex gap-2">
                            <Button size="sm" onClick={() => handleExecutePlan(plan)} disabled={isExecuting || isLoading}>
                                {isExecuting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing...</> : 'Execute Plan'}
                            </Button>
                            <Button size="sm" variant="outline" disabled={isExecuting || isLoading}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )
        case 'agent-step':
            const step = message.content as ToolCall;
            return (
                <div className="flex items-start gap-3">
                    <Bot className="h-8 w-8 text-transparent" /> {/* Placeholder for alignment */}
                    <div className="text-sm p-3 bg-secondary/50 rounded-lg flex items-center w-full max-w-lg transition-opacity duration-300">
                        <ToolIcon tool={step.tool} status={message.status} />
                        <span className={message.status === 'done' ? 'text-muted-foreground' : ''}>{step.reason}</span>
                    </div>
                </div>
            )
        default:
            return null;
    }
  }

  return (
    <Card className="flex flex-col h-full rounded-none border-0">
      <CardHeader>
        <CardTitle>AI Agent: {websiteName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-6 p-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {renderMessage(msg)}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <Bot className="h-8 w-8 animate-pulse" />
            <div className="bg-secondary p-3 rounded-lg max-w-sm">
                <p>Thinking...</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            placeholder="e.g., Turn my site into a news magazine..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isExecuting}
          />
          <Button type="submit" size="icon" disabled={isLoading || isExecuting}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}