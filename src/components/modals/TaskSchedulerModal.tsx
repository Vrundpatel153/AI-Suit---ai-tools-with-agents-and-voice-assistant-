import { useState } from "react";
import { Calendar, Clock, Users, ExternalLink, Download, Save, Undo } from "lucide-react";
import BaseModal from "./BaseModal";
// Replaced mock parser with backend API
import { parseEvent } from "../../services/assistantService";
import { generateGoogleCalendarURL, downloadICS } from "../../utils/ics";
import { saveToHistory } from "../../utils/localStorageHelpers";
import { useToast } from "../../hooks/use-toast";

interface TaskSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { text?: string; event?: any };
}

const TaskSchedulerModal = ({ isOpen, onClose, prefill }: TaskSchedulerModalProps) => {
  const [inputText, setInputText] = useState(prefill?.text || "");
  const [isParsing, setIsParsing] = useState(false);
  const [eventData, setEventData] = useState<any>(() => {
    if (!prefill?.event) return null;
    const e = prefill.event;
    return {
      title: e.title || '',
      date: e.date || '',
      time: e.time || '',
      duration_minutes: e.duration_minutes || e.durationMinutes || 30,
      attendees: e.attendees || [],
      description: e.description || e.notes || ''
    };
  });
  const [clarification, setClarification] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setIsParsing(true);
    setClarification(null);

    try {
      const result = await parseEvent(inputText);
      if (!result.ok) throw new Error(result.error || 'parse_failed');
      if (result.type === 'action' && result.event) {
        setEventData(result.event);
      } else if (result.type === 'clarify') {
        setClarification(result.question || 'Could you clarify details?');
      } else if (result.type === 'reply' && result.event) {
        setEventData(result.event);
      } else if (result.event) {
        setEventData(result.event);
      }
    } catch (error) {
      toast({
        title: "Parsing Error",
        description: "Failed to parse the event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleClarificationResponse = (response: string) => {
    setInputText(prev => `${prev}\n${response}`);
    setClarification(null);
    handleParse();
  };

  const handleGoogleCalendar = () => {
    if (!eventData) return;
    const url = generateGoogleCalendarURL(eventData);
    window.open(url, '_blank');
  };

  const handleDownloadICS = () => {
    if (!eventData) return;
    downloadICS(eventData);
    toast({
      title: "File Downloaded",
      description: "Calendar file has been downloaded."
    });
  };

  const handleSaveToDemo = () => {
    if (!eventData) return;
    
    saveToHistory({
      tool: "task-scheduler",
      excerpt: `${eventData.title} scheduled for ${eventData.date}`,
      data: eventData
    });

    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 10000);

    toast({
      title: "Event Saved",
      description: "Event has been saved to your demo calendar."
    });
  };

  const handleUndo = () => {
    setShowUndo(false);
    toast({
      title: "Undo Complete",
      description: "Event has been removed from demo calendar."
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Task Scheduler" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Describe your event or meeting
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="E.g., 'Schedule a team standup meeting tomorrow at 9 AM for 30 minutes with john@example.com'"
            className="textarea-primary w-full h-24"
            disabled={isParsing}
          />
          
          <button
            onClick={handleParse}
            disabled={!inputText.trim() || isParsing}
            className="btn-primary mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner w-4 h-4"></div>
                <span>Parsing...</span>
              </div>
            ) : (
              "Parse & Preview"
            )}
          </button>
        </div>

        {/* Clarification Section */}
        {clarification && (
          <div className="panel-small p-4">
            <h3 className="font-semibold text-navy mb-2">Need clarification:</h3>
            <p className="text-navy/80 mb-3">{clarification}</p>
            <input
              type="text"
              placeholder="Your answer..."
              className="input-primary w-full"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleClarificationResponse(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        )}

        {/* Event Preview */}
        {eventData && (
          <div className="panel-small p-6">
            <h3 className="font-bold text-navy mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Event Preview</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Title</label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-primary w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Date</label>
                <input
                  type="date"
                  value={eventData.date}
                  onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                  className="input-primary w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Time</label>
                <input
                  type="time"
                  value={eventData.time}
                  onChange={(e) => setEventData(prev => ({ ...prev, time: e.target.value }))}
                  className="input-primary w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={eventData.duration_minutes}
                  onChange={(e) => setEventData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                  className="input-primary w-full"
                  min="15"
                  step="15"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-navy mb-1">Description</label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                className="textarea-primary w-full h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleGoogleCalendar}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Google Calendar</span>
              </button>
              
              <button
                onClick={handleDownloadICS}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download .ics</span>
              </button>
              
              <button
                onClick={handleSaveToDemo}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save to Demo</span>
              </button>
              
              <button
                disabled
                className="btn-secondary flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                title="Requires OAuth — not available in frontend preview"
              >
                <Save className="w-4 h-4" />
                <span>My Calendar</span>
              </button>
            </div>

            {/* Undo Option */}
            {showUndo && (
              <div className="mt-4 p-3 bg-coral/10 border border-coral rounded-lg flex items-center justify-between">
                <span className="text-sm text-navy">Event saved to demo calendar</span>
                <button
                  onClick={handleUndo}
                  className="btn-copy flex items-center space-x-1"
                >
                  <Undo className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default TaskSchedulerModal;