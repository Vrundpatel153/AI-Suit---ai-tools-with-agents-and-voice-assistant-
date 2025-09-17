import { useState, useEffect } from "react";

interface RoboAvatarProps {
  state: "idle" | "listening" | "thinking" | "speaking";
}

const RoboAvatar = ({ state }: RoboAvatarProps) => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (state === "idle") {
      // Random eye movement for idle state
      const interval = setInterval(() => {
        setEyePosition({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2
        });
      }, 2000);
      return () => clearInterval(interval);
    } else if (state === "listening") {
      setEyePosition({ x: 0, y: 0 }); // Center eyes when listening
    }
  }, [state]);

  const getStateColor = () => {
    switch (state) {
      case "listening": return "text-coral";
      case "thinking": return "text-peach";
      case "speaking": return "text-peach";
      default: return "text-navy";
    }
  };

  const getAnimationClass = () => {
    switch (state) {
      case "listening": return "animate-pulse-glow";
      case "thinking": return "animate-pulse";
      case "speaking": return "animate-bob";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Robot Head */}
      <div className={`panel w-32 h-32 rounded-3xl flex items-center justify-center ${getAnimationClass()}`}>
        <svg width="80" height="80" viewBox="0 0 80 80" className={getStateColor()}>
          {/* Head outline */}
          <rect 
            x="10" y="15" width="60" height="50" 
            rx="15" ry="15" 
            fill="currentColor" 
            fillOpacity="0.1"
            stroke="currentColor" 
            strokeWidth="3"
          />
          
          {/* Eyes */}
          <circle 
            cx={25 + eyePosition.x} 
            cy={35 + eyePosition.y} 
            r="4" 
            fill="currentColor"
          />
          <circle 
            cx={55 + eyePosition.x} 
            cy={35 + eyePosition.y} 
            r="4" 
            fill="currentColor"
          />
          
          {/* Mouth - changes based on state */}
          {state === "speaking" ? (
            <ellipse cx="40" cy="50" rx="8" ry="4" fill="currentColor" className="animate-pulse" />
          ) : state === "thinking" ? (
            <path d="M 32 50 Q 40 45 48 50" stroke="currentColor" strokeWidth="2" fill="none" />
          ) : (
            <line x1="35" y1="50" x2="45" y2="50" stroke="currentColor" strokeWidth="2" />
          )}
          
          {/* Antenna */}
          <line x1="40" y1="15" x2="40" y2="8" stroke="currentColor" strokeWidth="2" />
          <circle cx="40" cy="6" r="2" fill="currentColor" />
          
          {/* Additional state indicators */}
          {state === "listening" && (
            <>
              <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" className="animate-ping" />
              <circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" className="animate-ping" style={{ animationDelay: "0.5s" }} />
            </>
          )}
        </svg>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          state === "listening" ? "bg-coral animate-pulse" :
          state === "thinking" ? "bg-peach animate-pulse" :
          state === "speaking" ? "bg-peach animate-pulse" :
          "bg-navy/40"
        }`} />
        
        {/* Audio Waveform for Speaking */}
        {state === "speaking" && (
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-peach rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 8}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
        
        {/* Listening Indicator */}
        {state === "listening" && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoboAvatar;