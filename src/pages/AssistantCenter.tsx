import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import RoboAvatar from "../components/RoboAvatar";
import ChatMessage from "../components/ChatMessage";
import { mockLLM } from "../utils/mockLLM";
import { speechManager, isListening, isSpeaking } from "../utils/speechHelpers";
import { getSettings, saveToHistory } from "../utils/localStorageHelpers";
import { useToast } from "../hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const AssistantCenter = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListeningState, setIsListeningState] = useState(false);
  const [roboState, setRoboState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const settings = getSettings();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        text: "Hello! I'm your AI assistant. I can help you with scheduling, document analysis, code explanation, and more. What would you like to work on today?",
        sender: "assistant",
        timestamp: new Date()
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (text: string, sender: "user" | "assistant") => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSpeechRecognition = () => {
    if (isListening()) {
      speechManager.stopListening();
      setIsListeningState(false);
      setRoboState("idle");
      return;
    }

    setIsListeningState(true);
    setRoboState("listening");

    speechManager.startListening(
      (transcript) => {
        setInputText(transcript);
        setIsListeningState(false);
        setRoboState("idle");
        handleSubmit(null, transcript);
      },
      (error) => {
        console.error("Speech recognition error:", error);
        setIsListeningState(false);
        setRoboState("idle");
        toast({
          title: "Speech Recognition Error",
          description: "Please try typing your message instead.",
          variant: "destructive"
        });
      },
      () => {
        setIsListeningState(false);
        setRoboState("idle");
      }
    );
  };

  const speakText = (text: string) => {
    if (!settings.ttsEnabled) return;

    setRoboState("speaking");
    speechManager.speak(text, {
      onEnd: () => setRoboState("idle"),
      onError: () => setRoboState("idle")
    });
  };

  const handleSubmit = async (e?: React.FormEvent, voiceText?: string) => {
    e?.preventDefault();
    
    const text = voiceText || inputText.trim();
    if (!text || isProcessing) return;

    // Add user message
    addMessage(text, "user");
    setInputText("");
    setIsProcessing(true);
    setRoboState("thinking");

    try {
      // Route intent through mockLLM
      const response = await mockLLM.routeIntent(text);

      if (response.type === "reply") {
        // Simple conversational response
        addMessage(response.text, "assistant");
        speakText(response.text);
      } else if (response.type === "open_tool") {
        // Tool opening response
        const toolNames: Record<string, string> = {
          "task-scheduler": "Task Scheduler",
          "text-summarizer": "Text Summarizer",
          "code-explainer": "Code Explainer",
          "image-caption": "Image Caption",
          "knowledge-agent": "Knowledge Agent"
        };
        
        const toolName = toolNames[response.toolId] || "AI Tool";
        const replyText = `I'll help you with that! Opening the ${toolName} for you.`;
        
        addMessage(replyText, "assistant");
        speakText(replyText);
        
        // Note: In a real implementation, this would open the tool modal
        // For demo purposes, we'll just show this message
        setTimeout(() => {
          addMessage(`The ${toolName} would open here with your request: "${text}"`, "assistant");
        }, 1000);
        
      } else if (response.type === "action") {
        // Action execution response
        const actionText = `I've created a new item: ${response.params.description}`;
        addMessage(actionText, "assistant");
        speakText(actionText);
        
        // Save to history
        saveToHistory({
          tool: "assistant-action",
          excerpt: response.params.description,
          data: response.params
        });
        
        toast({
          title: "Action Completed",
          description: "Item has been created and saved to history."
        });
      }
    } catch (error) {
      console.error("Assistant error:", error);
      const errorText = "I apologize, but I encountered an error processing your request. Please try again.";
      addMessage(errorText, "assistant");
      speakText(errorText);
    } finally {
      setIsProcessing(false);
      setRoboState("idle");
    }
  };

  const toggleTTS = () => {
    if (isSpeaking()) {
      speechManager.stopSpeaking();
      setRoboState("idle");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-cream">
      {/* Header */}
      <div className="bg-beige border-b-3 border-navy p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">AI Assistant Center</h1>
            <p className="text-navy/70">Chat with your AI companion and get intelligent assistance</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTTS}
              className={`p-2 rounded-lg border-2 border-navy transition-all ${
                settings.ttsEnabled && !isSpeaking() 
                  ? "bg-peach text-navy" 
                  : "bg-coral text-white"
              }`}
              title={isSpeaking() ? "Stop Speaking" : settings.ttsEnabled ? "TTS Enabled" : "TTS Disabled"}
            >
              {settings.ttsEnabled && !isSpeaking() ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Robot Avatar Section */}
        <div className="w-1/3 min-w-[300px] bg-beige border-r-3 border-navy p-6 flex flex-col items-center justify-center">
          <RoboAvatar state={roboState} />
          
          <div className="mt-6 text-center">
            <h3 className="text-lg font-bold text-navy mb-2">Assistant Status</h3>
            <div className="panel-small px-4 py-2">
              <span className="text-sm font-medium text-navy capitalize">
                {roboState === "idle" && "Ready to help"}
                {roboState === "listening" && "Listening..."}
                {roboState === "thinking" && "Processing..."}
                {roboState === "speaking" && "Speaking..."}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="chat-bubble-assistant">
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-3 border-navy bg-beige p-6">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message or click the microphone..."
                    className="input-primary w-full pr-12"
                    disabled={isProcessing || isListeningState}
                  />
                  
                  <button
                    type="button"
                    onClick={handleSpeechRecognition}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg border-2 border-navy transition-all ${
                      isListeningState 
                        ? "bg-coral text-white animate-pulse" 
                        : "bg-peach text-navy hover:bg-peach/80"
                    }`}
                    title={isListeningState ? "Stop Listening" : "Start Voice Input"}
                  >
                    {isListeningState ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing || isListeningState}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantCenter;