import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Zap, FileText, TrendingUp, Users, Calendar } from "lucide-react";
import HeroSection from "../components/HeroSection";
import { getHistory } from "../utils/localStorageHelpers";


const Dashboard = () => {
  const navigate = useNavigate();
  const history = getHistory();

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <HeroSection onQuickRun={(text) => navigate("/ai-tools")} />

        {/* Quick Access */}
        <div className="mb-12">
          <h2 className="section-title mb-8">Quick Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => navigate("/ai-tools")}
              className="panel p-6 text-left hover:shadow-offset-large transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-peach border-2 border-navy rounded-lg mb-4 flex items-center justify-center">
                <Zap className="w-6 h-6 text-navy" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">AI Tools & Agents</h3>
              <p className="text-navy/70">Access all specialized AI agents</p>
            </button>
            
            <button 
              onClick={() => navigate("/assistant")}
              className="panel p-6 text-left hover:shadow-offset-large transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-coral border-2 border-navy rounded-lg mb-4 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">AI Assistant</h3>
              <p className="text-navy/70">Chat with your AI assistant</p>
            </button>
            
            <button 
              onClick={() => navigate("/history")}
              className="panel p-6 text-left hover:shadow-offset-large transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-peach border-2 border-navy rounded-lg mb-4 flex items-center justify-center">
                <FileText className="w-6 h-6 text-navy" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Activity History</h3>
              <p className="text-navy/70">{history.length} recent activities</p>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-12">
          <h2 className="section-title mb-8">Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="panel p-6 text-center">
              <div className="w-12 h-12 bg-peach border-2 border-navy rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-6 h-6 text-navy" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-1">6+</h3>
              <p className="text-navy/70 text-sm">AI Tools Available</p>
            </div>
            
            <div className="panel p-6 text-center">
              <div className="w-12 h-12 bg-coral border-2 border-navy rounded-lg mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-1">{history.length}</h3>
              <p className="text-navy/70 text-sm">Activities Completed</p>
            </div>
            
            <div className="panel p-6 text-center">
              <div className="w-12 h-12 bg-peach border-2 border-navy rounded-lg mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-navy" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-1">100%</h3>
              <p className="text-navy/70 text-sm">Success Rate</p>
            </div>
            
            <div className="panel p-6 text-center">
              <div className="w-12 h-12 bg-coral border-2 border-navy rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-1">24/7</h3>
              <p className="text-navy/70 text-sm">Available</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Recent Activity</h2>
              <button 
                onClick={() => navigate("/history")}
                className="btn-outline"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {history.slice(0, 3).map((item) => (
                <div key={item.id} className="panel p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-navy">{item.excerpt}</h3>
                    <p className="text-sm text-navy/60">
                      {item.tool} • {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    className="btn-copy"
                    onClick={() => navigate("/history")}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;