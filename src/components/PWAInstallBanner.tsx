import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, WifiOff } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {/* Offline connectivity warning banner */}
      {!isOnline && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between sticky top-8 z-30">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span><strong>Offline Mode</strong> — E2EE encryption & local lead cache active</span>
          </div>
          <span className="text-[10px] bg-amber-500/30 px-2 py-0.5 rounded">Cached</span>
        </div>
      )}

      {/* In-app Install banner for Android / Desktop */}
      {!isInstalled && !dismissed && (isInstallable || isIOS) && (
        <div className="mx-4 my-2 p-3 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <img src="/icon.svg" alt="App Icon" className="w-8 h-8 rounded-lg" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate">Install OmniMessenger App</h4>
              <p className="text-[11px] text-slate-400 truncate">
                Real-time E2EE Facebook Marketing Agent on Android
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 active:scale-95 transition-all"
              >
                <span>Add to Home</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/icon.svg" alt="Icon" className="w-7 h-7 rounded-lg" />
                <h3 className="text-base font-bold">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 mt-0.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Step 1: Tap Share</span>
                  Tap the Safari <strong>Share</strong> button at the bottom of the screen.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Step 2: Add to Home Screen</span>
                  Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
