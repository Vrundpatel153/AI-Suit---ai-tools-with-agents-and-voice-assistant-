import { useState } from "react";
import { Calendar, Mail, BookOpen, FileText, Code, Image } from "lucide-react";
import ToolGrid from "../components/ToolGrid";
import TaskSchedulerModal from "../components/modals/TaskSchedulerModal";
import TextSummarizerModal from "../components/modals/TextSummarizerModal";
import CodeExplainerModal from "../components/modals/CodeExplainerModal";
import ImageCaptionModal from "../components/modals/ImageCaptionModal";
import KnowledgeAgentModal from "../components/modals/KnowledgeAgentModal";
import EmailAssistantModal from "../components/modals/EmailAssistantModal";

const tools = [
  {
    id: "task-scheduler",
    title: "Task Scheduler",
    description: "Schedule meetings and events with natural language",
    icon: Calendar,
    color: "bg-peach",
    category: "Productivity"
  },
  {
    id: "email-assistant",
    title: "Email Assistant",
    description: "Draft, reply, and manage emails intelligently",
    icon: Mail,
    color: "bg-coral",
    category: "Communication"
  },
  {
    id: "knowledge-agent",
    title: "Knowledge Agent",
    description: "Search and analyze documents for insights",
    icon: BookOpen,
    color: "bg-peach",
    category: "Research"
  },
  {
    id: "text-summarizer",
    title: "Text Summarizer",
    description: "Create concise summaries of long content",
    icon: FileText,
    color: "bg-coral",
    category: "Content"
  },
  {
    id: "code-explainer",
    title: "Code Explainer",
    description: "Understand and document code functionality",
    icon: Code,
    color: "bg-peach",
    category: "Development"
  },
  {
    id: "image-caption",
    title: "Image Caption",
    description: "Generate descriptions and alt text for images",
    icon: Image,
    color: "bg-coral",
    category: "Content"
  }
];

const AITools = () => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [modalPrefill, setModalPrefill] = useState<any>(null);

  const openTool = (toolId: string, prefill?: any) => {
    setSelectedTool(toolId);
    setModalPrefill(prefill || null);
  };

  const closeTool = () => {
    setSelectedTool(null);
    setModalPrefill(null);
  };

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="hero-title mb-4">AI Tools & Agents</h1>
          <p className="text-xl text-navy/70 leading-relaxed">
            Choose from our collection of specialized AI agents to help with your tasks
          </p>
        </div>

        {/* Tool Grid */}
        <ToolGrid tools={tools} onToolSelect={openTool} />
      </div>

      {/* Tool Modals */}
      {selectedTool === "task-scheduler" && (
        <TaskSchedulerModal 
          isOpen={true} 
          onClose={closeTool} 
          prefill={modalPrefill}
        />
      )}
      
      {selectedTool === "text-summarizer" && (
        <TextSummarizerModal 
          isOpen={true} 
          onClose={closeTool} 
          prefill={modalPrefill}
        />
      )}
      
      {selectedTool === "code-explainer" && (
        <CodeExplainerModal 
          isOpen={true} 
          onClose={closeTool} 
          prefill={modalPrefill}
        />
      )}
      
      {selectedTool === "image-caption" && (
        <ImageCaptionModal 
          isOpen={true} 
          onClose={closeTool} 
          prefill={modalPrefill}
        />
      )}
      
      {selectedTool === "knowledge-agent" && (
        <KnowledgeAgentModal 
          isOpen={true} 
          onClose={closeTool} 
          prefill={modalPrefill}
        />
      )}
      
      {selectedTool === "email-assistant" && (
        <EmailAssistantModal 
          isOpen={true} 
          onClose={closeTool} 
          prefill={modalPrefill}
        />
      )}
    </div>
  );
};

export default AITools;