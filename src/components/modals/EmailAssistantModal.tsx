import { useState } from "react";
import { Mail, Send, Copy } from "lucide-react";
import BaseModal from "./BaseModal";
import { saveToHistory } from "../../utils/localStorageHelpers";
import { useToast } from "../../hooks/use-toast";

interface EmailAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { text?: string };
}

const EmailAssistantModal = ({ isOpen, onClose, prefill }: EmailAssistantModalProps) => {
  const [emailType, setEmailType] = useState("compose");
  const [context, setContext] = useState(prefill?.text || "");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const emailTemplates = {
    compose: "Compose a new email",
    reply: "Reply to an email",
    followUp: "Follow-up email",
    meeting: "Meeting invitation",
    thank: "Thank you email",
    apology: "Apology email"
  };

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast({
        title: "Missing Context",
        description: "Please provide context for the email.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    // Simulate email generation
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    let email = "";
    switch (emailType) {
      case "reply":
        email = `Dear Sender,\n\nThank you for your email regarding ${context}.\n\nI wanted to follow up on the points you mentioned and provide some additional information. Based on your request, I believe we can move forward with the proposed approach.\n\nI'll make sure to keep you updated on our progress and reach out if I have any questions.\n\nBest regards,\n[Your Name]`;
        break;
      case "meeting":
        email = `Subject: Meeting Request - ${context}\n\nDear ${to || 'Team'},\n\nI hope this email finds you well. I would like to schedule a meeting to discuss ${context}.\n\nProposed details:\n- Topic: ${context}\n- Duration: 1 hour\n- Format: In-person/Video call\n\nPlease let me know your availability for the coming week, and I'll send out a calendar invitation.\n\nLooking forward to our discussion.\n\nBest regards,\n[Your Name]`;
        break;
      case "followUp":
        email = `Subject: Follow-up: ${subject || context}\n\nDear ${to || 'Recipient'},\n\nI wanted to follow up on our previous conversation regarding ${context}.\n\nAs discussed, I wanted to check if you had any additional questions or if there's anything else I can help clarify.\n\nPlease feel free to reach out if you need any further information.\n\nBest regards,\n[Your Name]`;
        break;
      default:
        email = `Subject: ${subject || 'Regarding ' + context}\n\nDear ${to || 'Recipient'},\n\nI hope this message finds you well.\n\n${context}\n\nI look forward to hearing from you soon.\n\nBest regards,\n[Your Name]`;
    }

    setGeneratedEmail(email);
    setIsGenerating(false);

    saveToHistory({
      tool: "email-assistant",
      excerpt: `Generated ${emailType} email about: ${context.substring(0, 50)}...`,
      data: { type: emailType, context, email }
    });
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;
    
    try {
      await navigator.clipboard.writeText(generatedEmail);
      toast({
        title: "Copied!",
        description: "Email copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleOpenEmailClient = () => {
    const lines = generatedEmail.split('\n');
    const subjectLine = lines.find(line => line.startsWith('Subject:'));
    const body = generatedEmail.replace(/^Subject:.*\n/, '');
    
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subjectLine?.replace('Subject: ', '') || subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Email Assistant" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Email Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Email Type
          </label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
            className="input-primary w-full"
          >
            {Object.entries(emailTemplates).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Email Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              To (optional)
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="input-primary w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Subject (optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="input-primary w-full"
            />
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Context / Requirements
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe what the email should be about, any specific points to include, tone, etc."
            className="textarea-primary w-full h-32"
            disabled={isGenerating}
          />
          
          <button
            onClick={handleGenerate}
            disabled={!context.trim() || isGenerating}
            className="btn-primary mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner w-4 h-4"></div>
                <span>Generating Email...</span>
              </div>
            ) : (
              "Generate Email"
            )}
          </button>
        </div>

        {/* Generated Email */}
        {generatedEmail && (
          <div className="panel-small p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Generated Email</span>
              </h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="btn-copy flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                
                <button
                  onClick={handleOpenEmailClient}
                  className="btn-primary flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Open in Email Client</span>
                </button>
              </div>
            </div>
            
            <div className="code-block">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                {generatedEmail}
              </pre>
            </div>
            
            <div className="mt-4 text-xs text-navy/60 bg-beige/50 p-2 rounded border border-navy/20">
              💡 Review and customize the email before sending. Replace [Your Name] with your actual name.
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default EmailAssistantModal;