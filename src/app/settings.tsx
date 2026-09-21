import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { OllamaConfig, OllamaMessage, DEFAULT_SYSTEM_PROMPT } from '@/hooks/useOllama';
import { useOllamaShared } from '@/contexts/OllamaContext';

const STORAGE_KEY = 'ollama_config';

export default function OllamaSettingsScreen() {
  const { status, availableModels, isLoading, connect, disconnect, config, error, chat } = useOllamaShared();
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState('512');
  const [temperature, setTemperature] = useState('0.7');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load saved config on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        const parsed: OllamaConfig = JSON.parse(saved);
        setBaseUrl(parsed.baseUrl);
        setModel(parsed.model);
        setMaxTokens(String(parsed.maxTokens ?? 512));
        setTemperature(String(parsed.temperature ?? 0.7));
      }
    });
  }, []);

  // Auto-connect if config loaded
  useEffect(() => {
    if (baseUrl && model && status === 'idle') {
      attemptConnect();
    }
  }, [status]);

  const attemptConnect = useCallback(async () => {
    const parsedMaxTokens = parseInt(maxTokens, 10);
    const parsedTemp = parseFloat(temperature);
    if (isNaN(parsedMaxTokens) || isNaN(parsedTemp)) {
      Alert.alert('Invalid config', 'Please enter valid numbers for Max Tokens and Temperature.');
      return;
    }
    await connect({
      baseUrl,
      model,
      maxTokens: parsedMaxTokens,
      temperature: parsedTemp,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    });
    // Save config
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl, model, maxTokens: parsedMaxTokens, temperature: parsedTemp, systemPrompt: DEFAULT_SYSTEM_PROMPT }));
  }, [baseUrl, model, maxTokens, temperature, connect]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models as { name: string }[] | undefined)?.map((m) => m.name || '').filter(Boolean).join(', ') || 'None';
        setTestResult(`Connected! Available models: ${models}`);
      } else {
        setTestResult(`Error: ${res.status}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setTestResult(`Error: ${msg}`);
    } finally {
      setTesting(false);
    }
  }, [baseUrl]);

  const handleChat = useCallback(async () => {
    if (!baseUrl || !model) {
      Alert.alert('Not connected', 'Please enter your Ollama IP and model, then click Test.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const response = await chat([{ role: 'user', content: 'Hello, this is a test.' }]);
      setTestResult(`Response: ${response}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setTestResult(`Error: ${msg}`);
    } finally {
      setTesting(false);
    }
  }, [baseUrl, model, chat]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    AsyncStorage.removeItem(STORAGE_KEY);
    setBaseUrl('');
    setModel('');
    setTestResult(null);
  }, [disconnect]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ollama Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status:</Text>
          {status === 'connecting' || testing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: status === 'connected' ? '#34C759' : status === 'error' ? '#FF3B30' : '#8E8E93',
                },
              ]}
            />
          )}
          <Text style={styles.statusText}>
            {status === 'idle' && 'Disconnected'}
            {status === 'connecting' && 'Connecting...'}
            {status === 'connected' && 'Connected'}
            {status === 'error' && 'Error'}
          </Text>
        </View>

        {/* Config */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Connection Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Ollama Server URL</Text>
            <TextInput
              style={styles.input}
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="http://192.168.1.42:11434"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Model Name</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="llama3.2"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Max Tokens</Text>
            <TextInput
              style={styles.input}
              value={maxTokens}
              onChangeText={setMaxTokens}
              placeholder="512"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Temperature (0.0 - 1.0)</Text>
            <TextInput
              style={styles.input}
              value={temperature}
              onChangeText={setTemperature}
              placeholder="0.7"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTest} disabled={testing}>
              {testing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.buttonText}>Test</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.connectButton]} onPress={attemptConnect} disabled={testing}>
              <Text style={styles.buttonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Models */}
        {availableModels.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Models</Text>
            {availableModels.map((m, i) => (
              <TouchableOpacity key={i} style={styles.modelItem} onPress={() => setModel(m)}>
                <Text style={styles.modelName}>{m}</Text>
                {m === model && <Ionicons name="checkmark" size={18} color="#34C759" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Test Chat */}
        {status === 'connected' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Test Chat</Text>
            <TouchableOpacity style={[styles.button, styles.chatButton]} onPress={handleChat} disabled={testing}>
              {testing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.buttonText}>Send Test Message</Text>}
            </TouchableOpacity>
            {testResult && (
              <Text style={styles.resultText}>{testResult}</Text>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How to Connect</Text>
          <Text style={styles.instructionText}>1. Install Ollama on your computer: https://ollama.com/download</Text>
          <Text style={styles.instructionText}>2. Pull a model:   ollama pull llama3.2</Text>
          <Text style={styles.instructionText}>3. Start Ollama:   ollama serve (usually auto-starts)</Text>
          <Text style={styles.instructionText}>4. Find your PC's local IP:</Text>
          <Text style={styles.instructionSubtext}>   Windows: ipconfig → IPv4 under Wi-Fi</Text>
          <Text style={styles.instructionText}>5. Enter the IP + :11434 in the URL field</Text>
          <Text style={styles.instructionText}>6. Click "Test" then "Connect"</Text>
        </View>

        {/* Disconnect */}
        {status === 'connected' && (
          <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={handleDisconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#5856D6',
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  chatButton: {
    backgroundColor: '#34C759',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modelName: {
    fontSize: 14,
    color: '#007AFF',
  },
  resultText: {
    marginTop: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
    lineHeight: 20,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    paddingLeft: 8,
  },
  errorCard: {
    backgroundColor: '#FFEDE9',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
});
