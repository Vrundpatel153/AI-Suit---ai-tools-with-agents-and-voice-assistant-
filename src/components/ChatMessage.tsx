interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === "user";

  // Very lightweight markdown/code fence handling without adding a full parser
  const segments = message.text.split(/```/g);
  // Even indexes = normal text, odd indexes = maybe code block

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "chat-bubble-user" : "chat-bubble-assistant"} relative max-w-full`}>
        <div className="text-sm leading-relaxed whitespace-pre-wrap space-y-3">
          {segments.map((seg, idx) => {
            if (idx % 2 === 1) {
              // Code block: optional first line language
              const firstLineBreak = seg.indexOf('\n');
              let language = '';
              let code = seg;
              if (firstLineBreak !== -1) {
                const firstLine = seg.slice(0, firstLineBreak).trim();
                // Heuristic: language tag if small and no spaces
                if (/^[a-zA-Z0-9+#_-]{1,15}$/.test(firstLine)) {
                  language = firstLine;
                  code = seg.slice(firstLineBreak + 1);
                }
              }
              return (
                <div key={idx} className="rounded-lg border-2 border-navy bg-navy/5 overflow-hidden">
                  {language && (
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold bg-navy text-cream">
                      {language}
                    </div>
                  )}
                  <pre className="text-xs p-3 overflow-x-auto"><code>{code.trim()}</code></pre>
                </div>
              );
            }
            // Normal text: basic bold/italic/inline code formatting
            const withInline = seg
              .replace(/`([^`]+)`/g, (_, c) => `«INLINE_CODE_START»${c}«INLINE_CODE_END»`)
              .split(/\n{2,}/)
              .map((para, pIdx) => {
                const parts = para.split(/«INLINE_CODE_START»|«INLINE_CODE_END»/g);
                let inCode = false;
                return (
                  <p key={pIdx} className="whitespace-pre-wrap">
                    {parts.map((p, i) => {
                      if (p === '') return null;
                      if (!inCode && parts[i+1] !== undefined) {
                        // toggle into code for next part
                      }
                      if (inCode) {
                        inCode = false;
                        return <code key={i} className="px-1 py-0.5 bg-navy/10 border border-navy/30 rounded text-[11px]">{p}</code>;
                      } else if (parts[i+1] !== undefined) {
                        inCode = true;
                        return <span key={i}>{p}</span>;
                      }
                      return <span key={i}>{p}</span>;
                    })}
                  </p>
                );
              });
            return <div key={idx} className="space-y-2">{withInline}</div>;
          })}
        </div>
        
        <div className="mt-2 text-xs opacity-70">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Message tail */}
        <div className={`absolute top-4 w-3 h-3 border-2 border-navy transform rotate-45 ${
          isUser 
            ? "bg-peach -right-1.5" 
            : "bg-beige -left-1.5"
        }`} />
      </div>
    </div>
  );
};

export default ChatMessage;