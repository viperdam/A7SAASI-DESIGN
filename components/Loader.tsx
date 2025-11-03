import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div 
        className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in"
        aria-live="polite"
        aria-atomic="true"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] p-1 animate-spin">
          <div className="w-full h-full bg-[#111827] rounded-full"></div>
      </div>
      <p className="mt-4 text-lg text-[#E5E7EB]">{message}</p>
      <p className="mt-2 text-sm text-[#9CA3AF]">This may take a moment...</p>
    </div>
  );
};