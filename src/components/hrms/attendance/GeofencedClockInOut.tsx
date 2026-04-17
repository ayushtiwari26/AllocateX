/**
 * Geofenced Clock In/Out Component
 * Uses user's current location as center with 1km radius for attendance
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { attendanceApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    LogIn,
    LogOut,
    Navigation,
    Shield,
    Wifi,
    Settings2,
    RefreshCw,
    Map as MapIcon
} from 'lucide-react';

interface GeoCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    clockInTime?: string;
    clockOutTime?: string;
    status: string;
    totalHours?: number;
    clockInLocation?: GeoCoordinates;
    clockOutLocation?: GeoCoordinates;
}

interface GeofenceConfig {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    officeName: string;
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function GeofencedClockInOut() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeoCoordinates | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
    const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    
    // Geofence configuration - default 1km radius
    const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(() => {
        const saved = localStorage.getItem('allocx_geofence_config');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            centerLat: 0,
            centerLng: 0,
            radiusKm: 1,
            officeName: 'Office Location'
        };
    });

    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.id) {
            loadTodayAttendance();
            // Auto-detect location on mount
            requestLocation();
        }
    }, [user]);

    // Save geofence config to localStorage
    useEffect(() => {
        localStorage.setItem('allocx_geofence_config', JSON.stringify(geofenceConfig));
    }, [geofenceConfig]);

    const loadTodayAttendance = async () => {
        if (!user?.id) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendanceRecords = await attendanceApi.getByEmployee(user.id, today, today);
            if (attendanceRecords && attendanceRecords.length > 0) {
                setTodayAttendance(attendanceRecords[0]);
            } else {
                setTodayAttendance(null);
            }
        } catch (error) {
            console.error('Failed to load attendance:', error);
        }
    };

    const requestLocation = async (): Promise<GeoCoordinates | null> => {
        setLocationLoading(true);
        setLocationError('');
        setMessage(null);

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                });
            });

            const location: GeoCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            setCurrentLocation(location);

            // If no office location set, use current location as center
            if (geofenceConfig.centerLat === 0 && geofenceConfig.centerLng === 0) {
                setGeofenceConfig(prev => ({
                    ...prev,
                    centerLat: location.latitude,
                    centerLng: location.longitude,
                    officeName: 'Current Location (Auto-detected)'
                }));
                setIsWithinGeofence(true);
                setDistanceFromOffice(0);
            } else {
                // Calculate distance from office
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    geofenceConfig.centerLat,
                    geofenceConfig.centerLng
                );
                setDistanceFromOffice(distance);
                setIsWithinGeofence(distance <= geofenceConfig.radiusKm);
            }

            setLocationLoading(false);
            return location;
        } catch (error: any) {
            let errorMessage = 'Failed to get location';

            if (error.code === 1) {
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Check your GPS/Network settings.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
            }

            setLocationError(errorMessage);
            setLocationLoading(false);
            return null;
        }
    };

    const setCurrentLocationAsOffice = async () => {
        const location = await requestLocation();
        if (location) {
            setGeofenceConfig(prev => ({
                ...prev,
                centerLat: location.latitude,
                centerLng: location.longitude,
                officeName: 'My Office'
            }));
            setIsWithinGeofence(true);
            setDistanceFromOffice(0);
            setMessage({ type: 'success', text: 'Office location set to your current position!' });
        }
    };

    const handleClockIn = async () => {
        if (!user?.id) return;

        setLoading(true);
        setMessage(null);

        try {
            // Get fresh location
            const location = await requestLocation();
            if (!location) {
                setMessage({ type: 'error', text: locationError || 'Location required for clock in' });
                setLoading(false);
                return;
            }

            // Check geofence
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                geofenceConfig.centerLat,
                geofenceConfig.centerLng
            );

            if (distance > geofenceConfig.radiusKm) {
                setMessage({ 
                    type: 'warning', 
                    text: `You're ${(distance * 1000).toFixed(0)}m away from the office. Allowed radius: ${geofenceConfig.radiusKm * 1000}m. Clock-in recorded with location flag.`
                });
            }

            // Clock in via API (flat payload expected by backend)
            const result = await attendanceApi.clockIn({
                employeeId: user.id,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                isWithinGeofence: distance <= geofenceConfig.radiusKm,
                distanceFromOffice: distance
            });

            if (result) {
                setMessage({
                    type: distance <= geofenceConfig.radiusKm ? 'success' : 'warning',
                    text: distance <= geofenceConfig.radiusKm 
                        ? `Clocked in successfully at ${new Date().toLocaleTimeString()}!`
                        : `Clocked in (outside geofence - ${(distance * 1000).toFixed(0)}m away)`
                });
                await loadTodayAttendance();
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Failed to clock in' });
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!user?.id || !todayAttendance?.id) return;

        setLoading(true);
        setMessage(null);

        try {
            // Get fresh location
            const location = await requestLocation();
            if (!location) {
                setMessage({ type: 'error', text: locationError || 'Location required for clock out' });
                setLoading(false);
                return;
            }

            // Clock out via API (flat payload expected by backend)
            const result = await attendanceApi.clockOut(todayAttendance.id, {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy
            });

            if (result) {
                const hours = result.totalHours || 0;
                setMessage({
                    type: 'success',
                    text: `Clocked out successfully! Total work hours: ${hours.toFixed(2)}h`
                });
                await loadTodayAttendance();
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Failed to clock out' });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const hasClockedIn = todayAttendance?.clockInTime;
    const hasClockedOut = todayAttendance?.clockOutTime;

    return (
        <div className="space-y-6">
            {/* Location & Geofence Status Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-violet-50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <MapPin className="w-5 h-5" />
                            Location & Geofence
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={requestLocation}
                                disabled={locationLoading}
                                className="h-8"
                            >
                                <RefreshCw className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                                className="h-8"
                            >
                                <Settings2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Location Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/80 rounded-xl p-4 border border-indigo-100">
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> Your Location
                            </p>
                            {locationLoading ? (
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Detecting...</span>
                                </div>
                            ) : currentLocation ? (
                                <div>
                                    <p className="text-sm font-mono text-slate-700">
                                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    </p>
                                    {currentLocation.accuracy && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-red-500">{locationError || 'Location not available'}</p>
                            )}
                        </div>

                        <div className="bg-white/80 rounded-xl p-4 border border-indigo-100">
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Geofence Status
                            </p>
                            {isWithinGeofence !== null ? (
                                <div className="flex items-center gap-2">
                                    {isWithinGeofence ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Within Range
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-700 border-0">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Outside Range
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">Checking...</p>
                            )}
                            {distanceFromOffice !== null && (
                                <p className="text-xs text-slate-500 mt-1">
                                    {distanceFromOffice < 1 
                                        ? `${(distanceFromOffice * 1000).toFixed(0)}m from office`
                                        : `${distanceFromOffice.toFixed(2)}km from office`
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Geofence Settings */}
                    {showSettings && (
                        <div className="bg-white/90 rounded-xl p-4 border border-indigo-200 space-y-4">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                <MapIcon className="w-4 h-4" />
                                Geofence Configuration
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-slate-500">Office Name</Label>
                                    <Input
                                        value={geofenceConfig.officeName}
                                        onChange={(e) => setGeofenceConfig(prev => ({ ...prev, officeName: e.target.value }))}
                                        className="mt-1 h-9"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Radius (km)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        max="10"
                                        value={geofenceConfig.radiusKm}
                                        onChange={(e) => setGeofenceConfig(prev => ({ ...prev, radiusKm: parseFloat(e.target.value) || 1 }))}
                                        className="mt-1 h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-slate-500">Center Latitude</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={geofenceConfig.centerLat}
                                        onChange={(e) => setGeofenceConfig(prev => ({ ...prev, centerLat: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1 h-9 font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Center Longitude</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={geofenceConfig.centerLng}
                                        onChange={(e) => setGeofenceConfig(prev => ({ ...prev, centerLng: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1 h-9 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={setCurrentLocationAsOffice}
                                variant="outline"
                                className="w-full"
                                disabled={locationLoading}
                            >
                                <Navigation className="w-4 h-4 mr-2" />
                                Set Current Location as Office Center
                            </Button>

                            <p className="text-xs text-slate-400 text-center">
                                Geofence radius: {geofenceConfig.radiusKm * 1000}m ({geofenceConfig.radiusKm}km)
                            </p>
                        </div>
                    )}

                    {/* Visual Geofence Map Placeholder */}
                    <div 
                        ref={mapRef}
                        className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Geofence Circle Visualization */}
                            <div className="relative">
                                <div className={`w-32 h-32 rounded-full border-4 ${isWithinGeofence ? 'border-emerald-400 bg-emerald-100/30' : 'border-red-400 bg-red-100/30'} flex items-center justify-center`}>
                                    <div className={`w-4 h-4 rounded-full ${isWithinGeofence ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                </div>
                                <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap">
                                    {geofenceConfig.radiusKm}km radius
                                </p>
                            </div>
                        </div>
                        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-400">
                            {geofenceConfig.officeName}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Clock In/Out Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Attendance - {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Status Message */}
                    {message && (
                        <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                            message.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                            {message.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                            {message.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
                            {message.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            {message.type === 'info' && <Wifi className="w-5 h-5 flex-shrink-0" />}
                            <p className="text-sm">{message.text}</p>
                        </div>
                    )}

                    {/* Today's Status */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                            <LogIn className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
                            <p className="text-xs text-slate-500">Clock In</p>
                            <p className="text-lg font-bold text-slate-900">
                                {formatTime(todayAttendance?.clockInTime)}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                            <LogOut className="w-6 h-6 mx-auto text-rose-600 mb-2" />
                            <p className="text-xs text-slate-500">Clock Out</p>
                            <p className="text-lg font-bold text-slate-900">
                                {formatTime(todayAttendance?.clockOutTime)}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                            <Clock className="w-6 h-6 mx-auto text-indigo-600 mb-2" />
                            <p className="text-xs text-slate-500">Total Hours</p>
                            <p className="text-lg font-bold text-slate-900">
                                {todayAttendance?.totalHours ? `${todayAttendance.totalHours.toFixed(2)}h` : '--'}
                            </p>
                        </div>
                    </div>

                    {/* Current Status Badge */}
                    {todayAttendance?.status && (
                        <div className="flex justify-center">
                            <Badge className={`text-sm px-4 py-1 ${
                                todayAttendance.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                todayAttendance.status === 'half-day' ? 'bg-amber-100 text-amber-700' :
                                todayAttendance.status === 'wfh' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                                Status: {todayAttendance.status.toUpperCase()}
                            </Badge>
                        </div>
                    )}

                    {/* Clock In/Out Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={handleClockIn}
                            disabled={loading || !!hasClockedIn || locationLoading}
                            className={`h-14 text-lg font-semibold transition-all ${
                                hasClockedIn 
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                            }`}
                        >
                            {loading && !hasClockedOut ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <LogIn className="w-5 h-5 mr-2" />
                            )}
                            {hasClockedIn ? 'Clocked In ✓' : 'Clock In'}
                        </Button>

                        <Button
                            onClick={handleClockOut}
                            disabled={loading || !hasClockedIn || !!hasClockedOut || locationLoading}
                            className={`h-14 text-lg font-semibold transition-all ${
                                hasClockedOut 
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                    : !hasClockedIn 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200'
                            }`}
                        >
                            {loading && hasClockedIn && !hasClockedOut ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <LogOut className="w-5 h-5 mr-2" />
                            )}
                            {hasClockedOut ? 'Clocked Out ✓' : 'Clock Out'}
                        </Button>
                    </div>

                    {/* Location Warning */}
                    {locationError && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-700">Location Access Required</p>
                                <p className="text-sm text-amber-600 mt-1">{locationError}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
