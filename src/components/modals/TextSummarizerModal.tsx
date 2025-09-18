import { useState } from "react";
import { FileText, Copy, Download } from "lucide-react";
import BaseModal from "./BaseModal";
import { mockLLM } from "../../utils/mockLLM";
import { saveToHistory } from "../../utils/localStorageHelpers";
import { useToast } from "../../hooks/use-toast";

interface TextSummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { text?: string };
}

const TextSummarizerModal = ({ isOpen, onClose, prefill }: TextSummarizerModalProps) => {
  const [inputText, setInputText] = useState(prefill?.text || "");
  const [summary, setSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    const words = inputText.trim().split(/\s+/).length;
    setWordCount(words);

    try {
      const result = await mockLLM.summarize(inputText);
      setSummary(result);
      
      saveToHistory({
        tool: "text-summarizer",
        excerpt: `Summarized ${words} words of text`,
        data: { summary: result, wordCount: words }
      });
    } catch (error) {
      toast({
        title: "Summarization Error",
        description: "Failed to summarize the text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      toast({
        title: "Copied!",
        description: "Summary copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!summary) return;
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `summary-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Summary saved as text file."
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Text Summarizer">
      <div className="space-y-8 relative">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            {/* Input Section */}
            <div>
              <label className="block text-xs font-bold tracking-wide text-navy/70 uppercase mb-2">
                Input Text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your long text here to get a concise summary..."
                className="textarea-primary w-full h-56"
                disabled={isProcessing}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-medium text-navy/60">
                  {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
                </span>
                <button
                  onClick={handleSummarize}
                  disabled={!inputText.trim() || isProcessing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Summarizing...</span>
                    </div>
                  ) : (
                    "Summarize"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            {summary && (
              <div className="panel-small p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-navy flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Summary</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={handleCopy} className="btn-copy flex items-center space-x-1">
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button onClick={handleDownload} className="btn-copy flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
                <div className="text-navy/80 text-sm leading-relaxed mb-4 flex-1 overflow-y-auto">
                  {summary}
                </div>
                <div className="text-[11px] text-navy/60 bg-beige/50 p-2 rounded border border-navy/10">
                  Original: {wordCount} words → Summary: ~{summary.split(' ').length} words ({Math.round((1 - summary.split(' ').length / wordCount) * 100)}% reduction)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default TextSummarizerModal;