// Mock LLM Engine for AiSuite Frontend Demo
// Simulates AI responses with realistic latency and behavior

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate random latency between 300-1200ms
const randomDelay = () => delay(300 + Math.random() * 900);

export const mockLLM = {
  // Route user intent to appropriate action
  async routeIntent(text) {
    await randomDelay();
    
    const lower = text.toLowerCase();
    
    // Calendar/scheduling intents
    if (lower.includes('schedule') || lower.includes('meeting') || lower.includes('calendar') || 
        lower.includes('appointment') || lower.includes('remind') || lower.includes('event')) {
      return {
        type: "open_tool",
        toolId: "task-scheduler",
        prefill: { text }
      };
    }
    
    // Text processing intents
    if (lower.includes('summarize') || lower.includes('summary') || lower.includes('tldr')) {
      return {
        type: "open_tool",
        toolId: "text-summarizer",
        prefill: { text }
      };
    }
    
    // Code explanation intents
    if (lower.includes('code') || lower.includes('function') || lower.includes('explain this') ||
        lower.includes('what does this do')) {
      return {
        type: "open_tool",
        toolId: "code-explainer",
        prefill: { text }
      };
    }
    
    // Image processing intents
    if (lower.includes('image') || lower.includes('photo') || lower.includes('picture') ||
        lower.includes('caption') || lower.includes('describe')) {
      return {
        type: "open_tool",
        toolId: "image-caption",
        prefill: { text }
      };
    }
    
    // Knowledge/QA intents
    if (lower.includes('question') || lower.includes('search') || lower.includes('find') ||
        lower.includes('knowledge') || lower.includes('document')) {
      return {
        type: "open_tool",
        toolId: "knowledge-agent",
        prefill: { text }
      };
    }
    
    // Action intents (simulate doing something)
    if (lower.includes('create') || lower.includes('make') || lower.includes('generate')) {
      return {
        type: "action",
        action: "create_item",
        params: { description: text, timestamp: Date.now() }
      };
    }
    
    // Default conversational response
    const responses = [
      "I can help you with scheduling, text summarization, code explanation, image captioning, and knowledge queries. What would you like to work on?",
      "I'm your AI assistant! I can help with various tasks. Try asking me to schedule something, summarize text, or explain code.",
      "Hello! I can assist with calendaring, document analysis, code review, and more. What can I help you with today?",
      "I'm ready to help! I can handle scheduling, text processing, code analysis, image description, and research tasks.",
      "Hi there! I specialize in productivity tasks like scheduling meetings, summarizing documents, explaining code, and analyzing content. How can I assist?"
    ];
    
    return {
      type: "reply",
      text: responses[Math.floor(Math.random() * responses.length)]
    };
  },

  // Parse natural language into structured event data
  async parseEvent(text) {
    await randomDelay();
    
    const lower = text.toLowerCase();
    
    // Sometimes ask for clarification (20% chance)
    if (Math.random() < 0.2) {
      const clarifications = [
        "What time should this meeting be scheduled for?",
        "How long should this event last?",
        "Should I invite anyone else to this meeting?",
        "What date did you have in mind for this?",
        "Is this a recurring event or one-time?",
        "Should I set a reminder for this event?"
      ];
      return {
        type: "clarify",
        question: clarifications[Math.floor(Math.random() * clarifications.length)]
      };
    }
    
    // Extract basic info (simplified extraction)
    const title = lower.includes('meeting') ? 'Team Meeting' :
                 lower.includes('call') ? 'Phone Call' :
                 lower.includes('review') ? 'Review Session' :
                 lower.includes('lunch') ? 'Lunch Meeting' :
                 'New Event';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const duration = lower.includes('hour') ? 60 :
                    lower.includes('30') || lower.includes('thirty') ? 30 :
                    lower.includes('15') || lower.includes('fifteen') ? 15 :
                    30; // default
    
    return {
      title,
      date: tomorrow.toISOString().split('T')[0],
      time: "14:00",
      duration_minutes: duration,
      attendees: [],
      description: text,
      recurrence: "none",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  },

  // Summarize text
  async summarize(text) {
    await randomDelay();
    
    const wordCount = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    if (wordCount < 50) {
      return "This text is already quite concise. Key point: " + sentences[0]?.trim() + ".";
    }
    
    const summaries = [
      `Summary (${wordCount} words): This document discusses key concepts and provides important insights. Main points include strategic considerations, implementation details, and recommendations for next steps.`,
      `TL;DR (${wordCount} words): The content covers essential information about the topic, highlighting critical aspects and providing actionable guidance for readers.`,
      `Key Takeaways (${wordCount} words): The text presents valuable information with practical applications, focusing on core principles and best practices.`
    ];
    
    return summaries[Math.floor(Math.random() * summaries.length)];
  },

  // Explain code
  async explainCode(code) {
    await randomDelay();
    
    const lower = code.toLowerCase();
    let explanation = "This code ";
    
    if (lower.includes('function') || lower.includes('=>')) {
      explanation += "defines a function that processes input data and returns results. ";
    } else if (lower.includes('class')) {
      explanation += "defines a class with methods and properties for object-oriented programming. ";
    } else if (lower.includes('import') || lower.includes('require')) {
      explanation += "imports dependencies and modules needed for the application. ";
    } else if (lower.includes('const') || lower.includes('let') || lower.includes('var')) {
      explanation += "declares variables and assigns values for use in the program. ";
    } else {
      explanation += "implements logic to handle specific programming tasks. ";
    }
    
    explanation += "The structure follows standard programming patterns and includes error handling where appropriate.";
    
    const warnings = Math.random() < 0.3 ? [
      "⚠️ Consider adding error handling for edge cases.",
      "⚠️ Performance could be optimized with caching.",
      "⚠️ Consider adding input validation."
    ] : [];
    
    const suggestion = Math.random() < 0.4 ? 
      "💡 Suggested improvement: Add documentation comments for better maintainability." : null;
    
    return {
      explanation,
      warnings,
      suggestion
    };
  },

  // Generate image caption
  async captionImage(file) {
    await randomDelay();
    
    const captions = [
      "A professional workspace scene with modern equipment and clean lighting",
      "An outdoor landscape featuring natural elements and scenic composition",
      "A close-up view of detailed textures and interesting visual patterns",
      "An urban environment showing architectural elements and city life",
      "A group of people engaged in collaborative activities",
      "Abstract composition with geometric shapes and color relationships",
      "Technology-focused image showing digital interfaces and modern design",
      "Natural lighting scene with organic forms and environmental context"
    ];
    
    const caption = captions[Math.floor(Math.random() * captions.length)];
    const altText = caption.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    return {
      caption,
      altText: `Image showing ${altText}`,
      confidence: 0.85 + Math.random() * 0.14 // 85-99%
    };
  },

  // Answer questions based on document context
  async qa(question, document) {
    await randomDelay();
    
    const answers = [
      "Based on the document content, this relates to the key concepts discussed in section 2. The information suggests that best practices include careful consideration of the requirements and implementation details.",
      "According to the provided context, the answer can be found in the methodology section. The document indicates that proper planning and execution are essential for success.",
      "The document addresses this topic in detail, highlighting the importance of systematic approaches and thorough analysis of the available options.",
      "From the context provided, this question relates to the foundational principles outlined in the introduction. The text emphasizes the need for clear understanding and proper implementation."
    ];
    
    const snippets = [
      "...careful consideration of the requirements and implementation details must be taken into account...",
      "...proper planning and execution are essential for achieving the desired outcomes...",
      "...systematic approaches and thorough analysis lead to better results...",
      "...foundational principles provide the framework for successful implementation..."
    ];
    
    return {
      answer: answers[Math.floor(Math.random() * answers.length)],
      snippet: snippets[Math.floor(Math.random() * snippets.length)],
      confidence: 0.75 + Math.random() * 0.24 // 75-99%
    };
  }
};