/**
 * Clock In/Out Component
 * Allows employees to mark attendance with GPS geofencing
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { attendanceService } from '@/services/hrms/attendanceService';
import { useAuth } from '@/context/AuthContext';
import {
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    LogIn,
    LogOut
} from 'lucide-react';
import type { AttendanceLog, GeoCoordinates } from '@/types/hrms';

export default function ClockInOut() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeoCoordinates | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    const [todayAttendance, setTodayAttendance] = useState<AttendanceLog | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadTodayAttendance();
        }
    }, [user]);

    const loadTodayAttendance = () => {
        if (!user?.id) return;
        const attendance = attendanceService.getTodayAttendance(user.id);
        setTodayAttendance(attendance);
    };

    const requestLocation = async (): Promise<GeoCoordinates | null> => {
        setLocationLoading(true);
        setLocationError('');

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const location: GeoCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            setCurrentLocation(location);
            setLocationLoading(false);
            return location;
        } catch (error: any) {
            let errorMessage = 'Failed to get location';

            if (error.code === 1) {
                errorMessage = 'Location permission denied. Please enable location access.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Check your GPS settings.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
            }

            setLocationError(errorMessage);
            setLocationLoading(false);
            return null;
        }
    };

    const handleClockIn = async () => {
        if (!user?.id) return;

        setLoading(true);
        setMessage(null);

        try {
            // Check if can clock in
            const canClockIn = attendanceService.canClockIn(user.id);
            if (!canClockIn.canClockIn) {
                setMessage({ type: 'error', text: canClockIn.reason || 'Cannot clock in' });
                setLoading(false);
                return;
            }

            // Get location
            const location = await requestLocation();
            if (!location) {
                setMessage({ type: 'error', text: locationError || 'Location required for clock in' });
                setLoading(false);
                return;
            }

            // Clock in
            const result = attendanceService.clockIn(user.id, location);

            if (result.success) {
                setMessage({
                    type: result.geofenceValidation.isValid ? 'success' : 'error',
                    text: result.geofenceValidation.isValid
                        ? `Clocked in successfully! Status: ${result.log.status}`
                        : `Clock in recorded but you're ${Math.round(result.geofenceValidation.distance)}m away from office (allowed: 100m)`
                });
                loadTodayAttendance();
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to clock in' });
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!user?.id) return;

        setLoading(true);
        setMessage(null);

        try {
            // Check if can clock out
            const canClockOut = attendanceService.canClockOut(user.id);
            if (!canClockOut.canClockOut) {
                setMessage({ type: 'error', text: canClockOut.reason || 'Cannot clock out' });
                setLoading(false);
                return;
            }

            // Get location
            const location = await requestLocation();
            if (!location) {
                setMessage({ type: 'error', text: locationError || 'Location required for clock out' });
                setLoading(false);
                return;
            }

            // Clock out
            const result = attendanceService.clockOut(user.id, location);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: `Clocked out successfully! Work hours: ${result.workHours}h - Status: ${result.log.status}`
                });
                loadTodayAttendance();
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to clock out' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'text-green-600 bg-green-50 border-green-200';
            case 'Late': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Half Day': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'No Attendance': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Present': return <CheckCircle2 className="w-5 h-5" />;
            case 'Late': return <AlertCircle className="w-5 h-5" />;
            case 'No Attendance': return <XCircle className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const hasClockedIn = todayAttendance && todayAttendance.clockInTime;
    const hasClockedOut = todayAttendance && todayAttendance.clockOutTime;

    return (
        <div className="space-y-6">
            {/* Main Clock In/Out Card */}
            <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-6 h-6" />
                        Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* Today's Status */}
                    {todayAttendance && (
                        <div className={`p-4 rounded-lg border-2 mb-6 ${getStatusColor(todayAttendance.status)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(todayAttendance.status)}
                                    <div>
                                        <p className="font-semibold text-lg">Today's Status: {todayAttendance.status}</p>
                                        <p className="text-sm opacity-80">
                                            {todayAttendance.clockInTime && `In: ${formatTime(todayAttendance.clockInTime)}`}
                                            {todayAttendance.clockOutTime && ` • Out: ${formatTime(todayAttendance.clockOutTime)}`}
                                            {todayAttendance.workHours && ` • Hours: ${todayAttendance.workHours}h`}
                                        </p>
                                    </div>
                                </div>
                                {!todayAttendance.isGeofenceValid && (
                                    <div className="text-sm font-medium">
                                        ⚠️ Geofence violation
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Location Status */}
                    {currentLocation && (
                        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    {currentLocation.accuracy && ` (±${Math.round(currentLocation.accuracy)}m)`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Message Display */}
                    {message && (
                        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                                message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                                    'bg-blue-50 border border-blue-200 text-blue-800'
                            }`}>
                            <p className="font-medium">{message.text}</p>
                        </div>
                    )}

                    {/* Location Error */}
                    {locationError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                            <div className="flex items-center gap-2 text-red-700">
                                <XCircle className="w-5 h-5" />
                                <p className="font-medium">{locationError}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={handleClockIn}
                            disabled={loading || locationLoading || hasClockedIn}
                            size="lg"
                            className="h-20 text-lg bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-6 h-6 mr-2" />
                                    Clock In
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleClockOut}
                            disabled={loading || locationLoading || !hasClockedIn || hasClockedOut}
                            size="lg"
                            className="h-20 text-lg bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="w-6 h-6 mr-2" />
                                    Clock Out
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Note:</span> You must be within 100 meters of the office location to mark attendance.
                            Make sure location services are enabled on your device.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
