import { Zap, Users, Brain, Rocket, Github, ExternalLink, Heart } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "Multi-Agent Intelligence",
      description: "Specialized AI agents for different tasks, each optimized for specific use cases like scheduling, content analysis, and code explanation."
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Fast, responsive AI assistance with real-time feedback and seamless integration with your workflow."
    },
    {
      icon: Users,
      title: "Intuitive Interface",
      description: "Clean, user-friendly design that makes AI tools accessible to everyone, regardless of technical background."
    },
    {
      icon: Rocket,
      title: "Future-Ready",
      description: "Built with modern web technologies and designed to evolve with the latest AI advancements."
    }
  ];

  const techStack = [
    "React 18 with TypeScript",
    "Tailwind CSS for styling",
    "Web Speech API integration",
    "Local storage for data persistence",
    "Responsive design principles",
    "Modular component architecture"
  ];

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-peach border-3 border-navy rounded-xl flex items-center justify-center shadow-offset">
              <span className="text-navy font-black text-2xl">A</span>
            </div>
            <h1 className="hero-title">AiSuite</h1>
          </div>
          
          <p className="hero-subtitle max-w-3xl mx-auto mb-8">
            Your comprehensive multi-agent AI studio for productivity, creativity, and intelligent automation.
            Built as a frontend demonstration of modern AI interface design.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="badge-demo">
              Frontend-Only Demo
            </div>
            <div className="badge-demo">
              React + TypeScript
            </div>
            <div className="badge-demo">
              Modern AI Interface
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="section-title text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="tool-card">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-peach border-2 border-navy rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy mb-3">{feature.title}</h3>
                    <p className="text-navy/80 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* About the Project */}
          <div className="panel p-8">
            <h2 className="section-title mb-6">About This Project</h2>
            
            <div className="space-y-4 text-navy/80">
              <p>
                AiSuite is a frontend prototype demonstrating a modern approach to AI tool interfaces. 
                It showcases how multiple specialized AI agents can be integrated into a cohesive, 
                user-friendly platform.
              </p>
              
              <p>
                This demo uses mock AI responses to simulate real AI behavior, allowing you to 
                explore the interface and workflows without requiring actual AI API keys or backend services.
              </p>
              
              <p>
                The project emphasizes clean design, accessibility, and responsive layouts while 
                maintaining the retro poster aesthetic that makes it unique and memorable.
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="panel p-8">
            <h2 className="section-title mb-6">Technical Stack</h2>
            
            <div className="space-y-3">
              {techStack.map((tech, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-coral rounded-full flex-shrink-0"></div>
                  <span className="text-navy/80">{tech}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t-2 border-navy/20">
              <h3 className="font-bold text-navy mb-3">Browser Features Used</h3>
              <div className="text-sm text-navy/70 space-y-1">
                <p>• Web Speech API for voice recognition</p>
                <p>• Speech Synthesis API for text-to-speech</p>
                <p>• Local Storage for data persistence</p>
                <p>• File API for import/export functionality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="panel p-8 mb-16">
          <h2 className="section-title mb-6">Implementation Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">To Enable Real AI</h3>
              <div className="space-y-3 text-navy/80">
                <div className="flex items-start space-x-3">
                  <span className="bg-coral text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p>Replace <code className="bg-beige px-2 py-1 rounded text-sm">mockLLM.js</code> with real AI API calls (OpenAI, Anthropic, etc.)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-coral text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p>Add environment variables for API keys</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-coral text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p>Implement proper error handling and rate limiting</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">To Add Backend</h3>
              <div className="space-y-3 text-navy/80">
                <div className="flex items-start space-x-3">
                  <span className="bg-peach text-navy text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p>Set up authentication (OAuth, JWT, etc.)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-peach text-navy text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p>Add database for persistent storage</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-peach text-navy text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p>Integrate real calendar APIs (Google, Outlook)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center panel p-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-5 h-5 text-coral" />
            <span className="text-navy font-semibold">Built with passion for great UX</span>
          </div>
          
          <p className="text-navy/70 mb-6">
            This project demonstrates modern frontend development practices and AI interface design principles.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-secondary flex items-center space-x-2">
              <Github className="w-4 h-4" />
              <span>View Source</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <button className="btn-primary flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Live Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;