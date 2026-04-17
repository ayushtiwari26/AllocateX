/**
 * Capacitor Service - Native mobile functionality wrapper
 * Provides access to native device capabilities through Capacitor plugins
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position, type PermissionStatus as GeoPermissionStatus } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { Network, type ConnectionStatus } from '@capacitor/network';

// Platform detection
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
export const isAndroid = () => getPlatform() === 'android';
export const isIOS = () => getPlatform() === 'ios';
export const isWeb = () => getPlatform() === 'web';

// ==================== GEOLOCATION ====================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export const geolocationService = {
  /**
   * Check if geolocation is available on this platform
   */
  isAvailable: async (): Promise<boolean> => {
    if (!isNativePlatform()) {
      return 'geolocation' in navigator;
    }
    return true;
  },

  /**
   * Check geolocation permissions
   */
  checkPermissions: async (): Promise<GeoPermissionStatus> => {
    try {
      return await Geolocation.checkPermissions();
    } catch (error) {
      console.error('Error checking geolocation permissions:', error);
      return { location: 'denied', coarseLocation: 'denied' };
    }
  },

  /**
   * Request geolocation permissions
   */
  requestPermissions: async (): Promise<GeoPermissionStatus> => {
    try {
      return await Geolocation.requestPermissions();
    } catch (error) {
      console.error('Error requesting geolocation permissions:', error);
      return { location: 'denied', coarseLocation: 'denied' };
    }
  },

  /**
   * Get current position
   */
  getCurrentPosition: async (enableHighAccuracy = true): Promise<LocationData | null> => {
    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        altitude: position.coords.altitude ?? undefined,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined
      };
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  },

  /**
   * Watch position changes - returns Promise that resolves to watch ID
   */
  watchPosition: async (callback: (position: LocationData | null, error?: Error) => void, enableHighAccuracy = true): Promise<string> => {
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 0
      },
      (position, error) => {
        if (error) {
          callback(null, new Error(error.message));
          return;
        }
        if (position) {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude ?? undefined,
            speed: position.coords.speed ?? undefined,
            heading: position.coords.heading ?? undefined
          });
        }
      }
    );
    return watchId;
  },

  /**
   * Clear watch
   */
  clearWatch: async (watchId: string): Promise<void> => {
    await Geolocation.clearWatch({ id: watchId });
  }
};

// ==================== PREFERENCES (Storage) ====================

export const preferencesService = {
  /**
   * Store a value
   */
  set: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },

  /**
   * Store an object as JSON
   */
  setObject: async <T>(key: string, value: T): Promise<void> => {
    await Preferences.set({ key, value: JSON.stringify(value) });
  },

  /**
   * Get a value
   */
  get: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },

  /**
   * Get an object from JSON
   */
  getObject: async <T>(key: string): Promise<T | null> => {
    const { value } = await Preferences.get({ key });
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  /**
   * Remove a value
   */
  remove: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },

  /**
   * Clear all stored values
   */
  clear: async (): Promise<void> => {
    await Preferences.clear();
  },

  /**
   * Get all keys
   */
  keys: async (): Promise<string[]> => {
    const { keys } = await Preferences.keys();
    return keys;
  }
};

// ==================== PUSH NOTIFICATIONS ====================

export interface PushNotificationCallbacks {
  onRegistration?: (token: Token) => void;
  onRegistrationError?: (error: any) => void;
  onPushReceived?: (notification: PushNotificationSchema) => void;
  onActionPerformed?: (action: ActionPerformed) => void;
}

