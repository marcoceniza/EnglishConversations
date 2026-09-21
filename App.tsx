/**
 * App.tsx — Entry point for EnglishConversations.
 *
 * SDK 57 | TypeScript | Expo Router
 */
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConversationScreen } from '@/components/ConversationScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ConversationScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});
