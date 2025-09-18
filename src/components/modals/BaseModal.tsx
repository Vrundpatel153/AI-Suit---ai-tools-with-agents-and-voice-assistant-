import { ReactNode } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

const BaseModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: BaseModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`panel ${maxWidth} w-full max-h-[95vh] overflow-y-auto rounded-xl sm:rounded-2xl md:rounded-3xl
        h-full sm:h-auto sm:max-h-[90vh] animate-scale-in
      `}>
        <div className="result-panel-header">
          <h2 className="result-panel-title">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 bg-coral border-2 border-navy rounded-lg transition-colors hover:bg-coral/90 active:opacity-90"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="result-panel-content pb-32 sm:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;