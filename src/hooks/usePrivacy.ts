import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface PrivacySettings {
  profileVisibility: 'public' | 'university' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: 'everyone' | 'verified' | 'none';
  showOnline: boolean;
  dataSharing: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
}

const defaultSettings: PrivacySettings = {
  profileVisibility: 'university',
  showEmail: false,
  showPhone: false,
  allowMessages: 'verified',
  showOnline: true,
  dataSharing: false,
  marketingEmails: false,
  pushNotifications: true,
};

// Utility function to get any user's privacy settings
export const getUserPrivacySettings = (userId: string): PrivacySettings => {
  const stored = localStorage.getItem(`privacy_settings_${userId}`);
  if (stored) {
    try {
      const parsedSettings = JSON.parse(stored);
      return { ...defaultSettings, ...parsedSettings };
    } catch (error) {
      console.error('Failed to parse privacy settings for user:', userId, error);
    }
  }
  return defaultSettings;
};

// Utility function to check if a user can message another user
export const canUserSendMessage = (senderVerified: boolean = false, recipientUserId: string): boolean => {
  const recipientSettings = getUserPrivacySettings(recipientUserId);
  
  switch (recipientSettings.allowMessages) {
    case 'everyone':
      return true;
    case 'verified':
      return senderVerified;
    case 'none':
      return false;
    default:
      return false;
  }
};

export const usePrivacy = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);

  // Load privacy settings from localStorage
  useEffect(() => {
    if (!user?.id) return;

    const stored = localStorage.getItem(`privacy_settings_${user.id}`);
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse privacy settings:', error);
        setSettings(defaultSettings);
      }
    }
  }, [user?.id]);

  // Save privacy settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<PrivacySettings>) => {
    if (!user?.id) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(`privacy_settings_${user.id}`, JSON.stringify(updatedSettings));
  }, [user?.id, settings]);

  // Privacy check functions for current user's settings
  const canViewProfile = useCallback((viewerUniversity?: string) => {
    switch (settings.profileVisibility) {
      case 'public':
        return true;
      case 'university':
        return viewerUniversity === user?.university;
      case 'private':
        return false;
      default:
        return false;
    }
  }, [settings.profileVisibility, user?.university]);

  const canSendMessage = useCallback((senderVerified: boolean = false) => {
    switch (settings.allowMessages) {
      case 'everyone':
        return true;
      case 'verified':
        return senderVerified;
      case 'none':
        return false;
      default:
        return false;
    }
  }, [settings.allowMessages]);

  const shouldShowEmail = useCallback(() => {
    return settings.showEmail;
  }, [settings.showEmail]);

  const shouldShowPhone = useCallback(() => {
    return settings.showPhone;
  }, [settings.showPhone]);

  const shouldShowOnlineStatus = useCallback(() => {
    return settings.showOnline;
  }, [settings.showOnline]);

  // Get filtered user data based on privacy settings
  const getFilteredUserData = useCallback((viewer?: { university?: string; verified?: boolean }) => {
    if (!user) return null;

    const canView = canViewProfile(viewer?.university);
    
    if (!canView) {
      return {
        id: user.id,
        name: user.name,
        university: user.university,
        verified: user.verified,
        // Hide sensitive data
        email: '',
        bio: '',
        year: '',
        createdAt: user.createdAt,
      };
    }

    return {
      ...user,
      email: shouldShowEmail() ? user.email : '',
      // Add phone when we have it
    };
  }, [user, canViewProfile, shouldShowEmail]);

  return {
    settings,
    updateSettings,
    canViewProfile,
    canSendMessage,
    shouldShowEmail,
    shouldShowPhone,
    shouldShowOnlineStatus,
    getFilteredUserData,
    // Utility functions for checking other users' privacy
    getUserPrivacySettings,
    canUserSendMessage,
  };
};
