import { Link, useLocation } from "react-router-dom";
import { X, Home, MessageSquare, History as HistoryIcon, Settings, Info, Zap } from "lucide-react";
import { getHistory } from "../utils/localStorageHelpers";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const history = getHistory();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/ai-tools", icon: MessageSquare, label: "AI Tools & Agents" },
    { path: "/assistant", icon: MessageSquare, label: "AI Assistant" },
    { 
      path: "/history", 
      icon: HistoryIcon, 
      label: "Activity History",
      badge: history.length > 0 ? (history.length > 9 ? "9+" : history.length.toString()) : undefined
    },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/about", icon: Info, label: "About" },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-beige border-r-3 border-navy pt-[0.5px] lg:pt-0 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top separator line under navbar overlap (mobile) */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-navy/20 lg:hidden" />
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-navy lg:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-peach border-2 border-navy rounded-md flex items-center justify-center shadow-offset-small">
                <span className="text-navy font-black text-sm">A</span>
              </div>
              <span className="text-lg font-black text-navy">AiSuite</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-peach/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-navy" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-2">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-3">
                Navigation
              </h3>
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-peach text-navy font-semibold shadow-offset-small"
                        : "text-navy hover:bg-peach/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="badge-count">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t-2 border-navy/20">
              <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-3">
                Quick Tools
              </h3>
              <div className="space-y-1">
                <button className="flex items-center space-x-3 w-full px-4 py-3 text-navy hover:bg-peach/20 rounded-lg transition-colors">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Quick Prompt</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-navy">
            <div className="text-center">
              <p className="text-xs text-navy/60 font-semibold tracking-wide">
                Multi-agent AI Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;