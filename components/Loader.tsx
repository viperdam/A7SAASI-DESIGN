import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
      <p className="mt-4 text-lg text-gray-300">{message}</p>
      <p className="mt-2 text-sm text-gray-500">This may take a moment...</p>
    </div>
  );
};
