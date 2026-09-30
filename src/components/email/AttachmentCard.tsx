import React from 'react';

interface AttachmentCardProps {
  fileName: string;
  fileSize: string;
  imageUrl: string;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({
  fileName,
  fileSize,
  imageUrl,
}) => {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden group bg-slate-50 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="h-28 overflow-hidden bg-slate-100 relative">
        <img
          src={imageUrl}
          alt={fileName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-2.5 bg-white border-t border-slate-100">
        <span className="font-semibold text-slate-900 block truncate text-[11px]">
          {fileName}
        </span>
        <span className="text-[10px] text-slate-400">{fileSize}</span>
      </div>
    </div>
  );
};
