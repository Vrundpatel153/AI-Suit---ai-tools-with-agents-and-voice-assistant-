import { useState } from "react";
import { Image, Upload, Copy, Download } from "lucide-react";
import BaseModal from "./BaseModal";
import { mockLLM } from "../../utils/mockLLM";
import { saveToHistory } from "../../utils/localStorageHelpers";
import { useToast } from "../../hooks/use-toast";

interface ImageCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { text?: string };
}

const ImageCaptionModal = ({ isOpen, onClose, prefill }: ImageCaptionModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCaption = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      const result = await mockLLM.captionImage(selectedFile);
      setCaption(result);
      
      saveToHistory({
        tool: "image-caption",
        excerpt: `Generated caption for ${selectedFile.name}`,
        data: { caption: result.caption, fileName: selectedFile.name }
      });
    } catch (error) {
      toast({
        title: "Caption Error",
        description: "Failed to generate caption. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCaption = async () => {
    if (!caption) return;
    
    try {
      await navigator.clipboard.writeText(caption.caption);
      toast({
        title: "Copied!",
        description: "Caption copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleCopyAltText = async () => {
    if (!caption) return;
    
    try {
      await navigator.clipboard.writeText(caption.altText);
      toast({
        title: "Copied!",
        description: "Alt text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!caption || !selectedFile) return;
    
    const content = `Image: ${selectedFile.name}\n\nCaption: ${caption.caption}\n\nAlt Text: ${caption.altText}\n\nConfidence: ${Math.round(caption.confidence * 100)}%`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caption-${selectedFile.name.split('.')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Caption data saved as text file."
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Image Caption Generator" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Upload Image
          </label>
          
          <div className="border-3 border-dashed border-navy rounded-lg p-8 text-center bg-beige/50">
            {imagePreview ? (
              <div className="space-y-4">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-64 mx-auto rounded-lg border-2 border-navy shadow-offset-small"
                />
                <div className="text-sm text-navy/70">
                  {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setCaption(null);
                  }}
                  className="btn-secondary"
                >
                  Choose Different Image
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-peach border-2 border-navy rounded-xl mx-auto flex items-center justify-center">
                  <Upload className="w-8 h-8 text-navy" />
                </div>
                <div>
                  <p className="text-navy font-medium mb-2">Drop your image here, or click to browse</p>
                  <p className="text-sm text-navy/60">Supports JPG, PNG, GIF up to 10MB</p>
                </div>
                <label className="btn-primary cursor-pointer inline-block">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 text-center">
              <button
                onClick={handleGenerateCaption}
                disabled={isProcessing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner w-4 h-4"></div>
                    <span>Analyzing Image...</span>
                  </div>
                ) : (
                  "Generate Caption"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Caption Results */}
        {caption && (
          <div className="space-y-4">
            {/* Main Caption */}
            <div className="panel-small p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy flex items-center space-x-2">
                  <Image className="w-5 h-5" />
                  <span>Generated Caption</span>
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyCaption}
                    className="btn-copy flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="btn-copy flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              
              <div className="text-navy/80 leading-relaxed mb-4">
                {caption.caption}
              </div>
              
              <div className="text-xs text-navy/60 bg-beige/50 p-2 rounded border border-navy/20">
                Confidence: {Math.round(caption.confidence * 100)}%
              </div>
            </div>

            {/* Alt Text */}
            <div className="panel-small p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-navy">Alt Text for Accessibility</h4>
                <button
                  onClick={handleCopyAltText}
                  className="btn-copy flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Alt Text</span>
                </button>
              </div>
              
              <code className="text-sm bg-beige/50 p-2 rounded border border-navy/20 block">
                alt="{caption.altText}"
              </code>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ImageCaptionModal;