export const pushNotificationService = {
  /**
   * Check if push notifications are available
   */
  isAvailable: (): boolean => {
    return isNativePlatform();
  },

  /**
   * Check permissions
   */
  checkPermissions: async () => {
    if (!isNativePlatform()) {
      return { receive: 'denied' as const };
    }
    return await PushNotifications.checkPermissions();
  },

  /**
   * Request permissions
   */
  requestPermissions: async () => {
    if (!isNativePlatform()) {
      return { receive: 'denied' as const };
    }
    return await PushNotifications.requestPermissions();
  },

  /**
   * Register for push notifications
   */
  register: async (): Promise<void> => {
    if (!isNativePlatform()) {
      console.warn('Push notifications not available on web');
      return;
    }
    await PushNotifications.register();
  },

  /**
   * Setup notification listeners
   */
  addListeners: (callbacks: PushNotificationCallbacks): (() => void) => {
    if (!isNativePlatform()) {
      return () => {};
    }

    const listeners: (() => void)[] = [];

    if (callbacks.onRegistration) {
      PushNotifications.addListener('registration', callbacks.onRegistration)
        .then(l => listeners.push(() => l.remove()));
    }

    if (callbacks.onRegistrationError) {
      PushNotifications.addListener('registrationError', callbacks.onRegistrationError)
        .then(l => listeners.push(() => l.remove()));
    }

    if (callbacks.onPushReceived) {
      PushNotifications.addListener('pushNotificationReceived', callbacks.onPushReceived)
        .then(l => listeners.push(() => l.remove()));
    }

    if (callbacks.onActionPerformed) {
      PushNotifications.addListener('pushNotificationActionPerformed', callbacks.onActionPerformed)
        .then(l => listeners.push(() => l.remove()));
    }

    // Return cleanup function
    return () => {
      listeners.forEach(remove => remove());
    };
  },

  /**
   * Remove all listeners
   */
  removeAllListeners: async (): Promise<void> => {
    if (!isNativePlatform()) return;
    await PushNotifications.removeAllListeners();
  },

  /**
   * Get delivered notifications
   */
  getDeliveredNotifications: async () => {
    if (!isNativePlatform()) {
      return { notifications: [] };
    }
    return await PushNotifications.getDeliveredNotifications();
  },

  /**
   * Remove delivered notifications by IDs
   */
  removeDeliveredNotifications: async (ids: string[]): Promise<void> => {
    if (!isNativePlatform()) return;
    // Get delivered notifications first to find full notification objects
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    const toRemove = notifications.filter(n => ids.includes(n.id));
    if (toRemove.length > 0) {
      await PushNotifications.removeDeliveredNotifications({ notifications: toRemove });
    }
  },

  /**
   * Remove all delivered notifications
   */
  removeAllDeliveredNotifications: async (): Promise<void> => {
    if (!isNativePlatform()) return;
    await PushNotifications.removeAllDeliveredNotifications();
  }
};

// ==================== NETWORK ====================

export interface NetworkState {
  connected: boolean;
  connectionType: string;
}

export const networkService = {
  /**
   * Get current network status
   */
  getStatus: async (): Promise<NetworkState> => {
    const status: ConnectionStatus = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType
    };
  },

  /**
   * Add network status change listener
   */
  addListener: (callback: (status: NetworkState) => void): (() => void) => {
    let cleanup: (() => void) | null = null;

    Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType
      });
    }).then(handle => {
      cleanup = () => handle.remove();
    });

    return () => {
      if (cleanup) cleanup();
    };
  },

  /**
   * Remove all listeners
   */
  removeAllListeners: async (): Promise<void> => {
    await Network.removeAllListeners();
  }
};

// ==================== UTILITY HOOKS ====================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if location is within a geofence
 */
export const isWithinGeofence = (
  currentLat: number,
  currentLon: number,
  fenceLat: number,
  fenceLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(currentLat, currentLon, fenceLat, fenceLon);
  return distance <= radiusKm;
};

// Export all services as a combined object for convenience
export const capacitorServices = {
  isNative: isNativePlatform,
  platform: getPlatform,
  geolocation: geolocationService,
  preferences: preferencesService,
  pushNotifications: pushNotificationService,
  network: networkService,
  utils: {
    calculateDistance,
    isWithinGeofence
  }
};

export default capacitorServices;
