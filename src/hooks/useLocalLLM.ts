/**
 * useLocalLLM — generates responses using a rule-based engine.
 *
 * This is a placeholder that demonstrates the interface.
 * Replace the `generateResponse` function with a real local model
 * (TFLite, ONNX Runtime, or native Android Neural Networks).
 *
 * Recommended models:
 * - TinyLlama-1.1B-Chat-v1.0 (quantized, ~300MB)
 * - MobileBERT (faster, ~150MB)
 * - Phi-2 (small but capable, ~4GB)
 */
import { useCallback, useState } from 'react';
import { Message, SYSTEM_PROMPT } from '@/types';

// ─── Grammar checker (simple heuristic) ────────────────────────────

function checkGrammar(text: string): string {
  const corrections: [RegExp, string][] = [
    [/\bi goed\b/gi, 'I went'],
    [/\bhe dont\b/gi, 'he doesn\'t'],
    [/\bshe dont\b/gi, 'she doesn\'t'],
    [/\bit dont\b/gi, 'it doesn\'t'],
    [/\bthey dont\b/gi, 'they don\'t'],
    [/\bmore better\b/gi, 'better'],
    [/\bmore worse\b/gi, 'worse'],
    [/\bgooder\b/gi, 'better'],
    [/\bbadder\b/gi, 'bad'],
    [/\bmore good\b/gi, 'better'],
    [/\bmore bad\b/gi, 'worse'],
    [/\bi is\b/gi, 'I am'],
    [/\bhe is\b/gi, 'he\'s'],
    [/\bshe is\b/gi, 'she\'s'],
    [/\bwhere you from\b/gi, 'where are you from'],
    [/\bhow old is you\b/gi, 'how old are you'],
    [/\bwhat you doing\b/gi, 'what are you doing'],
    [/\bwhere you going\b/gi, 'where are you going'],
    [/\bi can\'t to\b/gi, 'I can\'t'],
    [/\bdid you went\b/gi, 'did you go'],
    [/\bhave you went\b/gi, 'have you gone'],
    [/\bhe don\'t\b/gi, 'he doesn\'t'],
    [/\bshe don\'t\b/gi, 'she doesn\'t'],
  ];

  let corrected = text;
  let correctionMsg = '';

  for (const [pattern, replacement] of corrections) {
    if (pattern.test(corrected)) {
      correctionMsg = `Tip: "${pattern.source}" → "${replacement}"`;
      corrected = corrected.replace(pattern, replacement);
    }
  }

  return correctionMsg;
}

// ─── Rule-based responses ─────────────────────────────────────────

function generateRuleBasedResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings)\b/.test(lower)) {
    const greetings = [
      "Hi there! How are you today?",
      "Hello! Great to hear from you. What would you like to talk about?",
      "Hey! Ready to practice some English? What's on your mind?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // How are you
  if (/how (are |\'re) (you|u)\b/.test(lower)) {
    return "I'm doing great, thanks for asking! I'm ready to help you practice English. How about you?";
  }

  // Goodbye
  if (/\b(bye|goodbye|see you|take care)\b/.test(lower)) {
    return "Goodbye! It was nice chatting with you. Keep practicing and see you next time!";
  }

  // Thank you
  if (/thanks?|thank you/.test(lower)) {
    return "You're welcome! I'm happy to help. Keep up the great work!";
  }

  // Yes
  if (/\byes\b|\byeah\b|\byup\b/.test(lower)) {
    return "Great! What would you like to talk about next?";
  }

  // No
  if (/\bno\b|\bnope\b/.test(lower)) {
    return "That's okay! We can talk about something else. What interests you?";
  }

  // Questions about English
  if (/\benglish\b/.test(lower)) {
    return "I love helping with English! You can tell me about your day, your hobbies, or ask me any questions. I'll help you practice!";
  }

  // Hobbies
  if (/\b(hobby|interest|like to do|fun)\b/.test(lower)) {
    return "That sounds interesting! Could you tell me more about what you enjoy doing? Why do you like it?";
  }

  // Food
  if (/\b(food|eat|hungry|cook|restaurant)\b/.test(lower)) {
    return "Food is a great topic! What's your favorite food? Do you like cooking?";
  }

  // Weather
  if (/\b(weather|rain|sun|cold|hot|warm)\b/.test(lower)) {
    return "I agree about the weather! Does the weather affect what you like to do?";
  }

  // Family
  if (/\b(family|mom|dad|brother|sister|parent)\b/.test(lower)) {
    return "Family is important! Tell me more about your family. Who are you close to?";
  }

  // School/Work
  if (/\b(school|work|job|study|class|office)\b/.test(lower)) {
    return "School and work are great topics! What do you do? What do you enjoy most about it?";
  }

  // Default response
  const defaults = [
    "That's interesting! Could you tell me more about that?",
    "I see! What else would you like to talk about?",
    "Good point! How does that make you feel?",
    "Interesting! Can you explain more?",
    "That's a great topic! What else can you tell me?",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export function useLocalLLM() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (userMessage: string): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate processing delay (replace with actual model inference)
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

      // Grammar check
      const grammarTip = checkGrammar(userMessage);

      // Generate response
      let response = generateRuleBasedResponse(userMessage);

      // Append grammar tip if found
      if (grammarTip) {
        response += ` ${grammarTip}`;
      }

      return response;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate response';
      setError(msg);
      return "I'm sorry, I had trouble processing that. Could you try again?";
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    generateResponse,
  };
}
