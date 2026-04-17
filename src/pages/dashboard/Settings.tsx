import React, { useMemo, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, ShieldCheck, Building2, Upload, Camera, X, Loader2, User, Bell, Settings2, Sparkles, Key, Globe, Zap } from 'lucide-react';

export default function Settings() {
    const { user, organisation, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fullName = useMemo(() => {
        if (user?.fullName && user.fullName.trim().length > 0) return user.fullName.trim();
        if (user?.displayName && user.displayName.trim().length > 0) return user.displayName.trim();
        return user?.email?.split('@')[0] ?? 'AllocateX User';
    }, [user?.fullName, user?.displayName, user?.email]);

    const avatarUrl = useMemo(() => {
        if (previewUrl) return previewUrl;
        if (user?.avatar && user.avatar.trim().length > 0) return user.avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4c6ef5&color=fff`;
    }, [user?.avatar, fullName, previewUrl]);

    const initials = useMemo(() => {
        return fullName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((segment) => segment[0]?.toUpperCase())
            .join('') || 'AX';
    }, [fullName]);

    const roleLabel = useMemo(() => {
        if (!user?.role) return 'Member';
        return user.role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }, [user?.role]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUploadPhoto = async () => {
        if (!previewUrl) return;

        setIsUploading(true);
        setSaveSuccess(false);
        try {
            // Store the base64 image in localStorage as a simple solution
            // In production, this would upload to a server/cloud storage
            localStorage.setItem('allocx_user_avatar', previewUrl);
            
            // Update user context
            if (updateUser) {
                await updateUser({ avatar: previewUrl });
            }
            
            setSaveSuccess(true);
            setPreviewUrl(null); // Clear preview after successful save
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        setPreviewUrl(null);
        localStorage.removeItem('allocx_user_avatar');
        if (updateUser) {
            updateUser({ avatar: undefined });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08),transparent_60%)] opacity-50" />
                
                <div className="relative px-4 sm:px-8 py-6 sm:py-8">
                    <div className="max-w-6xl mx-auto">
                        <Badge className="bg-white/20 text-white border-0 mb-3 sm:mb-4 text-xs">
                            <Settings2 className="w-3 h-3 mr-1" />
                            Account Center
                        </Badge>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">Settings & Preferences</h1>
                                <p className="text-white/70 mt-1 sm:mt-2 text-sm sm:text-base">Tune your profile and workspace defaults.</p>
                            </div>
                            <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-white/80">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Data secured with enterprise-grade encryption
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-6">
                        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-b from-white to-slate-50/80 overflow-hidden">
                            <div className="h-20 bg-gradient-to-r from-indigo-500 to-violet-500" />
                            <CardContent className="-mt-12 space-y-5">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                                            <AvatarImage src={avatarUrl} alt={fullName} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold text-2xl">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <button
                                            onClick={triggerFileInput}
                                            className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all transform hover:scale-105 ring-4 ring-white"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                    <div className="text-center pt-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
                                            <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] uppercase tracking-wide">
                                                {roleLabel}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-1.5">
                                            <Mail className="h-3.5 w-3.5" />
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Workspace</span>
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <p className="font-semibold text-slate-900">{organisation?.name || 'AllocateX Workspace'}</p>
                                    <div className="pt-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-400">Member Since</span>
                                        <p className="text-sm text-slate-700">{organisation?.createdAt ? new Date(organisation.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {previewUrl && (
                                        <Button 
                                            onClick={handleUploadPhoto} 
                                            disabled={isUploading}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200/50"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Save New Photo
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 border-slate-200 hover:bg-slate-50"
                                            onClick={triggerFileInput}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            {previewUrl ? 'Change' : 'Upload Photo'}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                            onClick={handleRemovePhoto}
                                            disabled={!previewUrl && !user?.avatar}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center mt-1">
                                        JPG, PNG or GIF. Max 5MB.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-dashed border-slate-300 bg-white/80 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-indigo-500" /> Workspace Snapshot
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Align resource policies and organisation defaults.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Industry</span>
                                    <Badge variant="outline" className="bg-slate-50 font-medium">{organisation?.industry || 'Technology'}</Badge>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-slate-600">Company Size</span>
                                    <Badge variant="outline" className="bg-slate-50 font-medium">{organisation?.size || '51-200'}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    <section>
                        <Tabs defaultValue="account" className="w-full">
                            <TabsList className="inline-flex h-12 items-center bg-white rounded-xl border border-slate-200 p-1.5 text-sm font-medium shadow-sm">
                                <TabsTrigger value="account" className="rounded-lg px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                                    <User className="w-4 h-4 mr-2" />
                                    Account
                                </TabsTrigger>
                                <TabsTrigger value="organisation" className="rounded-lg px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Workspace
                                </TabsTrigger>
                                <TabsTrigger value="notifications" className="rounded-lg px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                                    <Bell className="w-4 h-4 mr-2" />
                                    Notifications
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="account" className="mt-6 space-y-6">
                                <Card className="shadow-lg shadow-slate-200/50 border-0 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Profile Information</CardTitle>
                                                <CardDescription>This is how your teammates see you across AllocateX.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                                                <Input id="fullName" defaultValue={fullName} placeholder="Enter your full name" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="role" className="text-slate-700">Role</Label>
                                                <Input id="role" value={roleLabel} disabled className="bg-slate-50 border-slate-200" />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-slate-700">Email</Label>
                                                <Input id="email" defaultValue={user?.email} disabled className="bg-slate-50 border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                                                <Input id="phone" placeholder="Add a contact number" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">Changes sync instantly with your resource allocation profile.</p>
                                        <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-200/50">
                                            <Zap className="w-4 h-4 mr-1.5" />
                                            Save profile
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card className="shadow-lg shadow-slate-200/50 border-0 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <Key className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Security</CardTitle>
                                                <CardDescription>Manage your password and authentication settings.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="current-password" className="text-slate-700">Current Password</Label>
                                                <Input id="current-password" type="password" placeholder="••••••••" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="new-password" className="text-slate-700">New Password</Label>
                                                <Input id="new-password" type="password" placeholder="Create a strong password" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password" className="text-slate-700">Confirm Password</Label>
                                            <Input id="confirm-password" type="password" placeholder="Repeat new password" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">Need help? Contact security@allocx.io</p>
                                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50">Update password</Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            <TabsContent value="organisation" className="mt-6 space-y-6">
                                <Card className="shadow-lg shadow-slate-200/50 border-0 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-violet-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Workspace Details</CardTitle>
                                                <CardDescription>Align naming, brand touchpoints, and default working hours.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="orgName" className="text-slate-700">Workspace Name</Label>
                                                <Input id="orgName" defaultValue={organisation?.name} placeholder="Acme Delivery Platform" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="primary-region" className="text-slate-700">Primary Region</Label>
                                                <Input id="primary-region" placeholder="APAC, EMEA, NA..." className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="industry" className="text-slate-700">Industry</Label>
                                                <Input id="industry" defaultValue={organisation?.industry} placeholder="Technology" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="company-size" className="text-slate-700">Company Size</Label>
                                                <Input id="company-size" defaultValue={organisation?.size} placeholder="51-200" className="border-slate-200 focus:border-indigo-300 focus:ring-indigo-200" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">Workspace settings influence allocation rules and reporting.</p>
                                        <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-200/50">
                                            <Zap className="w-4 h-4 mr-1.5" />
                                            Save workspace
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notifications" className="mt-6">
                                <Card className="shadow-lg shadow-slate-200/50 border-0 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                <Bell className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Notifications</CardTitle>
                                                <CardDescription>Stay in the loop on critical allocation changes without the noise.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-center justify-between space-x-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4 group hover:shadow-md transition-all">
                                            <Label htmlFor="email-notifs" className="flex flex-col space-y-1 text-sm cursor-pointer">
                                                <span className="font-semibold text-slate-900 flex items-center gap-2">
                                                    Email alerts
                                                    <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px]">Recommended</Badge>
                                                </span>
                                                <span className="text-xs text-slate-500">Assignments, approvals, and risk flags</span>
                                            </Label>
                                            <Switch id="email-notifs" defaultChecked className="data-[state=checked]:bg-indigo-600" />
                                        </div>
                                        <div className="flex items-center justify-between space-x-4 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all">
                                            <Label htmlFor="marketing-emails" className="flex flex-col space-y-1 text-sm cursor-pointer">
                                                <span className="font-semibold text-slate-900">Product updates</span>
                                                <span className="text-xs text-slate-500">Occasional releases and roadmap notes</span>
                                            </Label>
                                            <Switch id="marketing-emails" />
                                        </div>
                                        <div className="flex items-center justify-between space-x-4 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all">
                                            <Label htmlFor="digest" className="flex flex-col space-y-1 text-sm cursor-pointer">
                                                <span className="font-semibold text-slate-900 flex items-center gap-2">
                                                    Weekly digest
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                </span>
                                                <span className="text-xs text-slate-500">Summary of allocation changes and AI insights</span>
                                            </Label>
                                            <Switch id="digest" defaultChecked className="data-[state=checked]:bg-indigo-600" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">You can opt out anytime from the email footer.</p>
                                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50">Save preferences</Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </section>
                </div>
            </div>
        </div>
    );
}
