import { Link } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.logo}
          />

          <ThemedText type="title" style={styles.title}>
            English Conversation
          </ThemedText>

          <ThemedText type="default" style={styles.subtitle}>
            Practice speaking English with fully offline AI.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.features}>
            <ThemedText>🎤 Tap mic and speak naturally</ThemedText>
            <ThemedText>🧠 Responses generated on-device</ThemedText>
            <ThemedText>🔊 Hear spoken answers aloud</ThemedText>
          </ThemedView>

          <Link href="/conversation" asChild>
            <TouchableOpacity style={styles.startButton}>
              <ThemedText style={styles.startButtonText}>
                Start Conversation
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.four,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 18,
  },
  features: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
  },
  startButton: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    backgroundColor: '#007AFF',
    borderRadius: Spacing.three,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
