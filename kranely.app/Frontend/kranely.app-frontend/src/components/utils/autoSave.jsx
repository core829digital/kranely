import { get, set, del } from 'idb-keyval';
import { encryptData, decryptData } from './security';

// Auto-save with debounce
let saveTimeouts = {};

export const autoSave = async (key, data, delay = 2000, encrypt = true) => {
  if (saveTimeouts[key]) {
    clearTimeout(saveTimeouts[key]);
  }
  
  saveTimeouts[key] = setTimeout(async () => {
    try {
      const dataToStore = encrypt ? encryptData(data) : data;
      await set(key, {
        data: dataToStore,
        timestamp: Date.now(),
        encrypted: encrypt
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, delay);
};

// Load auto-saved data
export const loadAutoSaved = async (key) => {
  try {
    const stored = await get(key);
    if (!stored) return null;
    
    const data = stored.encrypted ? decryptData(stored.data) : stored.data;
    return {
      data,
      timestamp: stored.timestamp
    };
  } catch (error) {
    console.error('Load auto-saved error:', error);
    return null;
  }
};

// Clear auto-saved data
export const clearAutoSaved = async (key) => {
  try {
    await del(key);
  } catch (error) {
    console.error('Clear auto-save error:', error);
  }
};