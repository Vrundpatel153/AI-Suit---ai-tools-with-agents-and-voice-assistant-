import { useState } from "react";
import { Play, Zap } from "lucide-react";

interface HeroSectionProps {
  onQuickRun: (text: string) => void;
}

const HeroSection = ({ onQuickRun }: HeroSectionProps) => {
  const [quickPrompt, setQuickPrompt] = useState("");

  const handleQuickRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPrompt.trim()) {
      onQuickRun(quickPrompt.trim());
      setQuickPrompt("");
    }
  };

  return (
    <div className="bg-cream py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Title */}
        <div className="mb-8">
          <h1 className="hero-title mb-6">
            AiSuite — your multi-agent AI studio
          </h1>
          <p className="hero-subtitle max-w-3xl mx-auto">
            Harness the power of specialized AI agents for scheduling, content analysis, 
            code explanation, and more. All in one beautifully designed interface.
          </p>
        </div>

        {/* Quick Action Card */}
        <div className="panel p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-peach border-2 border-navy rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-navy" />
            </div>
            <h2 className="text-2xl font-bold text-navy">Quick AI Prompt</h2>
          </div>

          <form onSubmit={handleQuickRun} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Schedule a meeting, summarize text, explain code, or ask anything..."
                className="input-primary w-full text-lg py-4"
                maxLength={200}
              />
              <div className="absolute bottom-2 right-3 text-xs text-navy/50">
                {quickPrompt.length}/200
              </div>
            </div>

            <button
              type="submit"
              disabled={!quickPrompt.trim()}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6" />
              <span>Run AI Assistant</span>
            </button>
          </form>

          <div className="mt-6 text-sm text-navy/70">
            <p>
              💡 Try: "Schedule a team meeting for tomorrow at 2pm" or "Summarize this document"
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-peach border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">Smart Agents</h3>
            <p className="text-navy/70">Specialized AI for every task</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-coral border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">Instant Results</h3>
            <p className="text-navy/70">Get answers in seconds</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-peach border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">Purpose-Built</h3>
            <p className="text-navy/70">Tools designed for productivity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;