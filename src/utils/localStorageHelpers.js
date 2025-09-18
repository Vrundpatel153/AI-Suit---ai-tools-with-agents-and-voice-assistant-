// Local Storage helpers for AiSuite

const STORAGE_KEYS = {
  HISTORY: 'aisuite_history',
  SETTINGS: 'aisuite_settings',
  DEV_MODE: 'aisuite_dev_mode',
  USER: 'aisuite_user',
  USERS: 'aisuite_users'
};

// History management
export const saveToHistory = (entry) => {
  try {
    const history = getHistory();
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry
    };
    
    // Keep only last 20 entries
    const updatedHistory = [newEntry, ...history].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    
    return newEntry;
  } catch (error) {
    console.error('Failed to save to history:', error);
    return null;
  }
};

export const getHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

export const removeFromHistory = (id) => {
  try {
    const history = getHistory();
    const filteredHistory = history.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filteredHistory));
    return true;
  } catch (error) {
    console.error('Failed to remove from history:', error);
    return false;
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
};

// Settings management
export const getSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {
      ttsEnabled: true,
      autoAllowMic: false,
      theme: 'retro',
      notifications: true
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      ttsEnabled: true,
      autoAllowMic: false,
      theme: 'retro',
      notifications: true
    };
  }
};

export const updateSettings = (newSettings) => {
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    return null;
  }
};

// Dev Mode management
export const getDevMode = () => {
  try {
    const devMode = localStorage.getItem(STORAGE_KEYS.DEV_MODE);
    return devMode === null ? true : devMode === 'true'; // Default to true for demo
  } catch (error) {
    console.error('Failed to load dev mode setting:', error);
    return true;
  }
};

export const setDevMode = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DEV_MODE, enabled.toString());
    return true;
  } catch (error) {
    console.error('Failed to set dev mode:', error);
    return false;
  }
};

// Data export/import utilities
export const exportData = () => {
  try {
    const data = {
      history: getHistory(),
      settings: getSettings(),
      devMode: getDevMode(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `aisuite-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export data:', error);
    return false;
  }
};

export const importData = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (data.history) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    }
    
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    
    if (typeof data.devMode === 'boolean') {
      setDevMode(data.devMode);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

// Authentication management
const dispatchAuthChanged = () => {
  try {
    window.dispatchEvent(new Event('aisuite-auth-changed'));
  } catch (e) {
    // no-op for non-browser environments
  }
};

export const authenticateUser = (email, password) => {
  try {
    // Demo user
    if (email === 'demo@aisuite.com' && password === 'demo123') {
      const user = {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@aisuite.com',
        avatar: null,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      dispatchAuthChanged();
      return true;
    }
    
    // Check registered users
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
      dispatchAuthChanged();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
};

// OAuth-style login (mocked)
// Real Google OAuth login using Google Identity Services
// 1. Go to https://console.cloud.google.com/apis/credentials and create a Web OAuth Client ID
// 2. Put your client ID in VITE_GOOGLE_CLIENT_ID env var
// 3. This will open a Google login popup and store the user info on success
// Read Google Client ID directly (Vite replaces import.meta.env at build time)
// Simplified: direct Firebase popup flow only (normal Google account chooser)
export const loginWithGoogle = async () => {
  try {
    const { signInWithGooglePopup } = await import('../lib/firebase');
    const cred = await signInWithGooglePopup(); // user gesture context
    const user = cred?.user;
    if (!user?.email) {
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
      id: user.uid,
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL,
      provider: 'firebase-google',
      createdAt: new Date().toISOString(),
    }));
    dispatchAuthChanged();
    return true;
  } catch (err) {
    // Handle common popup issues
    if (err?.code === 'auth/popup-blocked') {
      alert('Popup was blocked. Please allow popups for this site and try again.');
    } else if (err?.code === 'auth/cancelled-popup-request') {
      // Ignore; user perhaps double-clicked
    } else if (err?.code === 'auth/popup-closed-by-user') {
      // User closed; no alert necessary
    } else {
      console.error('[Auth] Google login error:', err);
      alert('Google login failed. Check console for details.');
    }
    return false;
  }
};

// True demo mode: no Google / offline user
export const loginAsDemo = () => {
  const existing = localStorage.getItem(STORAGE_KEYS.USER);
  if (existing) return true;
  const demoUser = {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@aisuite.local',
    avatar: null,
    provider: 'demo',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
  dispatchAuthChanged();
  return true;
};
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const logoutUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Attempt to sign out from Firebase Auth if available
    try {
      import('../lib/firebase').then(async (m) => {
        if (m && typeof m.signOutFirebase === 'function') {
          await m.signOutFirebase();
        }
      }).catch(() => {});
    } catch {}
    dispatchAuthChanged();
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

const getUsers = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Failed to load users:', error);
    return [];
  }
};

// Sample data seeding for demo
export const seedSampleData = () => {
  const existingHistory = getHistory();
  
  if (existingHistory.length === 0) {
    const sampleHistory = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        tool: 'task-scheduler',
        excerpt: 'Team standup meeting scheduled for tomorrow',
        data: {
          title: 'Daily Standup',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '09:00',
          duration_minutes: 30
        }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        tool: 'text-summarizer',
        excerpt: 'Summarized quarterly report document',
        data: {
          summary: 'Q3 performance showed 15% growth with strong customer satisfaction metrics.',
          wordCount: 1250
        }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        tool: 'code-explainer',
        excerpt: 'Explained React component structure',
        data: {
          explanation: 'This component implements a reusable UI element with state management.',
          language: 'javascript'
        }
      }
    ];
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleHistory));
  }
};
