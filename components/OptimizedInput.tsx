import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface OptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  debounceMs?: number;
  className?: string;
}

export const OptimizedInput: React.FC<OptimizedInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  debounceMs = 500,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Notify parent of debounced changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, value, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all ${className}`}
      rows={4}
    />
  );
};
