import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface SendLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledTime: string) => void;
}

export const SendLaterModal: React.FC<SendLaterModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
}) => {
  const [customDateTime, setCustomDateTime] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('Tomorrow, 10:00 AM');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDone = () => {
    setError('');
    let finalTime = selectedPreset;

    if (customDateTime) {
      const selectedDate = new Date(customDateTime);
      const now = new Date();

      if (selectedDate <= now) {
        setError('Selected time must be in the future.');
        return;
      }
      finalTime = selectedDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    onSchedule(finalTime);
  };

  return (
    <div className="absolute right-0 top-10 z-50 w-72 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl space-y-3 font-sans animate-in fade-in zoom-in-95 duration-150">
      <h3 className="text-xs font-bold text-slate-900">Send Later</h3>

      {/* Custom Date Time Picker Input */}
      <div className="relative">
        <input
          type="datetime-local"
          value={customDateTime}
          onChange={(e) => {
            setCustomDateTime(e.target.value);
            setError('');
          }}
          className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00A859]"
        />
        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Options */}
      <div className="space-y-1 py-1">
        {[
          'Tomorrow',
          'Tomorrow, 10:00 AM',
          'Tomorrow, 11:00 AM',
          'Tomorrow, 3:00 PM',
        ].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setSelectedPreset(preset);
              setCustomDateTime('');
              setError('');
            }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              selectedPreset === preset && !customDateTime
                ? 'bg-emerald-50 text-[#00A859] font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="px-4 py-1 rounded-full border border-[#00A859] text-[#00A859] hover:bg-emerald-50 font-semibold text-xs transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
