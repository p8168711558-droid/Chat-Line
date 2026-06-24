import { useState } from "react";

export default function DocGenerate() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setDownloadUrl(null);

    // Simulate AI generation delay
    setTimeout(() => {
      const content = `Project Proposal based on: "${prompt}"

1. Introduction
This document provides an overview and foundational plan for the requested project. It outlines the key features, technology stack, and projected timeline.

2. Key Features
- User Authentication
- Task Creation
- Notifications

3. Technology Stack
- React
- Node.js
- PostgreSQL

4. Timeline
Week 1: Planning
Week 2: Development

5. Conclusion
This proposal serves as a baseline for the development lifecycle. Adjustments can be made as the project requirements evolve.`;
      
      const blob = new Blob([content], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="flex-1 h-full bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Generate Document</h2>
          <p className="text-sm text-[#8A8A8E] mt-2">Enter a prompt and our AI will generate a structured document for you.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#1A1A1A]">What would you like the document to be about?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-[#E5E5E3] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#4338CA] focus:bg-white transition resize-none shadow-sm"
              placeholder="e.g. Write a project proposal for a new mobile chat application..."
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#4338CA]/20"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                  </svg>
                  Processing...
                </>
              ) : (
                "Generate Doc"
              )}
            </button>
          </div>

          {downloadUrl && (
            <div className="mt-8 p-6 bg-[#ECFDF5] border border-[#10B981]/20 rounded-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-12 w-12 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#047857] mb-1">Document Ready!</h3>
              <p className="text-sm text-[#065F46] mb-4">Your AI generated document is ready for download.</p>
              <a
                href={downloadUrl}
                download="AI_Generated_Document.doc"
                className="inline-block px-6 py-2.5 rounded-full text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] transition shadow-md shadow-[#10B981]/20"
              >
                Download .doc File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
