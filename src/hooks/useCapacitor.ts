/**
 * React hooks for Capacitor native features
 */

import { useState, useEffect, useCallback } from 'react';
import {
  geolocationService,
  networkService,
  preferencesService,
  pushNotificationService,
  isNativePlatform,
  type LocationData,
  type NetworkState,
  type PushNotificationCallbacks
} from '@/services/capacitorService';

/**
 * Hook for geolocation functionality
 */
export function useGeolocation(options?: { enableHighAccuracy?: boolean; watch?: boolean }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  const { enableHighAccuracy = true, watch = false } = options || {};

  const checkPermission = useCallback(async () => {
    const status = await geolocationService.checkPermissions();
    setPermissionStatus(status.location);
    return status.location;
  }, []);

  const requestPermission = useCallback(async () => {
    const status = await geolocationService.requestPermissions();
    setPermissionStatus(status.location);
    return status.location;
  }, []);

  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await geolocationService.getCurrentPosition(enableHighAccuracy);
      setLocation(pos);
      return pos;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get location');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enableHighAccuracy]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (!watch) return;

    let watchId: string | null = null;

    geolocationService.watchPosition(
      (pos, err) => {
        if (err) {
          setError(err);
        } else {
          setLocation(pos);
          setError(null);
        }
      },
      enableHighAccuracy
    ).then(id => {
      watchId = id;
    });

    return () => {
      if (watchId) {
        geolocationService.clearWatch(watchId);
      }
    };
  }, [watch, enableHighAccuracy]);

  return {
    location,
    error,
    loading,
    permissionStatus,
    checkPermission,
    requestPermission,
    getCurrentPosition
  };
}

/**
 * Hook for network status
 */
export function useNetwork() {
  const [status, setStatus] = useState<NetworkState>({ connected: true, connectionType: 'unknown' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial status
    networkService.getStatus().then(s => {
      setStatus(s);
      setLoading(false);
    });

    // Listen for changes
    const removeListener = networkService.addListener(setStatus);

    return () => {
      removeListener();
    };
  }, []);

  return {
    ...status,
    isOnline: status.connected,
    loading
  };
}

/**
 * Hook for push notifications
 */
export function usePushNotifications(callbacks?: PushNotificationCallbacks) {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isRegistered, setIsRegistered] = useState(false);

  const checkPermission = useCallback(async () => {
    const status = await pushNotificationService.checkPermissions();
    setPermissionStatus(status.receive);
    return status.receive;
  }, []);

  const requestPermission = useCallback(async () => {
    const status = await pushNotificationService.requestPermissions();
    setPermissionStatus(status.receive);
    return status.receive;
  }, []);

  const register = useCallback(async () => {
    if (!isNativePlatform()) {
      console.warn('Push notifications not available on web');
      return false;
    }

    const permission = await requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    await pushNotificationService.register();
    setIsRegistered(true);
    return true;
  }, [requestPermission]);

  useEffect(() => {
    if (!isNativePlatform()) return;

    checkPermission();

    const cleanup = pushNotificationService.addListeners({
      onRegistration: (t) => {
        setToken(t.value);
        callbacks?.onRegistration?.(t);
      },
      onRegistrationError: callbacks?.onRegistrationError,
      onPushReceived: callbacks?.onPushReceived,
      onActionPerformed: callbacks?.onActionPerformed
    });

    return cleanup;
  }, [callbacks, checkPermission]);

  return {
    token,
    permissionStatus,
    isRegistered,
    isAvailable: isNativePlatform(),
    checkPermission,
    requestPermission,
    register
  };
}

/**
 * Hook for persistent storage using Capacitor Preferences
 */
export function usePreferences<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Load initial value
  useEffect(() => {
    preferencesService.getObject<T>(key).then(stored => {
      if (stored !== null) {
        setValue(stored);
      }
      setLoading(false);
    });
  }, [key]);

  // Save value
  const setStoredValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    const valueToStore = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue;
    setValue(valueToStore);
    await preferencesService.setObject(key, valueToStore);
  }, [key, value]);

  // Remove value
  const removeValue = useCallback(async () => {
    setValue(defaultValue);
    await preferencesService.remove(key);
  }, [key, defaultValue]);

  return {
    value,
    setValue: setStoredValue,
    removeValue,
    loading
  };
}

/**
 * Hook for platform detection
 */
export function usePlatform() {
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web');

  useEffect(() => {
    if (isNativePlatform()) {
      const { Capacitor } = require('@capacitor/core');
      setPlatform(Capacitor.getPlatform() as 'android' | 'ios');
    }
  }, []);

  return {
    platform,
    isNative: platform !== 'web',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web'
  };
}
