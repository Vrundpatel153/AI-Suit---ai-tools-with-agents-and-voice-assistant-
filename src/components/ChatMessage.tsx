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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "chat-bubble-user" : "chat-bubble-assistant"} relative`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>
        
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