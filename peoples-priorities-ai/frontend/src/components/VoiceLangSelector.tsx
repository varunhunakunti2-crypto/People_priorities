import React from 'react';

interface VoiceLangSelectorProps {
  selectedLang: string;
  onChange: (lang: string) => void;
}

const LANGUAGES = [
  { value: 'hi-IN', label: 'हिंदी (Hindi)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { value: 'te-IN', label: 'తెలుగు (Telugu)' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'mr-IN', label: 'मराठी (Marathi)' },
  { value: 'bn-IN', label: 'বাংলা (Bengali)' },
];

export default function VoiceLangSelector({ selectedLang, onChange }: VoiceLangSelectorProps) {
  return (
    <select
      value={selectedLang}
      onChange={(e) => onChange(e.target.value)}
      className="w-fit bg-white text-[12px] text-[#111111] border-[0.5px] border-[#E6E6E6] rounded-[8px] py-[6px] px-[10px] focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 focus:outline-none transition-all cursor-pointer font-sans"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
