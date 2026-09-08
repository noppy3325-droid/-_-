import React from 'react';
import {
  Sparkles,
  Trash2,
  RefreshCw,
  Volume2,
  VolumeX,
  BookOpen,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  PenTool,
  Camera,
} from 'lucide-react';

interface ControlsProps {
  toolMode: 'draw' | 'pan';
  onChangeToolMode: (mode: 'draw' | 'pan') => void;
  lineCount: number;
  constellationCount: number;
  isAudioEnabled: boolean;
  zoomScale: number;
  onComplete: () => void;
  onClearLines: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleAudio: () => void;
  onOpenRegistry: () => void;
  onOpenGuide: () => void;
  isAdmin?: boolean;
  onExportImage?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  toolMode,
  onChangeToolMode,
  lineCount,
  constellationCount,
  isAudioEnabled,
  zoomScale,
  onComplete,
  onClearLines,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleAudio,
  onOpenRegistry,
  onOpenGuide,
  isAdmin,
  onExportImage,
}) => {
  const zoomPercent = Math.round(zoomScale * 100);

  return (
    <footer
      id="app-controls-bar"
      className="fixed bottom-0 left-0 right-0 z-30 px-3 sm:px-6 pb-3 sm:pb-5 pt-8 bg-gradient-to-t from-[#02040a] via-[#02040a]/90 to-transparent pointer-events-none"
    >
      <div className="pointer-events-auto max-w-5xl mx-auto flex flex-col gap-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Action controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Tool Mode Toggle */}
            <div className="flex items-center rounded-full bg-slate-950/80 border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => onChangeToolMode('draw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs tracking-wider transition-colors ${
                  toolMode === 'draw'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
                title="描画モード"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">描画</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeToolMode('pan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs tracking-wider transition-colors ${
                  toolMode === 'pan'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
                title="移動モード"
              >
                <Move className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">移動</span>
              </button>
            </div>

            {/* Clear Lines */}
            <button
              type="button"
              id="control-clear-btn"
              onClick={onClearLines}
              disabled={lineCount === 0}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs uppercase tracking-widest font-medium rounded-full text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 disabled:pointer-events-none border border-rose-500/30 transition-colors"
              title="現在の描画線をクリア"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">線を消去</span>
            </button>

            {/* Zoom Controls Dock */}
            <div className="flex items-center rounded-full bg-slate-950/80 border border-slate-800 p-0.5">
              <button
                type="button"
                id="control-zoom-out-btn"
                onClick={onZoomOut}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                title="ズームアウト（全体を見る）"
                aria-label="ズームアウト"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="control-zoom-reset-btn"
                onClick={onResetZoom}
                className="px-2 py-0.5 text-[11px] font-mono text-sky-300 hover:text-sky-200 tracking-wider"
                title="ズーム倍率をリセット"
              >
                {zoomPercent}%
              </button>
              <button
                type="button"
                id="control-zoom-in-btn"
                onClick={onZoomIn}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                title="ズームイン（拡大する）"
                aria-label="ズームイン"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Primary "Complete Constellation" Button */}
          <div className="flex items-center order-first sm:order-none w-full sm:w-auto justify-center">
            <button
              type="button"
              id="control-complete-btn"
              onClick={onComplete}
              disabled={lineCount === 0}
              className="relative w-full sm:w-auto px-6 py-2.5 rounded-full font-medium text-xs sm:text-sm uppercase tracking-widest text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 disabled:shadow-none shadow-lg shadow-sky-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${lineCount > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span>星座を完成させる</span>
              {lineCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-950/80 rounded-full text-sky-200 border border-sky-400/40">
                  {lineCount}本
                </span>
              )}
            </button>
          </div>

          {/* Right: Auxiliary controls (Registry, Audio, Guide) */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* Admin Export Image */}
            {isAdmin && onExportImage && (
              <button
                type="button"
                onClick={onExportImage}
                className="p-2 rounded-full text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                title="全体画像をエクスポート"
                aria-label="全体画像をエクスポート"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Registry Drawer */}
            <button
              type="button"
              id="control-registry-btn"
              onClick={onOpenRegistry}
              className="relative flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs uppercase tracking-widest font-medium rounded-full text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
              title="登録済み星座図鑑"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">星座図鑑</span>
              {constellationCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full">
                  {constellationCount}
                </span>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              id="control-audio-btn"
              onClick={onToggleAudio}
              className={`p-2 rounded-full border transition-colors ${
                isAudioEnabled
                  ? 'text-sky-300 bg-sky-500/15 border-sky-500/40 hover:bg-sky-500/25'
                  : 'text-slate-500 border-slate-800 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={isAudioEnabled ? 'サウンドON' : 'サウンドOFF'}
              aria-label={isAudioEnabled ? 'サウンドON' : 'サウンドOFF'}
            >
              {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Guide Help */}
            <button
              type="button"
              id="control-guide-btn"
              onClick={onOpenGuide}
              className="p-2 rounded-full text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors"
              title="遊び方ガイド"
              aria-label="遊び方ガイド"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtle Technical Footer Badge matching Elegant Dark design */}
        <div className="hidden sm:flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-500 uppercase tracking-widest border-t border-slate-800/50">
          <div className="flex gap-4">
            <div>
              <span className="opacity-40 mr-1.5">View Control:</span>
              <span className="text-sky-400/80">Pinch / Wheel / Drag</span>
            </div>
            <div>
              <span className="opacity-40 mr-1.5">Scale:</span>
              <span className="text-slate-400">{zoomPercent}%</span>
            </div>
          </div>
          <div className="text-right text-slate-500 font-mono opacity-50">
            STELLAR CANVAS ENGINE
          </div>
        </div>
      </div>
    </footer>
  );
};
