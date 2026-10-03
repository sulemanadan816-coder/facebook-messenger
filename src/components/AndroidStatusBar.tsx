import React, { useState, useEffect } from 'react';
import { Wifi, Battery, ShieldCheck, Sparkles } from 'lucide-react';

interface AndroidStatusBarProps {
  e2eeActive?: boolean;
  autoPilotActive?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  e2eeActive = true,
  autoPilotActive = true,
}) => {
  const [timeStr, setTimeStr] = useState('10:25');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300 font-medium select-none z-40 sticky top-0">
      {/* Left: Time & E2EE Status */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-100">{timeStr}</span>
        {e2eeActive && (
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
            <ShieldCheck className="w-3 h-3" />
            E2EE 256-bit
          </span>
        )}
      </div>

      {/* Center: AI Auto-Pilot Pill */}
      <div className="flex items-center">
        {autoPilotActive ? (
          <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px]">
            <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
            Meta Marketing AI Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
            Manual Mode
          </span>
        )}
      </div>

      {/* Right: Signal, Wi-Fi & Battery */}
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-[10px] font-bold text-slate-300 tracking-wider">5G</span>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-300">98%</span>
          <Battery className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
