import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, Bot, Shield } from "lucide-react";
import { authenticateUser, registerUser } from "../utils/localStorageHelpers";

const Landing = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Mock authentication
    setTimeout(() => {
      if (authenticateUser(email, password)) {
        navigate('/dashboard');
      } else {
        alert('Invalid credentials. Try demo@aisuite.com / demo123');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Mock registration
    setTimeout(() => {
      if (registerUser(name, email, password)) {
        navigate('/dashboard');
      } else {
        alert('Registration failed. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
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
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowLogin(true)}
                className="text-navy hover:text-navy/80 font-semibold transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => setShowSignup(true)}
                className="btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="hero-title mb-6">
            Your Multi-Agent AI Studio
          </h1>
          <p className="text-xl text-navy/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Harness the power of specialized AI agents for productivity, communication, research, and development. 
            All in one beautiful, easy-to-use interface.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={() => setShowSignup(true)}
              className="btn-primary text-lg px-8 py-4"
            >
              Start Free Trial
            </button>
            <button 
              onClick={() => setShowLogin(true)}
              className="btn-outline text-lg px-8 py-4"
            >
              Sign In
            </button>
          </div>

          {/* Demo note */}
          <div className="inline-flex items-center space-x-2 bg-coral/10 border-2 border-coral rounded-lg px-4 py-2">
            <Bot className="w-5 h-5 text-coral" />
            <span className="text-sm font-semibold text-navy">
              Frontend Demo - Use demo@aisuite.com / demo123
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
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  defaultValue="demo@aisuite.com"
                  className="input-field w-full"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Password</label>
                <input 
                  type="password" 
                  name="password"
                  defaultValue="demo123"
                  className="input-field w-full"
                  required 
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowLogin(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-navy/20 z-50 flex items-center justify-center p-4">
          <div className="panel p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-navy mb-6">Create Account</h2>
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="input-field w-full"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  className="input-field w-full"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Password</label>
                <input 
                  type="password" 
                  name="password"
                  className="input-field w-full"
                  required 
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowSignup(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;