import React from 'react';

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
}

export default function MicButton({ isListening, isSupported, onClick }: MicButtonProps) {
  if (!isSupported) {
    return null;
  }

  // Active state vs Default state styling
  const buttonClass = isListening
    ? "bg-[#FFEBE9] border-[#FFBDBA] text-[#C3280F]"
    : "bg-[#F5F5F7] border-[#E6E6E6] text-[#666666] hover:bg-[#F0EEFF] hover:text-[#7B61FF] hover:border-[#C5BDFF]";

  return (
    <>
      <style>{`
        @keyframes mic-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        .mic-pulse-dot {
          animation: mic-pulse 1s ease infinite;
        }
      `}</style>
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 border-[0.5px] rounded-[8px] py-[10px] px-[14px] text-[13px] font-medium transition-all duration-150 ease-out select-none cursor-pointer ${buttonClass}`}
      >
        <div className="relative inline-flex items-center justify-center w-[18px] h-[18px] shrink-0">
          <i className="ti ti-microphone text-[18px] leading-none" style={{ fontSize: '18px' }} />
          {isListening && (
            <span className="absolute top-[-1px] right-[-1px] w-[6px] h-[6px] bg-[#ee0000] rounded-full mic-pulse-dot" />
          )}
        </div>
        <span>{isListening ? 'Listening...' : 'Speak'}</span>
      </button>
    </>
  );
}
