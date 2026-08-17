import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveOptions<T> {
  key: string;
  data: T;
  debounceMs?: number;
  onSave?: (savedData: T) => void;
}

export function useAutoSave<T>({
  key,
  data,
  debounceMs = 1200,
  onSave
}: AutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const initialLoadRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if a draft exists in localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setHasSavedDraft(true);
      }
    } catch (e) {
      console.warn('AutoSave: localStorage access error', e);
    }
  }, [key]);

  // Save current state with debouncing
  useEffect(() => {
    // Avoid saving on initial render
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }

    setIsSaving(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        const now = new Date();
        setLastSaved(now);
        setHasSavedDraft(true);
        setIsSaving(false);
        if (onSave) {
          onSave(data);
        }
      } catch (e) {
        console.error('AutoSave: Failed to save to localStorage', e);
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, key, debounceMs, onSave]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch (e) {
      console.error('AutoSave: Failed to restore draft', e);
    }
    return null;
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasSavedDraft(false);
      setLastSaved(null);
    } catch (e) {
      console.error('AutoSave: Failed to clear draft', e);
    }
  }, [key]);

  const saveImmediately = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      const now = new Date();
      setLastSaved(now);
      setHasSavedDraft(true);
      setIsSaving(false);
    } catch (e) {
      console.error('AutoSave: Failed immediate save', e);
    }
  }, [data, key]);

  return {
    lastSaved,
    isSaving,
    hasSavedDraft,
    restoreDraft,
    clearDraft,
    saveImmediately
  };
}
