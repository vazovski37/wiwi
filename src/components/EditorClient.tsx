"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/ChatInterface";

type EditorClientProps = {
  websiteName: string;
  repoName: string;
};

export default function EditorClient({ websiteName, repoName }: EditorClientProps) {
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/editor/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoName }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to start editing session.');
        }

        const { url } = await response.json();
        setSessionUrl(url);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    startSession();
  }, [repoName]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full">
      <div className="w-1/3 border-r bg-muted/40">
        <ChatInterface websiteName={websiteName} />
      </div>

      <div className="w-2/3 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        {isLoading && <p className="text-muted-foreground animate-pulse">🚀 Starting live editing session...</p>}
        {error && <p className="text-destructive font-semibold text-center p-4">Error: {error}</p>}
        {sessionUrl && (
          <iframe
            src={sessionUrl}
            className="h-full w-full border-0"
            title={`Preview of ${websiteName}`}
          />
        )}
      </div>
    </div>
  );
}