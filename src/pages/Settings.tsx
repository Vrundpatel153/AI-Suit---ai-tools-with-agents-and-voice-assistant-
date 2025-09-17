import { useState, useEffect } from "react";
import { Volume2, VolumeX, Mic, MicOff, Download, Upload, Trash2, Save } from "lucide-react";
import { getSettings, updateSettings, exportData, importData, clearHistory } from "../utils/localStorageHelpers";
import { useToast } from "../hooks/use-toast";

const Settings = () => {
  const [settings, setSettings] = useState({
    ttsEnabled: true,
    autoAllowMic: false,
    theme: 'retro',
    notifications: true
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (updateSettings(settings)) {
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated."
      });
    } else {
      toast({
        title: "Save Failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = () => {
    if (exportData()) {
      toast({
        title: "Data Exported",
        description: "Your data has been downloaded as a JSON file."
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Could not export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importData(file).then(success => {
      if (success) {
        toast({
          title: "Data Imported",
          description: "Your data has been imported successfully."
        });
        // Refresh settings
        setSettings(getSettings());
      } else {
        toast({
          title: "Import Failed",
          description: "Could not import data. Please check the file format.",
          variant: "destructive"
        });
      }
    });

    // Reset input
    event.target.value = '';
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL data? This will remove history, settings, and preferences. This action cannot be undone.")) {
      if (clearHistory()) {
        // Reset settings to defaults
        const defaultSettings = {
          ttsEnabled: true,
          autoAllowMic: false,
          theme: 'retro',
          notifications: true
        };
        updateSettings(defaultSettings);
        setSettings(defaultSettings);
        setHasChanges(false);
        
        toast({
          title: "All Data Cleared",
          description: "All data has been removed and settings reset to defaults."
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="hero-title text-4xl mb-4">Settings</h1>
          <p className="hero-subtitle">
            Configure your AiSuite preferences and manage your data
          </p>
        </div>

        {/* Audio Settings */}
        <div className="panel p-6 mb-6">
          <h2 className="section-title text-xl mb-6">Audio Settings</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {settings.ttsEnabled ? <Volume2 className="w-5 h-5 text-navy" /> : <VolumeX className="w-5 h-5 text-navy/50" />}
                <div>
                  <h3 className="font-semibold text-navy">Text-to-Speech</h3>
                  <p className="text-sm text-navy/70">Enable AI assistant voice responses</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('ttsEnabled', !settings.ttsEnabled)}
                className={`w-12 h-6 rounded-full border-2 border-navy transition-all ${
                  settings.ttsEnabled ? 'bg-peach' : 'bg-beige'
                }`}
              >
                <div className={`w-4 h-4 bg-navy rounded-full transition-transform ${
                  settings.ttsEnabled ? 'translate-x-6' : 'translate-x-1'
                } mt-[1px]`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {settings.autoAllowMic ? <Mic className="w-5 h-5 text-navy" /> : <MicOff className="w-5 h-5 text-navy/50" />}
                <div>
                  <h3 className="font-semibold text-navy">Auto-Allow Microphone</h3>
                  <p className="text-sm text-navy/70">
                    Automatically request microphone permission on first use
                    <br />
                    <span className="text-coral text-xs">⚠️ Browser may still show permission dialog</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('autoAllowMic', !settings.autoAllowMic)}
                className={`w-12 h-6 rounded-full border-2 border-navy transition-all ${
                  settings.autoAllowMic ? 'bg-peach' : 'bg-beige'
                }`}
              >
                <div className={`w-4 h-4 bg-navy rounded-full transition-transform ${
                  settings.autoAllowMic ? 'translate-x-6' : 'translate-x-1'
                } mt-[1px]`} />
              </button>
            </div>
          </div>
        </div>

        {/* Interface Settings */}
        <div className="panel p-6 mb-6">
          <h2 className="section-title text-xl mb-6">Interface Settings</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-navy">Theme</h3>
                <p className="text-sm text-navy/70">Choose your visual theme preference</p>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="input-primary"
              >
                <option value="retro">Retro Poster Style</option>
                <option value="minimal" disabled>Minimal (Coming Soon)</option>
                <option value="dark" disabled>Dark Mode (Coming Soon)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-navy">Notifications</h3>
                <p className="text-sm text-navy/70">Show success and error notifications</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`w-12 h-6 rounded-full border-2 border-navy transition-all ${
                  settings.notifications ? 'bg-peach' : 'bg-beige'
                }`}
              >
                <div className={`w-4 h-4 bg-navy rounded-full transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                } mt-[1px]`} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="panel p-6 mb-6">
          <h2 className="section-title text-xl mb-6">Data Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExportData}
              className="btn-secondary flex items-center justify-center space-x-2 p-4"
            >
              <Download className="w-5 h-5" />
              <span>Export Data</span>
            </button>

            <label className="btn-secondary flex items-center justify-center space-x-2 p-4 cursor-pointer">
              <Upload className="w-5 h-5" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            <button
              onClick={handleClearAllData}
              className="btn-accent flex items-center justify-center space-x-2 p-4 md:col-span-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

        {/* Developer Note */}
        <div className="panel p-6 mb-6">
          <h2 className="section-title text-xl mb-6">About Frontend Demo</h2>
          
          <div className="space-y-4 text-navy/80">
            <p>
              This is a frontend-only demonstration of AiSuite. To enable full functionality:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Replace mockLLM:</strong> Integrate real AI/LLM APIs for actual AI processing</li>
              <li><strong>Add Backend:</strong> Enable OAuth authentication and persistent storage</li>
              <li><strong>Calendar Integration:</strong> Connect to real calendar APIs for two-way sync</li>
              <li><strong>File Storage:</strong> Add server-side file processing and storage</li>
            </ul>
            
            <p className="mt-4 text-sm bg-beige/50 p-3 rounded-lg border border-navy/20">
              💡 <strong>Note:</strong> All data in this demo is stored locally in your browser. 
              Clearing browser data will remove all history and settings.
            </p>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center space-x-2 shadow-2xl"
            >
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;