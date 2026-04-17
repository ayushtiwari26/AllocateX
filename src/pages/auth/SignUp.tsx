import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Briefcase, User, Mail, Phone, Lock, ArrowRight, Sparkles, CheckCircle2, Shield, Zap } from 'lucide-react';

const signUpSchema = z.object({
    organisationName: z.string().min(2, 'Organisation name must be at least 2 characters'),
    adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
    adminEmail: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data: SignUpFormValues) => {
        setIsLoading(true);
        setError('');
        try {
            await signup(data);
            navigate('/onboarding/add-members');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    const benefits = [
        { icon: CheckCircle2, text: 'Unlimited team members' },
        { icon: Shield, text: 'Enterprise-grade security' },
        { icon: Zap, text: 'AI-powered recommendations' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-32 right-32 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-32 left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-700" />
                    <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">AllocateX</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                                Start optimizing
                                <br />
                                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    your team today
                                </span>
                            </h1>
                            <p className="mt-4 text-lg text-slate-400 max-w-md">
                                Join thousands of companies using AllocateX to maximize their team's productivity.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 text-slate-300"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                        <benefit.icon className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <span className="text-sm font-medium">{benefit.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-10 w-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold"
                                    >
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-slate-400">
                                <span className="text-white font-semibold">2,000+</span> teams already joined
                            </div>
                        </div>
                    </div>

                    <div className="text-slate-500 text-sm">
                        © 2024 AllocateX. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 bg-white py-12">
                <div className="w-full max-w-lg mx-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">AllocateX</span>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create your workspace</h2>
                        <p className="text-slate-500">Set up your organisation in less than 2 minutes</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-red-600 text-lg">!</span>
                                </div>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="organisationName" className="text-slate-700 font-medium">Organisation Name</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="organisationName"
                                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl transition-all"
                                    placeholder="Acme Inc."
                                    {...register('organisationName')}
                                />
                            </div>
                            {errors.organisationName && <p className="text-xs text-red-500 mt-1">{errors.organisationName.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="adminName" className="text-slate-700 font-medium">Your Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="adminName"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl transition-all"
                                        placeholder="John Doe"
                                        {...register('adminName')}
                                    />
                                </div>
                                {errors.adminName && <p className="text-xs text-red-500 mt-1">{errors.adminName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-700 font-medium">Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="phone"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl transition-all"
                                        placeholder="+1 234 567 890"
                                        {...register('phone')}
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adminEmail" className="text-slate-700 font-medium">Work Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="adminEmail"
                                    type="email"
                                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl transition-all"
                                    placeholder="you@company.com"
                                    {...register('adminEmail')}
                                />
                            </div>
                            {errors.adminEmail && <p className="text-xs text-red-500 mt-1">{errors.adminEmail.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl transition-all"
                                        placeholder="••••••••"
                                        {...register('password')}
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl transition-all"
                                        placeholder="••••••••"
                                        {...register('confirmPassword')}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Workspace
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500">
                            Already have an account?{' '}
                            <Link to="/signin" className="text-violet-600 hover:text-violet-700 font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <p className="text-xs text-center text-slate-400">
                            By creating an account, you agree to AllocateX's{' '}
                            <a href="#" className="text-slate-500 hover:text-slate-700 underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-slate-500 hover:text-slate-700 underline">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
