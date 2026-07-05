import React, { useEffect, useRef } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import VoiceLangSelector from './VoiceLangSelector';
import MicButton from './MicButton';

interface VoiceInputProps {
  onTranscriptReady: (text: string) => void;
  placeholder?: string;
}

const LANGUAGES_MAP: Record<string, string> = {
  'hi-IN': 'हिंदी (Hindi)',
  'en-IN': 'English (India)',
  'ta-IN': 'தமிழ் (Tamil)',
  'te-IN': 'తెలుగు (Telugu)',
  'kn-IN': 'ಕನ್ನಡ (Kannada)',
  'mr-IN': 'मराठी (Marathi)',
  'bn-IN': 'বাংলা (Bengali)',
};

export default function VoiceInput({ onTranscriptReady, placeholder }: VoiceInputProps) {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    selectedLang,
    startListening,
    stopListening,
    setLanguage,
    setTranscript,
  } = useVoiceInput();

  // Track the previous state of isListening to detect transitions from true to false
  const prevListeningRef = useRef(isListening);

  useEffect(() => {
    // When isListening transitions from true to false AND transcript is non-empty
    if (prevListeningRef.current && !isListening && transcript.trim() !== '') {
      onTranscriptReady(transcript);
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, onTranscriptReady]);

  return (
    <div className="flex flex-col gap-3 w-full font-sans">
      {/* ROW 1 — Language selector + mic button (Only visible if Speech API is supported) */}
      {isSupported && (
        <div className="flex items-center gap-2">
          <VoiceLangSelector selectedLang={selectedLang} onChange={setLanguage} />
          <MicButton
            isListening={isListening}
            isSupported={isSupported}
            onClick={isListening ? stopListening : startListening}
          />
        </div>
      )}

      {/* ROW 2 — Textarea */}
      <textarea
        placeholder={placeholder}
        value={transcript}
        onChange={(e) => {
          setTranscript(e.target.value);
          onTranscriptReady(e.target.value);
        }}
        className="w-full min-h-[100px] border-[0.5px] border-[#E6E6E6] rounded-[8px] p-[12px] px-[14px] text-[14px] leading-relaxed text-[#111111] placeholder-zinc-400 focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 focus:outline-none transition-all resize-y"
      />

      {/* ROW 3 — Status / error row or fallback note */}
      {!isSupported ? (
        <p className="text-[11px] text-[#999999] leading-normal select-none">
          💡 Voice input works in Chrome and Edge. You can type your complaint here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Active Listening Indicator */}
          {isListening && (
            <div className="flex items-center gap-2 text-[12px] text-[#C3280F] font-semibold select-none">
              <span className="w-2 h-2 bg-[#C3280F] rounded-full mic-pulse-dot" />
              <span>Listening in {LANGUAGES_MAP[selectedLang] || selectedLang}... speak now</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-[#FFEBE9] border-[0.5px] border-[#FFBDBA] rounded-[6px] p-[8px] px-[12px] text-[12px] text-[#C3280F] leading-normal font-medium">
              {error}
            </div>
          )}

          {/* Success / Speech Captured Indicator */}
          {!isListening && transcript.trim() !== '' && !error && (
            <p className="text-[12px] text-[#0F7B4A] font-semibold flex items-center gap-1 select-none">
              ✓ Speech captured — edit above if needed
            </p>
          )}
        </div>
      )}
    </div>
  );
}
