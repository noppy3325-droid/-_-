import React from 'react';
import { X, Sparkles, MousePointer, Magnet, ZoomIn, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: <MousePointer className="w-5 h-5 text-sky-400" />,
      title: '1. 星を選んでドラッグ',
      desc: '夜空に輝く星の上でマウスを押し込み（または指でタッチ）、そのまま別の星に向かってドラッグします。',
    },
    {
      icon: <Magnet className="w-5 h-5 text-amber-400" />,
      title: '2. 自動スナップで線をつなぐ',
      desc: '目標の星の近くで離すと、自動で一番近い星に吸着して美しい光の線が確定します。複数の星をどんどん結びましょう。',
    },
    {
      icon: <ZoomIn className="w-5 h-5 text-cyan-400" />,
      title: '3. ピンチイン・アウト＆宇宙散策',
      desc: '2本指のピンチ操作（またはマウスホイール）で拡大・縮小。何もない星空の空間をドラッグすると広大な宇宙を移動できます。',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      title: '4. 星座を命名・何座でも作れる！',
      desc: '形ができたら「星座を完成させる」で名前と光の色を登録！広大な星空のあちこちに、何十座もの星座を生み出せます。',
    },
  ];

  return (
    <div
      id="guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-300 border border-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Sparkles className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-light tracking-widest uppercase text-sky-200 text-glow-sky">
              STELLAR CANVAS 操作ガイド
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
              Interactive Experience Guide
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-sky-100">{step.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full font-medium text-xs uppercase tracking-widest bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/30 transition-all"
          >
            星空へ戻る
          </button>
        </div>
      </div>
    </div>
  );
};
