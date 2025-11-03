import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to prevent keyboard dismissal on mobile devices.
 * Uses local state that only syncs when user stops typing (debounced).
 * This prevents component re-renders during typing.
 */
export const useFormInput = (initialValue: string = '', onChangeDebounced?: (value: string) => void, debounceMs: number = 300) => {
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!onChangeDebounced) return;

    const timer = setTimeout(() => {
      onChangeDebounced(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChangeDebounced, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const reset = useCallback(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  return {
    value: localValue,
    onChange: handleChange,
    reset,
  };
};
