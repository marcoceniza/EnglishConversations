/**
 * MicButton — animated microphone button with recording state.
 *
 * Three states: idle, listening, processing.
 * Taps to start recording, long press not needed (single tap suffices).
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface MicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  onStop: () => void;
}

export function MicButton({
  isRecording,
  isProcessing,
  onPress,
  onStop,
}: MicButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Outer ring pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
    }
  }, [isRecording, pulseAnim, ringAnim]);

  const getIcon = () => {
    if (isProcessing) return 'time';
    if (isRecording) return 'mic-off';
    return 'mic';
  };

  const getBgColor = () => {
    if (isProcessing) return '#FF9500';
    if (isRecording) return '#FF3B30';
    return '#007AFF';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Thinking...';
    if (isRecording) return 'Listening...';
    return 'Tap to speak';
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [
                {
                  scale: ringAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.5],
                  }),
                },
              ],
              opacity: ringAnim,
            },
          ]}
        />
      )}
      <TouchableOpacity
        onPress={isRecording ? onStop : onPress}
        activeOpacity={0.7}
        style={[
          styles.button,  
          { backgroundColor: getBgColor() },
        ]}
        disabled={isProcessing}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Ionicons
            name={getIcon()}
            size={28}
            color="#FFFFFF"
          />
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.statusText, isRecording && styles.statusTextActive]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FF3B30',
    position: 'absolute',
  },
  statusText: {
    marginTop: 8,
    fontSize: 13,
    color: '#8E8E93',
  },
  statusTextActive: {
    color: '#FF3B30',
    fontWeight: '500',
  },
});
