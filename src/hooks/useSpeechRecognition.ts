import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechStatus =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'error';

export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isListeningRef = useRef(false);

  useSpeechRecognitionEvent('start', () => {
    console.log('[Speech] start');

    if (!isMounted.current) return;

    isListeningRef.current = true;
    setStatus('listening');
  });

  useSpeechRecognitionEvent('speechstart', () => {
    console.log('[Speech] speechstart');

    if (!isMounted.current) return;

    setStatus('listening');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text =
      event.results?.[0]?.transcript?.trim() ?? '';

    console.log(
      '[Speech] result:',
      text,
      'isFinal:',
      event.isFinal
    );

    if (!isMounted.current) return;

    if (!text) return;

    if (event.isFinal) {
      console.log('[Speech] FINAL:', text);

      setTranscript(text);
      setPartialTranscript('');
      setStatus('transcribing');
    } else {
      console.log('[Speech] PARTIAL:', text);

      setPartialTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error(
      '[Speech] error:',
      event.error,
      event.message
    );

    if (!isMounted.current) return;

    const message =
      event.message ??
      `Speech recognition failed: ${event.error}`;

    setError(message);
    setStatus('error');
    isListeningRef.current = false;
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('[Speech] end');

    if (!isMounted.current) return;

    isListeningRef.current = false;

    setStatus((current) => {
      if (current === 'error') {
        return 'error';
      }

      if (current === 'transcribing') {
        return 'transcribing';
      }

      return 'idle';
    });
  });

  useSpeechRecognitionEvent('nomatch', () => {
    console.warn('[Speech] nomatch');

    if (!isMounted.current) return;

    setError('No speech was recognized.');
    setStatus('error');
    isListeningRef.current = false;
  });

  useEffect(() => {
    isMounted.current = true;

    const requestPermissions = async () => {
      try {
        const result =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

        console.log(
          '[Speech] permissions:',
          result
        );

        if (!result.granted) {
          console.warn(
            '[Speech] Microphone/speech recognition permission denied'
          );

          setError(
            'Microphone and speech recognition permission is required.'
          );
        }
      } catch (error) {
        console.error(
          '[Speech] Permission error:',
          error
        );
      }
    };

    requestPermissions();

    return () => {
      isMounted.current = false;

      if (isListeningRef.current) {
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch {
          // Ignore cleanup errors
        }

        isListeningRef.current = false;
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    console.log('[Speech] startListening()');

    setError(null);
    setTranscript('');
    setPartialTranscript('');

    if (isListeningRef.current) {
      console.log('[Speech] Already listening');
      return;
    }

    try {
      const permission =
        await ExpoSpeechRecognitionModule.getPermissionsAsync();

      console.log(
        '[Speech] permission:',
        permission
      );

      if (!permission.granted) {
        const requested =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

        console.log(
          '[Speech] requested permission:',
          requested
        );

        if (!requested.granted) {
          throw new Error(
            'Microphone and speech recognition permission is required.'
          );
        }
      }

      isListeningRef.current = true;
      setStatus('listening');

      console.log(
        '[Speech] Starting native recognizer...'
      );

      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });

      console.log(
        '[Speech] Native recognizer started'
      );
    } catch (error) {
      console.error(
        '[Speech] Failed to start:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to start speech recognition';

      isListeningRef.current = false;

      setError(message);
      setStatus('error');
    }
  }, []);

  const stopListening = useCallback(async () => {
    console.log('[Speech] stopListening()');

    if (!isListeningRef.current) {
      console.log(
        '[Speech] Not currently listening'
      );
      return;
    }

    try {
      console.log(
        '[Speech] Calling native stop()...'
      );

      await ExpoSpeechRecognitionModule.stop();

      console.log(
        '[Speech] Native stop() completed'
      );
    } catch (error) {
      console.error(
        '[Speech] Stop error:',
        error
      );

      isListeningRef.current = false;
      setStatus('idle');
    }
  }, []);

  const cancelListening = useCallback(async () => {
    console.log('[Speech] cancelListening()');

    if (!isListeningRef.current) {
      return;
    }

    try {
      isListeningRef.current = false;

      await ExpoSpeechRecognitionModule.abort();

      setPartialTranscript('');
      setStatus('idle');
    } catch (error) {
      console.error(
        '[Speech] Abort error:',
        error
      );

      isListeningRef.current = false;
      setStatus('idle');
    }
  }, []);

  return {
    status,
    transcript,
    partialTranscript,
    error,
    startListening,
    stopListening,
    cancelListening,
    isListening: status === 'listening',
  };
}