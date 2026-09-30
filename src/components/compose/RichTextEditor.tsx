import React, { useState } from 'react';
import { 
  Undo, 
  Redo, 
  ChevronDown, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  List, 
  Link2, 
  Image as ImageIcon, 
  Quote, 
  Code,
  X
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  attachmentImage?: string;
  onRemoveAttachment?: () => void;
  onAddAttachment?: (url: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  attachmentImage,
  onRemoveAttachment,
  onAddAttachment,
}) => {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const handleImageUploadClick = () => {
    const sampleImage =
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=400&q=80';
    if (onAddAttachment) {
      onAddAttachment(sampleImage);
    }
  };

  return (
    <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-4 font-sans">
      {/* Editor Floating Formatting Toolbar */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs flex-wrap">
        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-xs cursor-pointer"
        >
          <span>Tt</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => setIsBold(!isBold)}
          className={`p-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
            isBold ? 'bg-slate-200 text-[#00A859]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsItalic(!isItalic)}
          className={`p-1.5 rounded-lg italic text-xs cursor-pointer transition-colors ${
            isItalic ? 'bg-slate-200 text-[#00A859]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsUnderline(!isUnderline)}
          className={`p-1.5 rounded-lg underline text-xs cursor-pointer transition-colors ${
            isUnderline ? 'bg-slate-200 text-[#00A859]' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleImageUploadClick}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Insert Image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Text Area */}
      <textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type Your Reply..."
        className={`w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none resize-none text-sm leading-relaxed ${
          isBold ? 'font-bold' : ''
        } ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
      />

      {/* Attachment Image Thumbnail Preview */}
      {attachmentImage && (
        <div className="relative inline-block group pt-2">
          <div className="w-36 h-24 rounded-xl overflow-hidden border border-slate-300 shadow-2xs relative bg-slate-100">
            <img
              src={attachmentImage}
              alt="Attachment preview"
              className="w-full h-full object-cover"
            />
            {onRemoveAttachment && (
              <button
                type="button"
                onClick={onRemoveAttachment}
                className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-opacity cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
