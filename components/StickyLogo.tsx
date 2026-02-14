import React from 'react';
import Logo from './Logo';

const StickyLogo: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-4 border-black px-4 py-2 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center">
      <Logo className="h-12 w-auto" />
    </div>
  );
};

export default StickyLogo;
