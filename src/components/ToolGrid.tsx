import React from "react";
import { LucideIcon } from "lucide-react";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
}

interface ToolGridProps {
  tools: Tool[];
  onToolSelect: (toolId: string) => void;
}

const ToolGrid = ({ tools, onToolSelect }: ToolGridProps) => {
  const categories = Array.from(new Set(tools.map(tool => tool.category)));

  return (
    <div className="space-y-12">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-xl font-bold text-navy mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-coral rounded-full"></div>
            <span>{category}</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {tools
              .filter(tool => tool.category === category)
              .map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => onToolSelect(tool.id)}
                  className="tool-card group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-14 h-14 ${tool.color} border-2 border-navy rounded-xl flex items-center justify-center shadow-offset-small group-hover:animate-float flex-shrink-0`}>
                      <tool.icon className="w-7 h-7 text-navy" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-navy mb-2 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-navy/80 text-sm leading-relaxed mb-4">
                        {tool.description}
                      </p>
                      
                      <button className="btn-copy group-hover:bg-coral group-hover:text-white transition-all">
                        Start Tool
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToolGrid;