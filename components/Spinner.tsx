import React from 'react';

export const Spinner: React.FC<{ size?: number }> = ({ size = 8 }) => {
  return (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-orange-500`}></div>
  );
};