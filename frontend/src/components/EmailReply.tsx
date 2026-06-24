import { useState } from "react";

export default function EmailReply({ userEmail }: { userEmail: string }) {
  const [sender, setSender] = useState(userEmail || "");
  const [receiver, setReceiver] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleGenerate = () => {
    if (!receiver || !originalContent || !sender) {
      setStatusMessage({ type: "error", text: "Please provide sender, receiver email, and original content." });
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(sender)) {
      setStatusMessage({ type: "error", text: "Sender email must be a valid @gmail.com address." });
      return;
    }
    if (!gmailRegex.test(receiver)) {
      setStatusMessage({ type: "error", text: "Receiver email must be a valid @gmail.com address." });
      return;
    }
    if (sender.toLowerCase() === receiver.toLowerCase()) {
      setStatusMessage({ type: "error", text: "Sender and receiver emails cannot be the same." });
      return;
    }
    
    setStatusMessage(null);
    setIsGenerating(true);
    
    // Simulate API call to generate AI reply
    setTimeout(() => {
      const mockReply = `Hi there,\n\nThank you for reaching out regarding the following:\n"${originalContent.substring(0, 50)}..."\n\nI appreciate your input. Let's discuss this further soon.\n\nBest regards,\n${sender}`;
      setGeneratedReply(mockReply);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!generatedReply) {
      setStatusMessage({ type: "error", text: "No reply generated to send." });
      return;
    }
    
    setStatusMessage(null);
    setIsSending(true);
    
    // Simulate API call to send the email
    setTimeout(() => {
      setIsSending(false);
      setGeneratedReply("");
      setReceiver("");
      setOriginalContent("");
      setStatusMessage({ type: "success", text: "Reply sent successfully!" });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    }, 1200);
  };

  return (
    <div className="flex-1 h-full bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Email Reply Generator</h2>
        
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === "success" ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"
          }`}>
            {statusMessage.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1A1A1A]">Sender Email</label>
              <input
                type="email"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E3] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#4338CA] focus:bg-white transition"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#1A1A1A]">Receiver Email</label>
              <input
                type="email"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E3] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#4338CA] focus:bg-white transition"
                placeholder="recipient@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#1A1A1A]">Original Email Content</label>
            <textarea
              value={originalContent}
              onChange={(e) => setOriginalContent(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-[#E5E5E3] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#4338CA] focus:bg-white transition resize-none"
              placeholder="Paste the email you received here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !originalContent || !receiver}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Reply"
              )}
            </button>
          </div>

          {/* Generated Reply Section */}
          {generatedReply !== "" && (
            <div className="mt-8 space-y-4 pt-8 border-t border-[#F0F0EE] animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">AI Generated Reply (Edit if needed)</label>
                <textarea
                  value={generatedReply}
                  onChange={(e) => setGeneratedReply(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-[#4338CA]/30 bg-[#EEF2FF]/30 px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#4338CA] focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setGeneratedReply("")}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-[#4A4A4E] hover:bg-[#F4F4F2] transition"
                >
                  Discard
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] transition shadow-md shadow-[#10B981]/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Approve & Send"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
