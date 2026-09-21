/**
 * OllamaContext — shared connection state across all screens.
 *
 * Prevents the "disconnect on back navigation" bug where settings.tsx
 * and conversation.tsx each had their own useOllama() instance.
 */

import React, { createContext, useContext, PropsWithChildren, useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OllamaConfig, OllamaMessage, OllamaStatus, DEFAULT_SYSTEM_PROMPT } from '@/hooks/useOllama';

const STORAGE_KEY = 'ollama_config';

interface OllamaContextValue {
  status: OllamaStatus;
  availableModels: string[];
  error: string | null;
  isLoading: boolean;
  config: OllamaConfig | null;
  connect: (cfg: OllamaConfig) => Promise<void>;
  disconnect: () => void;
  chat: (msgs: OllamaMessage[], onChunk?: (chunk: string) => void) => Promise<string>;
  /** Persist current config to AsyncStorage */
  saveConfig: (cfg: OllamaConfig) => void;
  /** Clear persisted config from AsyncStorage */
  clearConfig: () => void;
}

const Ctx = createContext<OllamaContextValue | null>(null);

export function OllamaProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<OllamaStatus>('idle');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<OllamaConfig | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---------- helpers ----------
  const checkConnection = useCallback(async (baseUrl: string): Promise<boolean> => {
    try {
      const c = new AbortController();
      setTimeout(() => c.abort(), 3000);
      const r = await fetch(`${baseUrl}/api/tags`, { signal: c.signal });
      return r.ok;
    } catch { return false; }
  }, []);

  const refreshModels = useCallback(async (baseUrl: string): Promise<string[]> => {
    try {
      const r = await fetch(`${baseUrl}/api/tags`);
      if (!r.ok) return [];
      const d = await r.json();
      return ((d.models as { name: string }[]) ?? [])
        .map(m => m.name ?? '')
        .filter(Boolean);
    } catch { return []; }
  }, []);

  // ---------- actions ----------

  const connect = useCallback(async (newCfg: OllamaConfig) => {
    setIsLoading(true);
    setError(null);
    setStatus('connecting');

    const isReachable = await checkConnection(newCfg.baseUrl);
    if (!isReachable) {
      setError(`Cannot reach Ollama at ${newCfg.baseUrl}. Make sure Ollama is running and you are on the same WiFi.`);
      setStatus('error');
      setIsLoading(false);
      return;
    }

    const models = await refreshModels(newCfg.baseUrl);
    const merged: OllamaConfig = {
      ...newCfg,
      systemPrompt: newCfg.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      temperature: newCfg.temperature ?? 0.7,
      maxTokens: newCfg.maxTokens ?? 512,
    };
    setConfig(merged);
    setAvailableModels(models);
    setStatus('connected');

    // Persist so auto-connect works after reload
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setIsLoading(false);
  }, [checkConnection, refreshModels]);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    setConfig(null);
    setAvailableModels([]);
    setStatus('idle');
    setError(null);
  }, []);

  const chat = useCallback(async (messages: OllamaMessage[], onChunk?: (chunk: string) => void): Promise<string> => {
    if (!config) throw new Error('Not connected to Ollama.');

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    const parts: string[] = [];
    try {
      const res = await fetch(`${config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'system', content: config.systemPrompt }, ...messages],
          stream: true,
          options: { temperature: config.temperature, num_predict: config.maxTokens },
        }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ollama error (${res.status}): ${txt}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = dec.decode(value, { stream: true });
        for (const line of text.split('\n').filter(Boolean)) {
          const parsed = JSON.parse(line);
          const c = parsed.message?.content ?? '';
          if (c) { parts.push(c); onChunk?.(c); }
        }
      }
      return parts.join('');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return parts.join('') || 'Cancelled.';
      setError(e instanceof Error ? e.message : 'Chat failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const saveConfig = useCallback((cfg: OllamaConfig) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }, []);

  const clearConfig = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <Ctx.Provider value={{
      status, availableModels, error, isLoading, config,
      connect, disconnect, chat, saveConfig, clearConfig,
    }}>
      {children}
    </Ctx.Provider>
  );
}

/** Use the shared Ollama connection from any screen. */
export function useOllamaShared() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOllamaShared must be used inside <OllamaProvider>');
  return ctx;
}
