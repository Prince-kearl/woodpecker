import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    onResult,
    onError,
    continuous = false,
    language = "en-US",
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Use refs for callbacks to avoid stale closures
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Initialize speech recognition once
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition not supported in this browser");
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript && onResultRef.current) {
        onResultRef.current(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      let errorMessage = "Speech recognition error";
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage = "No microphone found. Please check your microphone settings.";
          break;
        case "not-allowed":
          errorMessage = "Microphone access denied. Please allow microphone access.";
          break;
        case "network":
          errorMessage = "Network error. Please check your connection.";
          break;
        case "aborted":
          // Don't show error for manual abort
          return;
      }
      
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors on cleanup
        }
      }
    };
  }, [continuous, language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error("Speech recognition not initialized");
      if (onErrorRef.current) {
        onErrorRef.current("Speech recognition not available");
      }
      return;
    }
    
    if (isListening) {
      console.log("Already listening");
      return;
    }
    
    setTranscript("");
    
    try {
      console.log("Starting speech recognition...");
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      // Handle "already started" error
      if (error instanceof Error && error.message.includes("already started")) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch (e) {
          console.error("Failed to restart:", e);
        }
      } else if (onErrorRef.current) {
        onErrorRef.current("Failed to start voice input");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log("Stopping speech recognition...");
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    console.log("Toggle listening, current state:", isListening);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
