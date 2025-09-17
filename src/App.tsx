import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AITools from "./pages/AITools";
import AssistantCenter from "./pages/AssistantCenter";
import History from "./pages/History";
import Settings from "./pages/Settings";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import DevModeBanner from "./components/DevModeBanner";
import { getDevMode, seedSampleData, isAuthenticated } from "./utils/localStorageHelpers";

const queryClient = new QueryClient();

const App = () => {
  const [devMode, setDevMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize dev mode and seed sample data
    setDevMode(getDevMode());
    seedSampleData();
  }, []);

  const isUserAuthenticated = isAuthenticated();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!isUserAuthenticated ? (
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <div className="min-h-screen bg-cream">
              {!devMode && <DevModeBanner />}
              
              <Navbar 
                devMode={devMode} 
                setDevMode={setDevMode}
                onMenuClick={() => setSidebarOpen(true)}
              />
              
              <div className="flex">
                <Sidebar 
                  isOpen={sidebarOpen} 
                  onClose={() => setSidebarOpen(false)} 
                />
                
                <main className="flex-1 min-h-[calc(100vh-4rem)]">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ai-tools" element={<AITools />} />
                    <Route path="/assistant" element={<AssistantCenter />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/about" element={<About />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
