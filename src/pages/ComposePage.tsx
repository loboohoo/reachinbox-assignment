import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Paperclip, 
  Clock, 
  Upload, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SelectDropdown } from '../components/compose/SelectDropdown';
import { SendLaterModal } from '../components/compose/SendLaterModal';
import { RichTextEditor } from '../components/compose/RichTextEditor';
import { useApp } from '../context/AppContext';

const SENDER_OPTIONS = [
  { label: 'oliver.brown@domain.io', value: 'oliver.brown@domain.io' },
  { label: 'alex@reachinbox.ai', value: 'alex@reachinbox.ai' },
  { label: 'growth@reachinbox.ai', value: 'growth@reachinbox.ai' },
];

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const { scheduleCampaign } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [sender, setSender] = useState(SENDER_OPTIONS[0].value);
  const [recipients, setRecipients] = useState<string[]>([
    'tarrx@gmail.com',
    'larrx@gmail.com',
    'damx@gmail.com',
  ]);
  const [newRecipient, setNewRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [delay, setDelay] = useState('0');
  const [hourlyLimit, setHourlyLimit] = useState('100');
  const [body, setBody] = useState('');
  const [attachmentImage, setAttachmentImage] = useState<string>(
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=400&q=80'
  );

  // UI Feedback & Modals
  const [emailError, setEmailError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);

  // Recipient Chip Management & Email Validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addRecipientToken = (input: string): boolean => {
    const cleaned = input.trim().replace(/[,;]/g, '');
    if (!cleaned) return false;

    if (!isValidEmail(cleaned)) {
      setEmailError(`"${cleaned}" is an invalid email address.`);
      return false;
    }

    if (recipients.includes(cleaned)) {
      setEmailError(`"${cleaned}" is already added.`);
      return false;
    }

    setRecipients((prev) => [...prev, cleaned]);
    setNewRecipient('');
    setEmailError('');
    return true;
  };

  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ';', 'Tab'].includes(e.key) && newRecipient.trim()) {
      e.preventDefault();
      addRecipientToken(newRecipient);
    }
  };

  const handleRecipientBlur = () => {
    if (newRecipient.trim() && isValidEmail(newRecipient.trim())) {
      addRecipientToken(newRecipient);
    }
  };

  const removeRecipient = (indexToRemove: number) => {
    setRecipients(recipients.filter((_, idx) => idx !== indexToRemove));
  };

  // Upload List: Browser File Parsing for CSV & TXT
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const uniqueMatches = Array.from(new Set(matches));

        if (uniqueMatches.length === 0) {
          setUploadMessage('No valid email addresses found in file.');
          return;
        }

        const newEmails = uniqueMatches.filter((email) => !recipients.includes(email));
        setRecipients((prev) => [...prev, ...newEmails]);
        setUploadMessage(`Successfully imported ${newEmails.length} email(s) from ${file.name}`);
        setTimeout(() => setUploadMessage(''), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Campaign Scheduling to Real Backend API & BullMQ Queue
  const handleScheduleComplete = async (scheduledTime?: string) => {
    setIsSendLaterOpen(false);

    let activeRecipients = [...recipients];
    if (newRecipient.trim() && isValidEmail(newRecipient.trim())) {
      const cleaned = newRecipient.trim().replace(/[,;]/g, '');
      if (!activeRecipients.includes(cleaned)) {
        activeRecipients.push(cleaned);
        setRecipients(activeRecipients);
        setNewRecipient('');
      }
    }

    if (activeRecipients.length === 0) {
      setEmailError('At least 1 recipient is required');
      return;
    }
    if (!subject.trim()) {
      setEmailError('Subject is required');
      return;
    }

    setIsSubmitting(true);
    setEmailError('');

    try {
      await scheduleCampaign({
        senderEmail: sender,
        senderName: 'Oliver Brown',
        campaignName: subject || 'Outreach Campaign Strategy',
        recipients: activeRecipients,
        subject: subject || 'Outreach Campaign Strategy',
        body: body || 'Hi, I wanted to follow up regarding our recent campaign setup.',
        startTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
        minDelayBetweenEmails: parseInt(delay, 10) || 0,
        hourlyLimit: parseInt(hourlyLimit, 10) || 100,
      });

      navigate('/scheduled');
    } catch (error: any) {
      setEmailError(error.message || 'Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-5rem)] rounded-2xl p-6 sm:p-8 space-y-6 font-sans relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 relative">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-slate-900">Compose New Email</h1>
        </div>

        <div className="flex items-center space-x-3 relative">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" 
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button 
            type="button"
            onClick={() => setIsSendLaterOpen(!isSendLaterOpen)}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" 
            title="Schedule delivery"
          >
            <Clock className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleScheduleComplete()}
            className="px-4 py-1.5 rounded-full border border-[#00A859] text-[#00A859] hover:bg-emerald-50 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Scheduling...' : 'Send Later'}
          </button>

          {/* Send Later Date Time Modal */}
          <SendLaterModal
            isOpen={isSendLaterOpen}
            onClose={() => setIsSendLaterOpen(false)}
            onSchedule={(scheduledTime) => handleScheduleComplete(scheduledTime)}
          />
        </div>
      </div>

      {/* Hidden File Input for Upload List */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Toast Notification Banner for Upload List */}
      {uploadMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-[#00A859]/30 rounded-xl text-xs text-[#00A859] font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#00A859] shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Form Area */}
      <div className="space-y-4 text-xs">
        {/* FROM Field with Reusable Dropdown */}
        <div className="flex items-center">
          <label className="w-24 text-slate-400 font-medium shrink-0">From</label>
          <SelectDropdown
            options={SENDER_OPTIONS}
            selectedValue={sender}
            onChange={setSender}
          />
        </div>

        {/* TO Field with Recipient Chips & Enter key handler */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="flex items-start flex-1 min-w-0">
            <label className="w-24 text-slate-400 font-medium shrink-0 pt-1">To</label>
            <div className="flex flex-col flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {recipients.map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4EA] border border-[#00A859]/30 text-[#00A859] text-xs font-medium"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(idx)}
                      className="hover:text-emerald-800 cursor-pointer"
                      title="Remove recipient"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {recipients.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E6F4EA] border border-[#00A859]/30 text-[#00A859] text-xs font-bold">
                    +{recipients.length - 3}
                  </span>
                )}
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => {
                    setNewRecipient(e.target.value);
                    setEmailError('');
                  }}
                  onKeyDown={handleAddRecipient}
                  onBlur={handleRecipientBlur}
                  placeholder="Type email & press Enter or Comma..."
                  className="flex-1 min-w-[180px] bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none py-1"
                />
              </div>

              {emailError && (
                <span className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </span>
              )}
            </div>
          </div>

          {/* Upload List Control Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[#00A859] hover:text-emerald-700 font-semibold text-xs shrink-0 cursor-pointer pt-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload List</span>
          </button>
        </div>

        {/* SUBJECT Field */}
        <div className="flex items-center border-t border-b border-slate-100 py-2">
          <label className="w-24 text-slate-400 font-medium shrink-0">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none py-1"
          />
        </div>

        {/* DELAY & HOURLY LIMIT Controls */}
        <div className="flex items-center space-x-6 pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Delay between 2 emails (s)</span>
            <input
              type="text"
              value={delay}
              onChange={(e) => setDelay(e.target.value.replace(/\D/g, ''))}
              className="w-12 py-1 text-center bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-[#00A859]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Hourly Limit</span>
            <input
              type="text"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value.replace(/\D/g, ''))}
              className="w-12 py-1 text-center bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-[#00A859]"
            />
          </div>
        </div>
      </div>

      {/* RICH TEXT EDITOR */}
      <RichTextEditor
        value={body}
        onChange={setBody}
        attachmentImage={attachmentImage}
        onRemoveAttachment={() => setAttachmentImage('')}
        onAddAttachment={(url) => setAttachmentImage(url)}
      />
    </div>
  );
};
