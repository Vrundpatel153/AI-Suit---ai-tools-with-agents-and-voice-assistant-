import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, Bot, Shield } from "lucide-react";
import { loginWithGoogle, loginAsDemo } from "../utils/localStorageHelpers";

const Landing = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const result = await loginWithGoogle();
    if (result) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleDemoAuth = async () => {
    setIsLoading(true);
    setTimeout(() => {
      if (loginAsDemo()) {
        navigate('/dashboard');
      } else {
        alert('Demo login failed');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-beige border-b-3 border-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-peach border-2 border-navy rounded-lg flex items-center justify-center shadow-offset-small">
                <span className="text-navy font-black text-lg">A</span>
              </div>
              <span className="text-2xl font-black text-navy">AiSuite</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGoogleAuth}
                className="btn-primary"
                aria-label="Continue with Google"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Continue with Google'}
              </button>
              <button
                onClick={handleDemoAuth}
                className="btn-secondary"
                disabled={isLoading}
              >
                Continue as Demo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="hero-title mb-6">
            Your Multi-Agent AI Platform
          </h1>
          <p className="text-xl text-navy/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Harness the power of specialized AI agents for productivity, communication, research, and development. 
            All in one beautiful, easy-to-use interface.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <button 
              onClick={handleGoogleAuth}
              className="btn-primary text-lg px-8 py-4"
              aria-label="Continue with Google"
            >
              Continue with Google
            </button>
            <button 
              onClick={handleDemoAuth}
              className="btn-secondary text-lg px-8 py-4"
            >
              Continue as Demo
            </button>
          </div>

          {/* Demo note */}
          <div className="inline-flex items-center space-x-2 bg-coral/10 border-2 border-coral rounded-lg px-4 py-2">
            <Bot className="w-5 h-5 text-coral" />
            <span className="text-sm font-semibold text-navy">
              Google login is for real users only. Demo Mode lets you explore without an account.
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">
            Powerful AI Agents at Your Fingertips
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-peach border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
                <Zap className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Instant Results</h3>
              <p className="text-navy/70 text-sm">Get AI assistance in seconds with optimized workflows</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-coral border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Multi-Agent</h3>
              <p className="text-navy/70 text-sm">Specialized agents for different tasks and workflows</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-peach border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
                <Bot className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Smart Assistant</h3>
              <p className="text-navy/70 text-sm">Conversational AI with voice and text interaction</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-coral border-2 border-navy rounded-xl mx-auto mb-4 flex items-center justify-center shadow-offset-small">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Secure</h3>
              <p className="text-navy/70 text-sm">Privacy-focused with local data processing options</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-navy/20 z-50 flex items-center justify-center p-4">
          <div className="panel p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-navy mb-6">Sign In</h2>
            
            <div className="space-y-3">
              <button 
                onClick={handleGoogleAuth}
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Continue with Google'}
              </button>
              <button 
                onClick={handleDemoAuth}
                className="btn-secondary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Loading Demo...' : 'Continue as Demo'}
              </button>
              <p className="text-xs text-navy/70 text-center">Google login is for real users only. Demo Mode lets you explore without an account.</p>
              <button 
                type="button" 
                onClick={() => setShowLogin(false)}
                className="btn-outline w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-navy/20 z-50 flex items-center justify-center p-4">
          <div className="panel p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-navy mb-6">Create Account</h2>
            
            <div className="space-y-3">
              <button 
                onClick={handleGoogleAuth}
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Continue with Google'}
              </button>
              <p className="text-xs text-navy/70 text-center">Google login required for agentic services</p>
              <button 
                type="button" 
                onClick={() => setShowSignup(false)}
                className="btn-outline w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;