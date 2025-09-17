import { AlertTriangle } from "lucide-react";

const DevModeBanner = () => {
  return (
    <div className="bg-coral text-white px-4 py-2 text-center border-b-2 border-navy">
      <div className="flex items-center justify-center space-x-2 text-sm font-semibold">
        <AlertTriangle className="w-4 h-4" />
        <span>Mock mode off — replace mockLLM to enable real APIs</span>
      </div>
    </div>
  );
};

export default DevModeBanner;