import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Settings as SettingsIcon, Zap, ZapOff, User, LogOut, ChevronDown } from "lucide-react";
import { setDevMode, getHistory, getCurrentUser, logoutUser } from "../utils/localStorageHelpers";

interface NavbarProps {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
  onMenuClick: () => void;
}

const Navbar = ({ devMode, setDevMode: setDevModeState, onMenuClick }: NavbarProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const history = getHistory();
  const currentUser = getCurrentUser();

  const handleDevModeToggle = () => {
    const newMode = !devMode;
    setDevMode(newMode);
    setDevModeState(newMode);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    setShowUserMenu(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="h-16 bg-beige border-b-3 border-navy flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Logo and main nav */}
      <div className="flex items-center space-x-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-peach/20 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-navy" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-peach border-2 border-navy rounded-lg flex items-center justify-center shadow-offset-small">
            <span className="text-navy font-black text-lg">A</span>
          </div>
          <span className="text-2xl font-black text-navy">AiSuite</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          <Link
            to="/"
            className={isActive("/") ? "nav-link-active" : "nav-link"}
          >
            Home
          </Link>
          <Link
            to="/ai-tools"
            className={isActive("/ai-tools") ? "nav-link-active" : "nav-link"}
          >
            AI Tools
          </Link>
          <Link
            to="/assistant"
            className={isActive("/assistant") ? "nav-link-active" : "nav-link"}
          >
            Assistant
          </Link>
          <Link
            to="/history"
            className={`${isActive("/history") ? "nav-link-active" : "nav-link"} relative`}
          >
            History
            {history.length > 0 && (
              <span className="badge-count absolute -top-1 -right-1">
                {history.length > 9 ? "9+" : history.length}
              </span>
            )}
          </Link>
          <Link
            to="/settings"
            className={isActive("/settings") ? "nav-link-active" : "nav-link"}
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Right side - Dev mode toggle and demo badge */}
      <div className="flex items-center space-x-4">
        {/* Dev Mode Toggle */}
        <button
          onClick={handleDevModeToggle}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 border-navy transition-all duration-200 ${
            devMode 
              ? "bg-peach text-navy shadow-offset-small hover:translate-x-1 hover:translate-y-1 hover:shadow-none" 
              : "bg-beige text-navy/60 hover:bg-beige/80"
          }`}
          title={devMode ? "Dev Mode: ON" : "Dev Mode: OFF"}
        >
          {devMode ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          <span className="hidden sm:inline text-sm font-semibold">
            DEV {devMode ? "ON" : "OFF"}
          </span>
        </button>

        {/* User Profile */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border-2 border-navy bg-beige hover:bg-peach/20 transition-colors"
            >
              <div className="w-8 h-8 bg-peach border-2 border-navy rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-navy" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-navy">
                {currentUser.name}
              </span>
              <ChevronDown className="w-4 h-4 text-navy" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 panel py-2 z-50">
                <div className="px-4 py-2 border-b-2 border-navy/20">
                  <p className="text-sm font-semibold text-navy">{currentUser.name}</p>
                  <p className="text-xs text-navy/60">{currentUser.email}</p>
                </div>
                
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-4 py-2 text-navy hover:bg-peach/20 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-navy hover:bg-coral/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;