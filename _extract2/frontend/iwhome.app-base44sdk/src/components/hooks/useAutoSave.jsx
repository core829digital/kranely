import { useEffect, useRef } from 'react';
import { autoSave } from '../utils/autoSave';

export const useAutoSave = (key, data, options = {}) => {
  const {
    delay = 2000,
    encrypt = true,
    enabled = true
  } = options;

  const previousData = useRef(data);

  useEffect(() => {
    if (!enabled || !key) return;

    if (JSON.stringify(data) !== JSON.stringify(previousData.current)) {
      autoSave(key, data, delay, encrypt);
      previousData.current = data;
    }
  }, [data, key, delay, encrypt, enabled]);
};