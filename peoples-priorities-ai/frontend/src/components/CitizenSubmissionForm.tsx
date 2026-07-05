import React, { useState } from 'react';
import { submitComplaint } from '../lib/api';
import VoiceInput from './VoiceInput';

const VILLAGES = [
  "Bishnupur", "Rampur", "Kalyanpur", "Piparia", "Gopalpur",
  "Haripur", "Sultanpur", "Chandpur", "Madhupur", "Jagdishpur",
  "Belgaon", "Sonpur", "Karamtoli", "Bhaktiarpur", "Rajpur",
  "Fatehpur", "Daulatpur", "Govindpur", "Pratapgarh", "Ramgarh"
];

export default function CitizenSubmissionForm() {
  const [formData, setFormData] = useState({
    villageName: 'Bishnupur',
    rawText: '',
    channel: 'web_form' as const,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.rawText.trim()) {
      setError('Please describe your development request.');
      return;
    }

    setLoading(true);
    try {
      await submitComplaint({
        rawText: formData.rawText,
        villageName: formData.villageName,
        channel: formData.channel,
        languageDetected: 'English', // Default fallback
      });
      setSuccess(true);
      setFormData(prev => ({ ...prev, rawText: '' }));
      // Redirect after a short delay to let user see success message
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[500px] bg-white dark:bg-zinc-900 border border-[#E6E6E6] dark:border-zinc-800 rounded-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col font-sans select-none"
      style={{ padding: '40px', boxSizing: 'border-box' }}
    >
      {/* Heading */}
      <div className="flex flex-col text-left mb-6">
        <h2 className="text-[24px] font-bold text-[#111111] dark:text-zinc-50 leading-tight" style={{ fontWeight: 700 }}>
          Submit Development Request
        </h2>
        <p className="text-[14px] text-[#666666] dark:text-zinc-400 mt-2">
          Tell us what your village needs. Speak or type in your language.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full" style={{ boxSizing: 'border-box' }}>
        
        {/* Village Selection */}
        <div className="flex flex-col w-full" style={{ boxSizing: 'border-box' }}>
          <label htmlFor="villageName" className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            Select Village
          </label>
          <select
            id="villageName"
            value={formData.villageName}
            onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
            className="w-full rounded-md border border-[#E6E6E6] dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-[#111111] dark:text-zinc-200 outline-none focus:border-[#7B61FF] focus:ring-2 focus:ring-[#7B61FF]/10 transition-all cursor-pointer"
            style={{ padding: '12px 14px', boxSizing: 'border-box' }}
          >
            {VILLAGES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Complaint Text Area (VoiceInput) */}
        <div className="flex flex-col w-full" style={{ boxSizing: 'border-box' }}>
          <label className="text-[12px] font-medium text-[#666666] dark:text-zinc-400 mb-1.5 uppercase tracking-wider block">
            Describe Request
          </label>
          <VoiceInput
            onTranscriptReady={(text) => setFormData({
              ...formData,
              rawText: text
            })}
            placeholder="Describe your development request — speak or type in your language"
          />
        </div>

        {/* Error box */}
        {error && (
          <div className="bg-[#FFEBE9] border-[0.5px] border-[#FFBDBA] rounded-[6px] p-[10px] text-[12px] text-[#C3280F] leading-normal font-medium w-full box-border">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-[#E6F9F1] border-[0.5px] border-[#B2EBD3] rounded-[6px] p-[10px] text-[12px] text-[#0F7B4A] leading-normal font-medium w-full box-border">
            ✓ Request submitted successfully! Redirecting...
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[100px] bg-[#7B61FF] hover:bg-[#684ee3] active:bg-[#573dcd] text-white text-sm font-bold transition-all flex items-center justify-center cursor-pointer select-none border-none outline-none focus:ring-2 focus:ring-[#7B61FF]/50"
          style={{ height: '48px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
