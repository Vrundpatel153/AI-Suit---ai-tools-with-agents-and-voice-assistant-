import { useState, useEffect } from "react";
import { Clock, Eye, RotateCcw, Trash2, Download, Search, Filter } from "lucide-react";
import { getHistory, removeFromHistory, clearHistory } from "../utils/localStorageHelpers";
import { useToast } from "../hooks/use-toast";

interface HistoryEntry {
  id: string;
  timestamp: string;
  tool: string;
  excerpt: string;
  data: any;
}

const History = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTool, setFilterTool] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(getHistory());
  };

  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tool.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTool === "all" || entry.tool === filterTool;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id: string) => {
    if (removeFromHistory(id)) {
      loadHistory();
      toast({
        title: "Entry Deleted",
        description: "History entry has been removed."
      });
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
      if (clearHistory()) {
        loadHistory();
        toast({
          title: "History Cleared",
          description: "All history entries have been removed."
        });
      }
    }
  };

  const handleView = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
  };

  const handleRerun = (entry: HistoryEntry) => {
    toast({
      title: "Feature Demo",
      description: `In a full implementation, this would reopen ${entry.tool} with the previous data.`
    });
  };

  const getToolDisplayName = (tool: string) => {
    const toolNames: Record<string, string> = {
      "task-scheduler": "Task Scheduler",
      "text-summarizer": "Text Summarizer",
      "code-explainer": "Code Explainer",
      "image-caption": "Image Caption",
      "knowledge-agent": "Knowledge Agent",
      "email-assistant": "Email Assistant",
      "assistant-action": "Assistant Action"
    };
    return toolNames[tool] || tool;
  };

  const getToolColor = (tool: string) => {
    const colors: Record<string, string> = {
      "task-scheduler": "bg-peach",
      "text-summarizer": "bg-coral",
      "code-explainer": "bg-peach",
      "image-caption": "bg-coral",
      "knowledge-agent": "bg-peach",
      "email-assistant": "bg-coral",
      "assistant-action": "bg-beige"
    };
    return colors[tool] || "bg-beige";
  };

  const uniqueTools = Array.from(new Set(history.map(entry => entry.tool)));

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="hero-title text-4xl mb-4">Activity History</h1>
          <p className="hero-subtitle">
            Review your past AI interactions and results
          </p>
        </div>

        {/* Search and Filter */}
        <div className="panel p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy/60" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary w-full pl-12"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy/60" />
                <select
                  value={filterTool}
                  onChange={(e) => setFilterTool(e.target.value)}
                  className="input-primary pl-12 pr-8 appearance-none cursor-pointer"
                >
                  <option value="all">All Tools</option>
                  {uniqueTools.map(tool => (
                    <option key={tool} value={tool}>
                      {getToolDisplayName(tool)}
                    </option>
                  ))}
                </select>
              </div>
              
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="btn-accent flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="panel p-12 text-center">
            <Clock className="w-16 h-16 text-navy/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-navy mb-2">
              {history.length === 0 ? "No History Yet" : "No Results Found"}
            </h3>
            <p className="text-navy/70">
              {history.length === 0 
                ? "Start using AI tools to see your activity history here."
                : "Try adjusting your search terms or filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="panel p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`${getToolColor(entry.tool)} text-navy px-3 py-1 rounded-lg border-2 border-navy text-sm font-semibold`}>
                        {getToolDisplayName(entry.tool)}
                      </span>
                      <span className="text-sm text-navy/60 flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </span>
                    </div>
                    
                    <p className="text-navy font-medium mb-2">{entry.excerpt}</p>
                    
                    {entry.data && (
                      <div className="text-sm text-navy/70">
                        {entry.tool === "task-scheduler" && entry.data.title && (
                          <span>Event: {entry.data.title} on {entry.data.date}</span>
                        )}
                        {entry.tool === "text-summarizer" && entry.data.wordCount && (
                          <span>Summarized {entry.data.wordCount} words</span>
                        )}
                        {entry.tool === "code-explainer" && entry.data.language && (
                          <span>Language: {entry.data.language}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleView(entry)}
                      className="p-2 bg-peach border-2 border-navy rounded-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-navy" />
                    </button>
                    
                    <button
                      onClick={() => handleRerun(entry)}
                      className="p-2 bg-beige border-2 border-navy rounded-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                      title="Re-run"
                    >
                      <RotateCcw className="w-4 h-4 text-navy" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 bg-coral border-2 border-navy rounded-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entry Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
            <div className="panel max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="result-panel-header">
                <h3 className="result-panel-title">
                  {getToolDisplayName(selectedEntry.tool)} - Details
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="btn-copy"
                >
                  Close
                </button>
              </div>
              
              <div className="result-panel-content">
                <div className="mb-4">
                  <h4 className="font-semibold text-navy mb-2">Timestamp:</h4>
                  <p className="text-navy/80">{new Date(selectedEntry.timestamp).toLocaleString()}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-navy mb-2">Summary:</h4>
                  <p className="text-navy/80">{selectedEntry.excerpt}</p>
                </div>
                
                {selectedEntry.data && (
                  <div>
                    <h4 className="font-semibold text-navy mb-2">Data:</h4>
                    <pre className="code-block text-xs">
                      {JSON.stringify(selectedEntry.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;