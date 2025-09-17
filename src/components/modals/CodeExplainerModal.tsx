import { useState } from "react";
import { Code, Copy, AlertTriangle, Lightbulb } from "lucide-react";
import BaseModal from "./BaseModal";
import { mockLLM } from "../../utils/mockLLM";
import { saveToHistory } from "../../utils/localStorageHelpers";
import { useToast } from "../../hooks/use-toast";

interface CodeExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { text?: string };
}

const CodeExplainerModal = ({ isOpen, onClose, prefill }: CodeExplainerModalProps) => {
  const [inputCode, setInputCode] = useState(prefill?.text || "");
  const [explanation, setExplanation] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleExplain = async () => {
    if (!inputCode.trim()) return;

    setIsProcessing(true);

    try {
      const result = await mockLLM.explainCode(inputCode);
      setExplanation(result);
      
      saveToHistory({
        tool: "code-explainer",
        excerpt: `Explained ${inputCode.split('\n').length} lines of code`,
        data: { explanation: result.explanation, language: "javascript" }
      });
    } catch (error) {
      toast({
        title: "Explanation Error",
        description: "Failed to explain the code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyExplanation = async () => {
    if (!explanation) return;
    
    try {
      await navigator.clipboard.writeText(explanation.explanation);
      toast({
        title: "Copied!",
        description: "Explanation copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Code Explainer" maxWidth="max-w-5xl">
      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Code to explain
          </label>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Paste your code here for detailed explanation..."
            className="textarea-primary w-full h-64 font-mono text-sm"
            disabled={isProcessing}
          />
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-navy/60">
              {inputCode.split('\n').length} lines, {inputCode.length} characters
            </span>
            
            <button
              onClick={handleExplain}
              disabled={!inputCode.trim() || isProcessing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                "Explain Code"
              )}
            </button>
          </div>
        </div>

        {/* Explanation Result */}
        {explanation && (
          <div className="space-y-4">
            {/* Main Explanation */}
            <div className="panel-small p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Code Explanation</span>
                </h3>
                
                <button
                  onClick={handleCopyExplanation}
                  className="btn-copy flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              
              <div className="text-navy/80 leading-relaxed">
                {explanation.explanation}
              </div>
            </div>

            {/* Warnings */}
            {explanation.warnings && explanation.warnings.length > 0 && (
              <div className="panel-small p-4 border-coral">
                <h4 className="font-semibold text-navy flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-coral" />
                  <span>Potential Issues</span>
                </h4>
                <ul className="space-y-2">
                  {explanation.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-navy/80 text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestion */}
            {explanation.suggestion && (
              <div className="panel-small p-4 border-peach">
                <h4 className="font-semibold text-navy flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-peach" />
                  <span>Improvement Suggestion</span>
                </h4>
                <p className="text-navy/80 text-sm">
                  {explanation.suggestion}
                </p>
              </div>
            )}
            
            {/* Code Display */}
            <div className="panel-small p-4">
              <h4 className="font-semibold text-navy mb-3">Original Code</h4>
              <div className="code-block">
                <pre className="text-xs leading-relaxed">
                  <code>{inputCode}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default CodeExplainerModal;