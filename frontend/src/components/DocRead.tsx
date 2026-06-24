import { useState, useRef, useEffect } from "react";

export default function DocRead() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSummary(null);
    }
  };

  const handleRead = () => {
    if (!file) return;

    setIsReading(true);
    setSummary(null);

    // Simulate AI reading and summarizing delay
    setTimeout(() => {
      let docType = "Other";
      const fileName = file.name.toLowerCase();
      
      if (fileName.includes("resume") || fileName.includes("cv")) docType = "Resume / CV";
      else if (fileName.includes("report")) docType = "Report";
      else if (fileName.includes("proposal")) docType = "Proposal";
      else if (fileName.includes("invoice")) docType = "Invoice";
      else if (fileName.includes("legal")) docType = "Legal Document";
      else if (fileName.includes("meeting") || fileName.includes("notes")) docType = "Meeting Notes";
      else if (fileName.includes("tech") || fileName.includes("doc")) docType = "Technical Documentation";
      else if (fileName.includes("marketing") || fileName.includes("brochure")) docType = "Marketing Material";
      else if (fileName.includes("presentation")) docType = "Presentation";
      else if (fileName.includes("plan")) docType = "Business Plan";
      else if (fileName.includes("article") || fileName.includes("blog")) docType = "Article / Blog";
      else if (fileName.includes("letter")) docType = "Letter";

      let summaryContent = `• The document specifically references a scheduled maintenance window on August 15th.
• It lists exactly three required updates for the database schema.
• The file explicitly states a budget constraint of $5,000 for the upcoming phase.
• It mandates a code freeze beginning 48 hours prior to the deployment.`;

      let highlightContent = `• Requires final approval from the engineering lead before Tuesday.
• Identifies server capacity as the primary limiting factor.
• Contains a direct link to the migration script repository.`;

      // Specific overrides
      if (docType === "Resume / CV") {
        summaryContent = `• Candidate explicitly lists 3 years of experience as a Frontend Developer at Company X.
• The skills section specifically names React, TypeScript, and TailwindCSS.
• Includes a B.S. in Computer Science from University Y, obtained in May 2021.
• Mentions leading the migration of a legacy portal to a modern React architecture.`;
        highlightContent = `• Highlighted achievement: Reduced bundle size from 2MB to 800KB.
• Contact information includes phone number and a GitHub profile link.
• Specifically states availability to start within 2 weeks.`;
      } else if (docType === "Marketing Material") {
        summaryContent = `• Target Audience explicitly identified as "first-time homebuyers aged 25-35".
• Main Offerings listed are mortgage calculators and 1-on-1 advisor sessions.
• Key Benefit stated in the text: "Save up to 2% on your closing costs".
• Call to Action: "Call 1-800-555-0199 to schedule a free consultation".`;
        highlightContent = `• Promotes a limited-time offer expiring on October 31st.
• Quotes a direct testimonial from a recent client named Sarah J.
• Specifically highlights the absence of hidden application fees.`;
      }

      const mockSummary = `Document Type: ${docType}

Summary:
${summaryContent}

Key Highlights:
${highlightContent}`;
      
      setSummary(mockSummary);
      setIsReading(false);
    }, 2500);
  };

  return (
    <div className="flex-1 h-full bg-[#FAFAF8] overflow-y-auto flex">
      {/* Left Panel: Upload and Summary */}
      <div className={`py-10 px-6 overflow-y-auto transition-all duration-300 ${file ? "w-1/2 border-r border-[#F0F0EE] bg-white" : "w-full max-w-2xl mx-auto bg-[#FAFAF8]"}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Read & Summarize Document</h2>
          <p className="text-sm text-[#8A8A8E] mt-2">Upload a document and our AI will analyze it.</p>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed border-[#E5E5E3] rounded-2xl p-8 text-center hover:bg-[#F4F4F2] hover:border-[#4338CA]/50 transition cursor-pointer ${!file ? "bg-white shadow-sm" : "bg-[#FAFAF8]"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            
            <div className="h-12 w-12 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-4 text-[#4338CA]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            
            {file ? (
              <div>
                <p className="text-sm font-semibold text-[#4338CA]">{file.name}</p>
                <p className="text-xs text-[#8A8A8E] mt-1">{(file.size / 1024).toFixed(1)} KB • Click to change file</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Click to upload a document</p>
                <p className="text-xs text-[#8A8A8E] mt-1">Supports .pdf, .doc, .docx</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleRead}
              disabled={isReading || !file}
              className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#4338CA]/20"
            >
              {isReading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                  </svg>
                  Reading Document...
                </>
              ) : (
                "Read & Analyze"
              )}
            </button>
          </div>

          {/* Summary Result */}
          {summary && (
            <div className="mt-8 pt-8 border-t border-[#F0F0EE] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Document Analysis
              </h3>
              <div className="bg-[#EEF2FF]/30 border border-[#4338CA]/20 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed font-medium">
                  {summary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Document Preview */}
      {file && (
        <div className="w-1/2 h-full bg-[#E5E5E3] flex flex-col p-4 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between bg-white px-4 py-2 rounded-t-xl border border-[#D1D1CE] border-b-0">
            <span className="text-sm font-semibold text-[#1A1A1A] truncate">{file.name}</span>
            <span className="text-xs text-[#8A8A8E]">Preview</span>
          </div>
          <div className="flex-1 bg-white border border-[#D1D1CE] rounded-b-xl overflow-hidden shadow-inner flex items-center justify-center">
            {file.type === "application/pdf" ? (
              <iframe 
                src={`${fileUrl}#toolbar=0`} 
                className="w-full h-full border-none" 
                title="Document Preview"
              />
            ) : (
              <div className="text-center p-8">
                <div className="h-16 w-16 bg-[#F4F4F2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8A8A8E]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#1A1A1A] mb-1">Preview not fully supported</p>
                <p className="text-xs text-[#8A8A8E]">Word documents cannot be previewed natively in the browser. The AI is analyzing the file contents.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
