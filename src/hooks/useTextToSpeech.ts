/**
 * useTextToSpeech — speaks text aloud using expo-speech (Expo SDK native module).
 *
 * Uses expo-speech which works in managed Expo without custom native code.
 */
import { useCallback, useState } from 'react';
import * as Speech from 'expo-speech';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback((text: string) => {
    setError(null);
    setIsSpeaking(true);

    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      onDone: () => {
        setIsSpeaking(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
      onError: (e) => {
        setError(e.message ?? 'TTS error');
        setIsSpeaking(false);
      },
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    error,
    speak,
    stopSpeaking,
  };
}
