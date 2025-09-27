"use client";

import ChatInterface from "@/components/ChatInterface";

type EditorClientProps = {
  websiteName: string;
  repoName: string;
  serviceUrl: string; // ✅ Now we get the URL as a prop
};

export default function EditorClient({ websiteName, repoName, serviceUrl }: EditorClientProps) {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full">
      <div className="w-1/3 border-r bg-muted/40">
        <ChatInterface websiteName={websiteName} />
      </div>

      <div className="w-2/3 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        {/* We now directly use the URL to display the iframe */}
        <iframe
          src={serviceUrl}
          className="h-full w-full border-0"
          title={`Live preview of ${websiteName}`}
        />
      </div>
    </div>
  );
}