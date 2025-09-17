import { useState } from "react";
import { BookOpen, Search, Upload, MessageSquare } from "lucide-react";
import BaseModal from "./BaseModal";
import { mockLLM } from "../../utils/mockLLM";
import { saveToHistory } from "../../utils/localStorageHelpers";
import { useToast } from "../../hooks/use-toast";

interface KnowledgeAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { text?: string };
}

interface QAResult {
  answer: string;
  snippet: string;
  confidence: number;
}

const KnowledgeAgentModal = ({ isOpen, onClose, prefill }: KnowledgeAgentModalProps) => {
  const [document, setDocument] = useState("");
  const [question, setQuestion] = useState(prefill?.text || "");
  const [isIndexing, setIsIndexing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAResult[]>([]);
  const { toast } = useToast();

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocument(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleIndex = async () => {
    if (!document.trim()) {
      toast({
        title: "No Document",
        description: "Please add a document to index.",
        variant: "destructive"
      });
      return;
    }

    setIsIndexing(true);
    
    // Simulate indexing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIndexed(true);
    setIsIndexing(false);
    
    toast({
      title: "Document Indexed",
      description: `Successfully indexed ${document.split(' ').length} words.`
    });
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !indexed) return;

    setIsQuerying(true);

    try {
      const result = await mockLLM.qa(question, document);
      setQaHistory(prev => [result, ...prev]);
      setQuestion("");
      
      saveToHistory({
        tool: "knowledge-agent",
        excerpt: `Asked: "${question}"`,
        data: { question, answer: result.answer }
      });
    } catch (error) {
      toast({
        title: "Query Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Knowledge Agent" maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Document Content
            </label>
            
            <div className="space-y-3">
              <textarea
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Paste your document content here or upload a file..."
                className="textarea-primary w-full h-48"
                disabled={isIndexing}
              />
              
              <div className="flex items-center gap-3">
                <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept=".txt,.md,.csv"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={handleIndex}
                  disabled={!document.trim() || isIndexing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isIndexing ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Indexing...</span>
                    </div>
                  ) : indexed ? (
                    "Re-index Document"
                  ) : (
                    "Index Document"
                  )}
                </button>
              </div>
              
              {document && (
                <div className="text-xs text-navy/60">
                  {document.split(' ').length} words, {document.length} characters
                </div>
              )}
              
              {indexed && (
                <div className="panel-small p-3 bg-peach/20">
                  <div className="flex items-center space-x-2 text-sm font-medium text-navy">
                    <BookOpen className="w-4 h-4" />
                    <span>Document ready for questions</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Q&A Interface */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Ask Questions
            </label>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know about this document?"
                  className="input-primary flex-1"
                  disabled={!indexed || isQuerying}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                />
                
                <button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || !indexed || isQuerying}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isQuerying ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {!indexed && (
                <div className="text-sm text-navy/60 bg-beige/50 p-3 rounded border border-navy/20">
                  💡 Index a document first to start asking questions
                </div>
              )}
            </div>
          </div>

          {/* Q&A History */}
          {qaHistory.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-navy flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Q&A History</span>
              </h4>
              
              {qaHistory.map((qa, index) => (
                <div key={index} className="panel-small p-4 space-y-3">
                  <div className="text-sm font-medium text-navy">
                    Q: {question}
                  </div>
                  
                  <div className="text-sm text-navy/80">
                    A: {qa.answer}
                  </div>
                  
                  {qa.snippet && (
                    <div className="text-xs bg-peach/20 p-2 rounded border border-peach/40">
                      <strong>Relevant snippet:</strong> {qa.snippet}
                    </div>
                  )}
                  
                  <div className="text-xs text-navy/60">
                    Confidence: {Math.round(qa.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default KnowledgeAgentModal;