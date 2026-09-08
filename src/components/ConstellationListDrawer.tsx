import React from 'react';
import { X, BookOpen, MapPin, Sparkles, Trash2 } from 'lucide-react';
import { Constellation } from '../types';

interface ConstellationListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  constellations: Constellation[];
  onFocusConstellation?: (c: Constellation) => void;
  onDeleteConstellation?: (id: string) => void;
  isAdmin?: boolean;
}

export const ConstellationListDrawer: React.FC<ConstellationListDrawerProps> = ({
  isOpen,
  onClose,
  constellations,
  onFocusConstellation,
  onDeleteConstellation,
  isAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="constellation-registry-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
    >
      <div className="w-full max-w-md h-full bg-slate-900/95 border-l border-slate-800 p-6 flex flex-col shadow-2xl text-slate-200 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-300 rounded-xl border border-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-light tracking-widest uppercase text-sky-200 text-glow-sky">
                登録済み星座図鑑
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                Records of Starlight ({constellations.length} Constellations)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 custom-scrollbar">
          {constellations.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Sparkles className="w-10 h-10 text-sky-400/40 mb-3 animate-pulse" />
              <p className="text-sm font-light uppercase tracking-wider text-slate-300">まだ登録された星座はありません</p>
              <p className="text-xs text-slate-500 mt-1">
                夜空の星を繋いで「星座を完成させる」を押すと、ここにあなたの星座が記録されます
              </p>
            </div>
          ) : (
            constellations.map((c, index) => {
              const dateStr = new Date(c.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/40 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px]"
                        style={{
                          backgroundColor: c.themeColor,
                          boxShadow: `0 0 10px ${c.themeColor}`,
                        }}
                      />
                      <h3 className="font-light text-base text-sky-100 tracking-wide">
                        {c.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onFocusConstellation && (
                        <button
                          type="button"
                          onClick={() => {
                            onFocusConstellation(c);
                            onClose();
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-300 rounded-full border border-slate-700/60 hover:bg-slate-800 transition-colors"
                          title="夜空でこの星座を見る"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isAdmin && onDeleteConstellation && (
                        <button
                          type="button"
                          onClick={() => onDeleteConstellation(c.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-full border border-slate-700/60 hover:bg-rose-950/30 transition-colors"
                          title="[管理者] この星座を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800/50 p-2 rounded-lg italic">
                      「{c.description}」
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 pt-1 border-t border-slate-800/50">
                    <span>
                      構成星: {c.starIds.length}星 / {c.lines.length}本
                    </span>
                    <span>登録時刻: {dateStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            ピンチ操作やドラッグで夜空を移動し、何座でも星座を作ることができます
          </p>
        </div>
      </div>
    </div>
  );
};
