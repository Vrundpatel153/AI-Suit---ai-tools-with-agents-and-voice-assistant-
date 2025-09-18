import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import RoboAvatar from "../components/RoboAvatar";
import VoiceWave from "../components/VoiceWave";
import ChatMessage from "../components/ChatMessage";
// Lightweight event bus to signal global tool openings without external state lib
const toolEventBus = {
  listeners: new Set<(data: { toolId: string; prefill?: any }) => void>(),
  emit(data: { toolId: string; prefill?: any }) { this.listeners.forEach(l => l(data)); },
  on(cb: (data: { toolId: string; prefill?: any }) => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
};
// import { mockLLM } from "../utils/mockLLM"; // replaced by backend service
import { sendToAssistant } from "../services/assistantService";
import { parseEvent } from "../services/assistantService";
import { extractPartialSchedule, mergeSchedule } from "../utils/scheduleParsing";
import { speechManager, isListening, isSpeaking } from "../utils/speechHelpers";
import TaskSchedulerModal from "../components/modals/TaskSchedulerModal";
import EmailAssistantModal from "../components/modals/EmailAssistantModal";
import TextSummarizerModal from "../components/modals/TextSummarizerModal";
import CodeExplainerModal from "../components/modals/CodeExplainerModal";
import ImageCaptionModal from "../components/modals/ImageCaptionModal";
import KnowledgeAgentModal from "../components/modals/KnowledgeAgentModal";
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
  const [quotaBlockedUntil, setQuotaBlockedUntil] = useState<number | null>(null);
  const [quotaCountdown, setQuotaCountdown] = useState<number>(0);
  const [modelUnavailableUntil, setModelUnavailableUntil] = useState<number | null>(null);
  const [modelUnavailableCountdown, setModelUnavailableCountdown] = useState<number>(0);
  const [isListeningState, setIsListeningState] = useState(false);
  const [roboState, setRoboState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  // Track an inferred knowledge topic to expand short follow-up queries (e.g. "syntax", "stages", "advantages")
  const knowledgeTopicRef = useRef<string | null>(null);
  // Local modal state for tool openings triggered via event bus
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolPrefill, setToolPrefill] = useState<any>(null);
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  // Pending schedule slot-filling state
  const [pendingSchedule, setPendingSchedule] = useState<any | null>(null);
  const [pendingScheduleAsked, setPendingScheduleAsked] = useState(false); // ensure we don't repeat same clarify

  useEffect(() => {
    const off = toolEventBus.on(({ toolId, prefill }) => {
      setActiveTool(toolId);
      setToolPrefill(prefill || null);
    });
    return off;
  }, []);

  const settings = getSettings();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Countdown timer for quota exhaustion
  useEffect(() => {
    if (!quotaBlockedUntil) return;
    const interval = setInterval(() => {
      const remaining = quotaBlockedUntil - Date.now();
      if (remaining <= 0) {
        setQuotaBlockedUntil(null);
        setQuotaCountdown(0);
        clearInterval(interval);
      } else {
        setQuotaCountdown(Math.ceil(remaining / 1000));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [quotaBlockedUntil]);

  // Countdown timer for model unavailable (503)
  useEffect(() => {
    if (!modelUnavailableUntil) return;
    const interval = setInterval(() => {
      const remaining = modelUnavailableUntil - Date.now();
      if (remaining <= 0) {
        setModelUnavailableUntil(null);
        setModelUnavailableCountdown(0);
        clearInterval(interval);
      } else {
        setModelUnavailableCountdown(Math.ceil(remaining / 1000));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [modelUnavailableUntil]);

  // Lightweight local fallback generator for simple knowledge or code queries when model is down
  const localFallbackAnswer = (raw: string): string | null => {
    const lower = raw.toLowerCase();
    // Simple code snippet heuristic
    const codeReq = /(example|snippet|code|write|show) (a |an )?(function|loop|class|api|component)/.test(lower) || /\bjavascript\b/.test(lower);
    if (codeReq) {
      return `Model temporarily unavailable, providing a local example:\n\n// Debounced search input (JS)\nfunction debounce(fn, delay = 300) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), delay);\n  };\n}\n\nconst input = document.querySelector('#q');\nconst fetchResults = debounce(async (q) => {\n  if(!q) return;\n  const res = await fetch('/search?q=' + encodeURIComponent(q));\n  const data = await res.json();\n  console.log(data);\n}, 400);\n\ninput.addEventListener('input', e => fetchResults(e.target.value));\n\nExplanation: A debounce utility prevents firing the expensive search call until the user pauses typing.`;
    }
    if (isKnowledgeQuestion(raw)) {
      return `The model is overloaded right now. Quick overview (local heuristic):\nTopic: ${extractTopic(raw) || 'Subject'}\nKey Points:\n- I can't fetch live model details now.\n- Try again shortly for a richer answer.\n- You can refine your question for more specifics.\n(Waiting ~${modelUnavailableCountdown || 5}s may help.)`;
    }
    return null;
  };

  useEffect(() => {
    // Add welcome message & warm-up speech synthesis voices
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        text: "Hello! I'm your AI assistant. I can help you with scheduling, document analysis, code explanation, and more. What would you like to work on today?",
        sender: "assistant",
        timestamp: new Date()
      }]);
      // Warm up voices (silent utterance) to encourage early voice load and wave animation reliability
      try {
        speechManager.speak(' ', { rate: 1, volume: 0 });
      } catch {}
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

  // Heuristic: decide if a user message is a knowledge-style question (informational)
  const isKnowledgeQuestion = (text: string) => {
    const lower = text.toLowerCase().trim();
    if (lower.length < 3) return false;
    if (/\b(schedule|meeting|event|email|open|launch)\b/.test(lower)) return false; // operational intents
    const patterns = /(what|who|why|how|when|where|explain|define|difference|overview|tell me about)\b/;
    return patterns.test(lower) || lower.endsWith('?');
  };

  // Extract a concise topic label from a knowledge question (first noun-ish phrase)
  const extractTopic = (text: string) => {
    let cleaned = text.replace(/^(explain|define|tell me about|what is|what are|give me an overview of)\b/i, '').trim();
    cleaned = cleaned.replace(/\?.*$/, '').trim();
    // Limit length
    if (cleaned.split(/\s+/).length > 8) {
      cleaned = cleaned.split(/\s+/).slice(0,8).join(' ');
    }
    return cleaned || null;
  };

  // Expand a short follow-up (<=3 words) using stored topic
  const maybeExpandFollowUp = (raw: string) => {
    const wordCount = raw.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount === 0) return raw;
    if (wordCount > 3) return raw; // too long to treat as a bare refinement
    if (!knowledgeTopicRef.current) return raw;
    if (/^(yes|no|ok|okay|thanks?|thank you)$/i.test(raw.trim())) return raw; // not a refinement
    // Build expanded query
    const topic = knowledgeTopicRef.current;
    return `In the context of ${topic}, please elaborate on: ${raw.trim()}.`;
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
    if (quotaBlockedUntil && Date.now() < quotaBlockedUntil) {
      toast({ title: 'Rate Limited', description: `Please wait ${quotaCountdown}s before trying again.` });
      return;
    }
    if (modelUnavailableUntil && Date.now() < modelUnavailableUntil) {
      toast({ title: 'Model Overloaded', description: `Retry in ${modelUnavailableCountdown}s.` });
    }

    // Add user message
    addMessage(text, "user");
    setInputText("");
    setIsProcessing(true);
    setRoboState("thinking");

    try {
      // Expand short follow-up refinements for knowledge discussions BEFORE sending to backend
      let outbound = text;
      if (!isKnowledgeQuestion(text)) {
        // If it's very short maybe it's a refinement
        outbound = maybeExpandFollowUp(text);
      }

      const lowerOriginal = text.toLowerCase();
      const schedulingIntent = /(schedule|meeting|event)\b/.test(lowerOriginal) || pendingSchedule !== null;

      // If scheduling intent, attempt local partial extraction first
      if (schedulingIntent) {
        const partial = extractPartialSchedule(text);
        if (Object.values(partial).some(v => v !== undefined)) {
          setPendingSchedule(prev => mergeSchedule(prev, partial));
        } else if (!pendingSchedule) {
          // initialize empty to start tracking
          setPendingSchedule({});
        }

        const current = mergeSchedule(pendingSchedule, partial);
        // If we have title and date (time optional) open scheduler immediately
        if (current?.title && current?.date) {
          toolEventBus.emit({ toolId: 'task-scheduler', prefill: { text, event: {
            title: current.title,
            date: current.date,
            time: current.time || '',
            duration_minutes: 30,
            attendees: current.attendees || [],
            description: current.notes || ''
          }}});
          addMessage(`Opening scheduler with ${current.title} on ${current.date}${current.time? ' at '+current.time: ''}. You can adjust details there.`, 'assistant');
          speakText(`Opening scheduler with ${current.title} on ${current.date}${current.time? ' at '+current.time: ''}.`);
          setPendingSchedule(null);
          setPendingScheduleAsked(false);
          setIsProcessing(false);
          setRoboState('idle');
          return;
        }

        // If missing fields and we haven't asked yet (or new info arrived but still missing) ask concise clarify
        if ((!current?.title || !current?.date) && !pendingScheduleAsked) {
          const have: string[] = [];
            if (current?.time) have.push(`time ${current.time}`);
            if (current?.attendees?.length) have.push(`attendee${current.attendees.length>1?'s':''} ${current.attendees.join(', ')}`);
          const missing: string[] = [];
            if (!current?.title) missing.push('title');
            if (!current?.date) missing.push('date');
          const clarify = `I have ${have.length? have.join(' and '):'some details'}. Please provide the ${missing.join(' and ')} to schedule.`;
          addMessage(clarify, 'assistant');
          speakText(clarify);
          setPendingSchedule(current);
          setPendingScheduleAsked(true);
          setIsProcessing(false);
          setRoboState('idle');
          return;
        }
        // If still incomplete but we've already asked, continue to allow user to provide fields without re-querying model.
        if ((!current?.title || !current?.date) && pendingScheduleAsked) {
          // proceed only if user maybe added missing info - we'll call assistant for other intents but keep schedule context
        }
      }

      // Call backend assistant (only now if not early-returned above)
      const response = await sendToAssistant(outbound, { recent: messages.slice(-6).map(m => ({ role: m.sender, text: m.text })) });
      if (!response.ok && response.error === 'quota_exhausted') {
        const retryMs = (response as any).retryAfterMs || 15000;
        const until = Date.now() + retryMs;
        setQuotaBlockedUntil(until);
        setQuotaCountdown(Math.ceil(retryMs / 1000));
        addMessage(`Model quota exhausted. Cooling down for ~${Math.ceil(retryMs/1000)}s. I will be ready again shortly.`, 'assistant');
        return; // Avoid generic error path below
      }
      if (!response.ok && response.error === 'model_unavailable') {
        const retryMs = (response as any).retryAfterMs || 8000;
        const until = Date.now() + retryMs;
        setModelUnavailableUntil(until);
        setModelUnavailableCountdown(Math.ceil(retryMs / 1000));
        const local = localFallbackAnswer(text);
        if (local) {
          addMessage(local, 'assistant');
          speakText(local);
        } else {
          const msg = `Model temporarily overloaded. Retry in ~${Math.ceil(retryMs/1000)}s or ask a simpler question.`;
          addMessage(msg, 'assistant');
          speakText(msg);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(response.error || 'assistant_error');
      }

      if (response.type === "reply") {
        const replyText = response.text || '...';
        addMessage(replyText, "assistant");
        speakText(replyText);
        // Update knowledge topic if this exchange was informational
        if (isKnowledgeQuestion(text)) {
          knowledgeTopicRef.current = extractTopic(text);
        }
        // If we were in a pending schedule and user diverged to knowledge question, keep state but don't drop
      } else if (response.type === "open_tool") {
        // Tool opening response
        const toolNames: Record<string, string> = {
          "task-scheduler": "Task Scheduler",
          "text-summarizer": "Text Summarizer",
          "code-explainer": "Code Explainer",
          "image-caption": "Image Caption",
          "knowledge-agent": "Knowledge Agent"
        };
        
        const toolName = toolNames[response.toolId || ''] || "AI Tool";
        const replyText = `I'll help you with that! Opening the ${toolName} for you.`;
        
        addMessage(replyText, "assistant");
        speakText(replyText);
        // Emit tool open event with prefill
        if (response.toolId) {
          toolEventBus.emit({ toolId: response.toolId, prefill: { text } });
        }
        
      } else if (response.type === "action") {
        const action = response.action || 'unknown_action';
        if (action === 'create_event' && response.event) {
          const eventSummary = `${response.event.title} on ${response.event.date}${response.event.time ? ' at ' + response.event.time : ''}`;
          const actionText = `I've created an event: ${eventSummary}`;
          addMessage(actionText, "assistant");
          speakText(actionText);
          saveToHistory({
            tool: "assistant-action",
            excerpt: eventSummary,
            data: response.event
          });
          toast({ title: 'Event Created', description: 'Event parsed and stored.' });
          // Also open scheduler with prefilled event
          toolEventBus.emit({ toolId: 'task-scheduler', prefill: { text, event: response.event } });
          setPendingSchedule(null);
          setPendingScheduleAsked(false);
        } else {
          const genericAction = `Performed action: ${action}`;
          addMessage(genericAction, 'assistant');
          speakText(genericAction);
        }
      } else if (response.type === 'open_url') {
        const url = response.url;
        if (url) {
          const msg = `Opening ${url}`;
          addMessage(msg, 'assistant');
          speakText(msg);
          try { window.open(url, '_blank', 'noopener'); } catch {}
        } else {
          addMessage('I need a valid URL to open.', 'assistant');
        }
      } else if (response.type === 'clarify') {
        const q = response.question || 'Could you clarify?';
        addMessage(q, 'assistant');
        speakText(q);
        // If model asked to clarify but user clearly asked knowledge question, keep topic for follow-ups
        if (isKnowledgeQuestion(text) && !knowledgeTopicRef.current) {
          knowledgeTopicRef.current = extractTopic(text);
        }
      }
      // Heuristic: if user directly asked to draft an email and model didn't trigger tool
      if (/\b(draft|write|compose) (an? )?email\b/i.test(text) && !['open_tool'].includes(response.type || '')) {
        toolEventBus.emit({ toolId: 'email-assistant', prefill: { text } });
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
      <div className="flex-1 flex max-w-6xl mx-auto w-full flex-col md:flex-row">
        {/* Robot Avatar Section (collapsible on mobile) */}
        <div className={`md:w-1/3 md:min-w-[300px] bg-beige border-b-3 md:border-b-0 md:border-r-3 border-navy p-4 md:p-6 flex flex-col items-center justify-center ${showAvatarPanel ? 'flex' : 'hidden md:flex'}`}>
          <RoboAvatar state={roboState} />
          
          <div className="mt-6 text-center">
            <h3 className="text-lg font-bold text-navy mb-2">Assistant Status</h3>
            <div className="panel-small px-4 py-3 flex flex-col items-center space-y-2 w-56">
              <span className="text-xs font-semibold tracking-wide text-navy uppercase">
                {roboState === "idle" && "Ready"}
                {roboState === "listening" && "Listening"}
                {roboState === "thinking" && "Thinking"}
                {roboState === "speaking" && "Speaking"}
              </span>
              <VoiceWave active={roboState === 'speaking'} listening={roboState === 'listening'} />
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col relative">
          <button
            type="button"
            onClick={() => setShowAvatarPanel(v => !v)}
            className="md:hidden absolute top-2 right-2 z-10 p-2 rounded-md border-2 border-navy bg-peach text-navy shadow-offset-small flex items-center space-x-1 text-xs font-semibold"
          >
            {showAvatarPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            <span>{showAvatarPanel ? 'Hide Panel' : 'Show Panel'}</span>
          </button>
          {/* Overload / quota banners */}
          {(quotaBlockedUntil || modelUnavailableUntil) && (
            <div className="max-w-2xl mx-auto mt-2 px-4">
              {quotaBlockedUntil && (
                <div className="mb-2 text-xs font-semibold bg-coral text-white px-3 py-2 rounded border-2 border-navy shadow-offset-small">
                  Rate limit cooldown: {quotaCountdown}s
                </div>
              )}
              {modelUnavailableUntil && (
                <div className="mb-2 text-xs font-semibold bg-peach text-navy px-3 py-2 rounded border-2 border-navy shadow-offset-small">
                  Model overloaded, retry in {modelUnavailableCountdown}s (local answers may be heuristic)
                </div>
              )}
            </div>
          )}
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
                    placeholder={quotaBlockedUntil ? `Rate limited: wait ${quotaCountdown}s...` : "Type your message or click the microphone..."}
                    className={`input-primary w-full pr-12 ${quotaBlockedUntil ? 'opacity-60' : ''}`}
                    disabled={isProcessing || isListeningState || (quotaBlockedUntil !== null)}
                  />
                  <button
                    type="button"
                    onClick={handleSpeechRecognition}
                    disabled={quotaBlockedUntil !== null}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg border-2 border-navy transition-all ${
                      isListeningState
                        ? 'bg-coral text-white animate-pulse'
                        : 'bg-peach text-navy hover:bg-peach/80'
                    } ${quotaBlockedUntil ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={quotaBlockedUntil ? `Rate limited: ${quotaCountdown}s` : (isListeningState ? 'Stop Listening' : 'Start Voice Input')}
                  >
                    {isListeningState ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing || isListeningState || quotaBlockedUntil !== null}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Find last user message (excluding current input)
                    const lastUser = [...messages].reverse().find(m => m.sender === 'user');
                    const targetText = lastUser?.text || inputText.trim();
                    if (!targetText) return;
                    setIsProcessing(true);
                    try {
                      const parsed = await parseEvent(targetText);
                      if (parsed.ok && parsed.event) {
                        addMessage(`(Extracted event) ${parsed.event.title} on ${parsed.event.date}`, 'assistant');
                        toolEventBus.emit({ toolId: 'task-scheduler', prefill: { text: targetText, event: parsed.event } });
                      } else if (parsed.type === 'clarify') {
                        addMessage(parsed.question || 'Need more details about the event.', 'assistant');
                      } else {
                        addMessage('Could not extract an event from that.', 'assistant');
                      }
                    } catch (err) {
                      addMessage('Event extraction failed.', 'assistant');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="btn-secondary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || quotaBlockedUntil !== null}
                  title="Attempt to extract an event from the last user message"
                >
                  Extract Event
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
        {/* Tool Modals triggered by assistant */}
        {activeTool === 'task-scheduler' && (
          <TaskSchedulerModal isOpen={true} onClose={() => { setActiveTool(null); setToolPrefill(null); }} prefill={toolPrefill} />
        )}
        {activeTool === 'email-assistant' && (
          <EmailAssistantModal isOpen={true} onClose={() => { setActiveTool(null); setToolPrefill(null); }} prefill={toolPrefill} />
        )}
        {activeTool === 'text-summarizer' && (
          <TextSummarizerModal isOpen={true} onClose={() => { setActiveTool(null); setToolPrefill(null); }} prefill={toolPrefill} />
        )}
        {activeTool === 'code-explainer' && (
          <CodeExplainerModal isOpen={true} onClose={() => { setActiveTool(null); setToolPrefill(null); }} prefill={toolPrefill} />
        )}
        {activeTool === 'image-caption' && (
          <ImageCaptionModal isOpen={true} onClose={() => { setActiveTool(null); setToolPrefill(null); }} prefill={toolPrefill} />
        )}
        {activeTool === 'knowledge-agent' && (
          <KnowledgeAgentModal isOpen={true} onClose={() => { setActiveTool(null); setToolPrefill(null); }} prefill={toolPrefill} />
        )}
    </div>
  );
};

export default AssistantCenter;
// Modal portal region (render after export for clarity not required)