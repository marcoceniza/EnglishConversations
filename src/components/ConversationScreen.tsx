/**
 * ConversationScreen — main chat interface.
 *
 * Ties together STT, LLM, and TTS into a complete conversation flow:
 * 1. User taps mic → starts recording
 * 2. User speaks → stops recording
 * 3. Speech converted to text → sent to local LLM
 * 4. LLM generates response → spoken aloud via TTS
 * 5. Response also shown in chat bubbles
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Message } from '@/types';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useLocalLLM } from '@/hooks/useLocalLLM';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { MessageBubble } from '@/components/MessageBubble';
import { MicButton } from '@/components/MicButton';

// ─── Welcome message ─────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hello! I\'m your English conversation partner. Tap the microphone and start talking! I\'ll help you practice.',
  timestamp: Date.now(),
};

export function ConversationScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isTalking, setIsTalking] = useState(false);

  const {
    status: sttStatus,
    transcript,
    partialTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const { isProcessing, generateResponse } = useLocalLLM();
  const { isSpeaking, speak, stopSpeaking } = useTextToSpeech();

  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Process transcript when STT is done
  useEffect(() => {
    if (sttStatus === 'transcribing' && transcript.trim()) {
      processUserMessage(transcript.trim());
    }
  }, [sttStatus, transcript]);

  const processUserMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: userText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Generate response from local LLM
      const responseText = await generateResponse(userText);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response
      setIsTalking(true);
      speak(responseText);
    },
    [generateResponse, speak]
  );

  // Handle mic button press
  const handleMicPress = useCallback(async () => {
    await startListening();
  }, [startListening]);

  // Handle mic button stop
  const handleMicStop = useCallback(async () => {
    await stopListening();
  }, [stopListening]);

  // Clear conversation
  const handleClear = useCallback(() => {
    Alert.alert('Clear Conversation', 'Are you sure you want to clear the conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          stopSpeaking();
          setMessages([WELCOME_MESSAGE]);
        },
      },
    ]);
  }, [stopSpeaking]);

  // Stop TTS
  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setIsTalking(false);
  }, [stopSpeaking]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>English Conversation</Text>
        <View style={styles.headerActions}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isProcessing ? '#FF9500' : isSpeaking ? '#34C759' : '#8E8E93',
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isProcessing
              ? 'Processing...'
              : isSpeaking
              ? 'Speaking...'
              : 'Ready'}
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isProcessing && (
            <View style={[styles.assistantContainer, styles.loadingContainer]}>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={[styles.text, styles.assistantText]}>
                  Thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Controls */}
      <View style={styles.controls}>
        <MicButton
          isRecording={sttStatus === 'listening'}
          isProcessing={isProcessing}
          onPress={handleMicPress}
          onStop={sttStatus === 'listening' ? handleMicStop : undefined}
        />

        {isSpeaking && (
          <TouchableOpacity style={styles.stopSpeakingButton} onPress={handleStopSpeaking}>
            <Text style={styles.stopSpeakingText}>Stop Speaking</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  loadingContainer: {
    padding: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  assistantBubble: {
    backgroundColor: '#E9E9EB',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  assistantText: {
    color: '#000000',
  },
  controls: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  stopSpeakingButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  stopSpeakingText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
