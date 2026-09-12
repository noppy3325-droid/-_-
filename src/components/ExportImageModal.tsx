import React from 'react';
import { X, Download, AlertCircle } from 'lucide-react';

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ExportImageModal: React.FC<ExportImageModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            全体画像のエクスポート
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4">
          <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-auto flex justify-center shadow-inner">
            {/* 画像は縮小表示し、元の解像度を保持する */}
            <img 
              src={imageUrl} 
              alt="Stellar Canvas Export" 
              className="max-w-full h-auto object-contain rounded border border-slate-800/50"
              style={{ maxHeight: '60vh' }}
            />
          </div>
          
          <div className="w-full max-w-lg bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-amber-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="text-sm">
              <p className="font-bold mb-1">【保存方法】</p>
              <p>セキュリティ制限により自動ダウンロードがブロックされる場合があります。その場合は、上の画像を <strong>「右クリック」</strong> （スマートフォンの場合は <strong>「長押し」</strong>）して、<strong>「画像を保存」</strong> を選択してください。</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            閉じる
          </button>
          {/* 一応ダウンロードボタンも配置しておく */}
          <a
            href={imageUrl}
            download={`stellar_canvas_export_${Date.now()}.png`}
            className="px-5 py-2 rounded-full font-medium text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            ダウンロードを試す
          </a>
        </div>
      </div>
    </div>
  );
};
