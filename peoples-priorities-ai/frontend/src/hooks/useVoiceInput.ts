import { useState, useEffect, useRef, useCallback } from 'react';

class MockSpeechRecognitionSuccess {
  lang = 'hi-IN';
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    if (this.onstart) this.onstart();
    setTimeout(() => {
      let text = 'The road to our village is broken and needs repair';
      if (this.lang === 'hi-IN') {
        text = 'हमारे गाँव में पानी की बहुत समस्या है';
      }
      
      const event = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: text },
            isFinal: true
          }
        ]
      };
      if (this.onresult) this.onresult(event);
      if (this.onend) this.onend();
    }, 1000);
  }
  
  stop() {
    if (this.onend) this.onend();
  }
  
  abort() {
    if (this.onend) this.onend();
  }
}

class MockSpeechRecognitionError {
  onstart: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    if (this.onstart) this.onstart();
    setTimeout(() => {
      const event = { error: 'not-allowed' };
      if (this.onerror) this.onerror(event);
      if (this.onend) this.onend();
    }, 500);
  }
  stop() {}
  abort() {}
}

// Safe check for window and SpeechRecognition in SSR environments
const getSpeechRecognition = () => {
  if (typeof window !== 'undefined') {
    if (window.location.search.includes('mock=unsupported')) {
      return null;
    }
    if (window.location.search.includes('mock=success')) {
      return MockSpeechRecognitionSuccess;
    }
    if (window.location.search.includes('mock=error')) {
      return MockSpeechRecognitionError;
    }
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }
  return null;
};

const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition();

interface UseVoiceInputResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  selectedLang: string;
  startListening: () => void;
  stopListening: () => void;
  setLanguage: (lang: string) => void;
  clearTranscript: () => void;
  setTranscript: (text: string) => void;
}

export function useVoiceInput(): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('hi-IN');

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    // Clean up any existing instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore already aborted or unstarted errors
      }
    }

    const SpeechRecognition = getSpeechRecognition();
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let combined = '';
      let hasFinal = false;

      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          hasFinal = true;
        }
      }

      setTranscript(combined);
      if (hasFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMsg = 'Voice input failed. Please type instead.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied. Please allow microphone permission in your browser settings.';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please try again.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error. Please check your connection.';
      }
      setError(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    recognition.start();
  }, [selectedLang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    setIsListening(false);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setSelectedLang(lang);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore unmount error
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    selectedLang,
    startListening,
    stopListening,
    setLanguage,
    clearTranscript,
    setTranscript,
  };
}
