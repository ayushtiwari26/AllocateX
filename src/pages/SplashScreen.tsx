import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, BarChart3, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Animation stages
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 800),
      setTimeout(() => setStage(3), 1300),
      setTimeout(() => setStage(4), 2000),
      setTimeout(() => navigate('/signin'), 3500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div 
          className={cn(
            "absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl transition-all duration-1000",
            stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )} 
        />
        <div 
          className={cn(
            "absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl transition-all duration-1000 delay-200",
            stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )} 
        />
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl transition-all duration-1500 delay-300",
            stage >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )} 
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 bg-white/30 rounded-full transition-opacity duration-1000",
              stage >= 2 ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            stage >= 1 ? "opacity-100" : "opacity-0"
          )}
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo Icon */}
        <div 
          className={cn(
            "flex justify-center mb-8 transition-all duration-700",
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Logo Text */}
        <h1 
          className={cn(
            "text-7xl font-black mb-4 transition-all duration-700 delay-200",
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            AllocateX
          </span>
        </h1>

        {/* Tagline */}
        <p 
          className={cn(
            "text-xl text-slate-400 mb-12 font-light tracking-wide transition-all duration-700 delay-300",
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          Intelligent Resource Allocation & HRMS
        </p>

        {/* Feature Icons */}
        <div 
          className={cn(
            "flex justify-center gap-8 mb-12 transition-all duration-700 delay-500",
            stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          {[
            { icon: Users, label: "Team Management" },
            { icon: BarChart3, label: "Analytics" },
            { icon: Zap, label: "AI Powered" },
          ].map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-colors">
                <feature.icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs text-slate-500">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        <div 
          className={cn(
            "flex items-center justify-center gap-3 text-slate-400 transition-all duration-500",
            stage >= 4 ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          <span className="text-sm">Launching</span>
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Inline Styles for Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
