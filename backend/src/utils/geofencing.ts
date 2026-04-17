import { config } from '../config';

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if location is within geofence radius
 */
export const isWithinGeofence = (location: Location): boolean => {
  const officeLocation: Location = {
    latitude: config.geofencing.officeLatitude,
    longitude: config.geofencing.officeLongitude,
  };

  const distance = calculateDistance(location, officeLocation);
  return distance <= config.geofencing.radiusMeters;
};

/**
 * Validate GPS coordinates
 */
export const isValidLocation = (location: Location): boolean => {
  return (
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
};
