/**
 * オリジナル星座メーカー 型定義
 */

/**
 * 星（Star）のデータ構造
 */
export interface Star {
  id: string;
  x: number; // キャンバス内のX座標 (px)
  y: number; // キャンバス内のY座標 (px)
  radius: number; // 星の基本半径
  baseAlpha: number; // 基本の透明度 (0.2 ~ 0.95)
  currentAlpha: number; // リアルタイム透明度（きらめき反映）
  twinkleSpeed: number; // きらめきの角速度
  twinkleOffset: number; // サイン波の位相オフセット
  isTwinkling: boolean; // きらめく星かどうか
  color: string; // 星の核となる光色
  glowColor: string; // 外周の光彩カラー
  magnitude: number; // 等級イメージ (1: 一等星 ~ 6: 暗い星)
  spikes: boolean; // 4方向の光条（回折スパイク）を描画するか
}

/**
 * 星と星を結ぶ線（Line）のデータ構造
 */
export interface Line {
  id: string;
  fromStarId: string; // 接続元星のID
  toStarId: string; // 接続先星のID
  color?: string; // 線のテーマカラー（省略時はデフォルト）
  createdAt: number; // 作成時刻 (UNIXミリ秒)
}

/**
 * 命名・確定された星座（Constellation）のデータ構造
 */
export interface Constellation {
  id: string;
  name: string; // 星座名（例: 「白鳥座」「青春の誓い座」）
  lines: Line[]; // 構成する線のリスト
  starIds: string[]; // 含まれる星のID群（重複排除済み）
  centerX: number; // ラベル表示用中心X座標
  centerY: number; // ラベル表示用中心Y座標
  themeColor: string; // 星座の光彩テーマカラー
  description?: string; // 星座の由来・ストーリー
  createdAt: number; // 登録時刻
}

/**
 * ドラッグ＆ドロップ描画中の状態
 */
export interface DragState {
  isDragging: boolean;
  startStar: Star | null;
  currentX: number;
  currentY: number;
  hoveredStar: Star | null;
  snapCandidate: Star | null; // 吸着対象の最も近い星
}

/**
 * きらめき星屑パーティクル
 */
export interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

/**
 * テーマカラー選択肢
 */
export interface ThemeColorOption {
  id: string;
  name: string;
  color: string;
  glow: string;
  tailwindBg: string;
}

/**
 * ズーム・パン用ビューポート状態
 */
export interface Viewport {
  scale: number;
  panX: number;
  panY: number;
}
