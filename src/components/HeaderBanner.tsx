import React from 'react';
import { Maximize2, Minimize2, Compass, Sparkles } from 'lucide-react';

interface HeaderBannerProps {
  constellationCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTitleClick?: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  constellationCount,
  isFullscreen,
  onToggleFullscreen,
  onTitleClick,
}) => {
  return (
    <header
      id="app-header-banner"
      className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-8 py-4 sm:py-5 bg-gradient-to-b from-[#02040a] via-[#02040a]/85 to-transparent pointer-events-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
        {/* Title & Badge */}
        <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800/80 shadow-2xl">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Compass className="w-4 h-4 animate-[spin_20s_linear_infinite]" />
          </div>
          <div className="cursor-pointer" onClick={onTitleClick}>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg md:text-xl font-light tracking-widest uppercase text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-colors hover:text-sky-200">
                STELLAR CANVAS
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider hidden sm:block">
              Interactive Constellation Architecture
            </p>
          </div>
        </div>

        {/* Center / Instruction Pill */}
        <div className="hidden lg:flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900/50 border border-slate-800 text-xs text-slate-400 tracking-widest uppercase backdrop-blur-md shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
          <span>星をドラッグして結ぶ ✦ ピンチで拡大縮小 ✦ 空間ドラッグで宇宙移動</span>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-2.5 bg-slate-900/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800/80 shadow-lg">
          <div className="text-right px-1">
            <div className="text-[9px] uppercase tracking-widest text-slate-500">登録済み星座</div>
            <div className="text-xs sm:text-sm font-medium font-mono text-sky-300">
              {constellationCount} <span className="text-[10px] font-normal text-slate-500 uppercase">座</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 text-slate-400 hover:text-white rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? '全画面解除' : '全画面表示（展示用）'}
            aria-label={isFullscreen ? '全画面解除' : '全画面表示'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
