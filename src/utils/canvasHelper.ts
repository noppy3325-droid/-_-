/**
 * 星空・星座描画ヘルパーモジュール (HTML5 Canvas 2D)
 */
import { Star, Line, Constellation, SparkleParticle, ThemeColorOption } from '../types';

// 宇宙全体のワールド領域サイズ（超広大な星空で多数の星座を作成可能）
export const WORLD_WIDTH = 12000;
export const WORLD_HEIGHT = 9000;

// スナップ許容距離 (画面上のpx)
export const SNAP_DISTANCE = 38;

// 星座テーマカラーの定義一覧
export const THEME_COLORS: ThemeColorOption[] = [
  {
    id: 'cyan',
    name: 'ネオンシアン',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.85)',
    tailwindBg: 'bg-cyan-400',
  },
  {
    id: 'gold',
    name: 'ステラゴールド',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.85)',
    tailwindBg: 'bg-amber-400',
  },
  {
    id: 'purple',
    name: 'コズミックパープル',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.85)',
    tailwindBg: 'bg-purple-400',
  },
  {
    id: 'emerald',
    name: 'オーロラグリーン',
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.85)',
    tailwindBg: 'bg-emerald-400',
  },
  {
    id: 'rose',
    name: 'ネビュラピンク',
    color: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.85)',
    tailwindBg: 'bg-pink-400',
  },
];

// 星のリアルな色彩スペクトル
const STAR_PALETTES = [
  { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)', weight: 35 }, // 純白
  { color: '#e0f2fe', glow: 'rgba(186, 230, 253, 0.9)', weight: 25 }, // シアン・青白
  { color: '#fef08a', glow: 'rgba(254, 240, 138, 0.9)', weight: 20 }, // 黄金・淡黄
  { color: '#fed7aa', glow: 'rgba(253, 186, 116, 0.85)', weight: 10 }, // 橙赤
  { color: '#c7d2fe', glow: 'rgba(199, 210, 254, 0.85)', weight: 10 }, // 薄紫・菫
];

// 簡易的なシード付き乱数生成器 (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * 広大な夜空全体に多数の星座を作れるよう星々を生成する (300〜450個)
 */
export function generateStarField(
  width: number = WORLD_WIDTH,
  height: number = WORLD_HEIGHT,
  count?: number
): Star[] {
  const stars: Star[] = [];
  const padding = 60;
  
  // 固定シードを用いて常に同じ星空を生成する（リロードしても座標やIDが変わらないようにする）
  const rng = mulberry32(123456789);

  // ワールドサイズに応じた星数 (未指定時は面積から計算。より高密度に設定)
  // 面積あたり10000px^2に1個の割合 (8000x6000なら約4800個の星)
  const finalCount = count || Math.floor((width * height) / 10000);
  const minDistanceBetweenStars = 16;

  let attempts = 0;
  const maxAttempts = finalCount * 10;

  while (stars.length < finalCount && attempts < maxAttempts) {
    attempts++;

    const x = padding + rng() * (width - padding * 2);
    const y = padding + rng() * (height - padding * 2);

    // 既存の星と近すぎないかチェック (重なり防止)
    const tooClose = stars.some(
      (s) => Math.abs(s.x - x) < minDistanceBetweenStars && Math.abs(s.y - y) < minDistanceBetweenStars
    );
    if (tooClose) continue;

    // カラーパレットの選択
    const rand = rng() * 100;
    let accumulated = 0;
    let chosenPalette = STAR_PALETTES[0];
    for (const p of STAR_PALETTES) {
      accumulated += p.weight;
      if (rand <= accumulated) {
        chosenPalette = p;
        break;
      }
    }

    // 等級とサイズ（ごく一部が一等星サイズ）
    const magRand = rng();
    let radius = 1.3;
    let magnitude = 5;
    let spikes = false;

    if (magRand > 0.96) {
      radius = 3.8 + rng() * 1.6; // 一等星
      magnitude = 1;
      spikes = true;
    } else if (magRand > 0.85) {
      radius = 2.8 + rng() * 1.0; // 二等星
      magnitude = 2;
    } else if (magRand > 0.60) {
      radius = 2.0 + rng() * 0.8; // 三等星
      magnitude = 3;
    } else {
      radius = 1.2 + rng() * 0.7; // 四等星〜六等星
      magnitude = 4;
    }

    const baseAlpha = 0.35 + rng() * 0.6;
    const isTwinkling = rng() > 0.25;

    stars.push({
      id: `star_${stars.length}`,
      x,
      y,
      radius,
      baseAlpha,
      currentAlpha: baseAlpha,
      twinkleSpeed: 0.8 + rng() * 2.2,
      twinkleOffset: rng() * Math.PI * 2,
      isTwinkling,
      color: chosenPalette.color,
      glowColor: chosenPalette.glow,
      magnitude,
      spikes,
    });
  }

  return stars;
}

/**
 * 2点間のユークリッド距離
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 画面上の指定座標から最も近く、かつ最大許容距離以内にある星を検索（ズーム＆パン考慮）
 */
export function findNearestStarScreen(
  screenX: number,
  screenY: number,
  stars: Star[],
  scale: number,
  panX: number,
  panY: number,
  maxDistScreen: number = SNAP_DISTANCE,
  excludeId?: string
): { star: Star | null; distance: number } {
  let closestStar: Star | null = null;
  let minDistance = maxDistScreen;

  for (const star of stars) {
    if (excludeId && star.id === excludeId) continue;
    const sx = star.x * scale + panX;
    const sy = star.y * scale + panY;
    const d = getDistance(screenX, screenY, sx, sy);
    if (d < minDistance) {
      minDistance = d;
      closestStar = star;
    }
  }

  return { star: closestStar, distance: minDistance };
}

/**
 * ワールド座標から最も近い星を検索（後方互換用）
 */
export function findNearestStar(
  x: number,
  y: number,
  stars: Star[],
  maxDist: number = SNAP_DISTANCE,
  excludeId?: string
): { star: Star | null; distance: number } {
  let closestStar: Star | null = null;
  let minDistance = maxDist;

  for (const star of stars) {
    if (excludeId && star.id === excludeId) continue;
    const d = getDistance(x, y, star.x, star.y);
    if (d < minDistance) {
      minDistance = d;
      closestStar = star;
    }
  }

  return { star: closestStar, distance: minDistance };
}

/**
 * 星座の構成星群から幾何学重心（ラベル表示位置）を算出
 */
export function calculateConstellationCenter(
  starIds: string[],
  starsMap: Map<string, Star>
): { x: number; y: number } {
  if (starIds.length === 0) return { x: 0, y: 0 };

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const id of starIds) {
    const star = starsMap.get(id);
    if (star) {
      sumX += star.x;
      sumY += star.y;
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return { x: sumX / count, y: sumY / count };
}

/**
 * 深宇宙の背景グラデーションと星雲（ネビュラ）を描画
 */
export function drawCosmicBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
) {
  // ベースの深宇宙グラデーション (濃紺〜黒 #02040a)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#02040a'); // Elegant Dark deepest black
  bgGrad.addColorStop(0.35, '#040818'); // Deep cosmic navy
  bgGrad.addColorStop(0.7, '#060f28'); // Midnight blue
  bgGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 星雲の柔らかい光彩 (紫・マゼンタ・エメラルドの淡い輝き)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // 星雲 1 (左上寄り - インディゴパープル)
  const nebula1 = ctx.createRadialGradient(
    width * 0.25 + Math.sin(timeSec * 0.2) * 20,
    height * 0.35 + Math.cos(timeSec * 0.25) * 20,
    0,
    width * 0.25,
    height * 0.35,
    Math.max(width, height) * 0.55
  );
  nebula1.addColorStop(0, 'rgba(76, 29, 149, 0.18)');
  nebula1.addColorStop(0.5, 'rgba(49, 46, 129, 0.08)');
  nebula1.addColorStop(1, 'rgba(3, 7, 18, 0)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, width, height);

  // 星雲 2 (右下寄り - シアンブルー)
  const nebula2 = ctx.createRadialGradient(
    width * 0.75 + Math.cos(timeSec * 0.18) * 25,
    height * 0.65 + Math.sin(timeSec * 0.22) * 25,
    0,
    width * 0.75,
    height * 0.65,
    Math.max(width, height) * 0.6
  );
  nebula2.addColorStop(0, 'rgba(14, 116, 144, 0.16)');
  nebula2.addColorStop(0.6, 'rgba(30, 58, 138, 0.06)');
  nebula2.addColorStop(1, 'rgba(3, 7, 18, 0)');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * 星屑パーティクルの更新と描画
 */
export function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: SparkleParticle[]
) {
  ctx.save();
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    p.vx *= 0.98;
    p.vy *= 0.98;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * 星屑バースト（線確定や星座完成時に発生する火花エフェクト）
 */
export function spawnSparkles(
  particles: SparkleParticle[],
  x: number,
  y: number,
  count: number = 16,
  color: string = '#38bdf8'
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 3.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2.5,
      alpha: 1,
      decay: 0.015 + Math.random() * 0.02,
      color,
    });
  }
}

/**
 * 単体の星を描画
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  star: Star,
  timeSec: number,
  isHovered: boolean = false,
  isSelected: boolean = false,
  isSnapTarget: boolean = false,
  scale: number = 1.0
) {
  // きらめき透明度計算 (サイン波)
  let alpha = star.baseAlpha;
  if (star.isTwinkling) {
    const sinVal = Math.sin(timeSec * star.twinkleSpeed + star.twinkleOffset);
    alpha = star.baseAlpha + sinVal * 0.28;
    alpha = Math.max(0.15, Math.min(1.0, alpha));
  }
  star.currentAlpha = alpha;

  ctx.save();

  // 1. スナップターゲットまたはホバー/選択時のオーラリング
  if (isSnapTarget || isSelected || isHovered) {
    const ringRadius = isSnapTarget ? SNAP_DISTANCE / scale : star.radius + 12 / scale;
    const pulse = 1 + Math.sin(timeSec * 6) * 0.12;

    ctx.beginPath();
    ctx.arc(star.x, star.y, ringRadius * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = isSnapTarget ? '#38bdf8' : isSelected ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = (isSnapTarget ? 2 : 1.5) / Math.sqrt(scale);
    ctx.shadowColor = isSnapTarget ? '#38bdf8' : '#fbbf24';
    ctx.shadowBlur = 14 / scale;
    ctx.stroke();

    // 補助の放射状ターゲット十字線 (スナップ時)
    if (isSnapTarget) {
      const crossSize = 14 / scale;
      ctx.beginPath();
      ctx.moveTo(star.x - crossSize, star.y);
      ctx.lineTo(star.x + crossSize, star.y);
      ctx.moveTo(star.x, star.y - crossSize);
      ctx.lineTo(star.x, star.y + crossSize);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1 / Math.sqrt(scale);
      ctx.stroke();
    }
  }

  // 2. 星の外周コロナ（光彩）
  const coronaRadius = star.radius * (star.magnitude === 1 ? 4.5 : 3.0);
  const corona = ctx.createRadialGradient(
    star.x,
    star.y,
    0,
    star.x,
    star.y,
    coronaRadius
  );
  corona.addColorStop(0, star.glowColor);
  corona.addColorStop(0.4, star.glowColor.replace('0.8', '0.25').replace('0.9', '0.3'));
  corona.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = corona;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(star.x, star.y, coronaRadius, 0, Math.PI * 2);
  ctx.fill();

  // 3. 一等星の4方向回折スパイク (キラリと光る十字の光条)
  if (star.spikes) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = star.color;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = 10 / scale;
    ctx.lineWidth = 0.9 / Math.sqrt(scale);

    const spikeLen = star.radius * 5.2 + Math.sin(timeSec * star.twinkleSpeed) * 3;

    ctx.beginPath();
    // 水平スパイク
    ctx.moveTo(star.x - spikeLen, star.y);
    ctx.lineTo(star.x + spikeLen, star.y);
    // 垂直スパイク
    ctx.moveTo(star.x, star.y - spikeLen);
    ctx.lineTo(star.x, star.y + spikeLen);
    ctx.stroke();
    ctx.restore();
  }

  // 4. 星の中心コア (白〜光色)
  // ズームアウト時も星が消えないよう最小サイズを保証
  const effectiveRadius = Math.max(star.radius, 1.2 / Math.sqrt(scale));
  ctx.globalAlpha = Math.min(1.0, alpha + 0.2);
  ctx.fillStyle = star.color;
  ctx.shadowColor = star.color;
  ctx.shadowBlur = effectiveRadius * 3.5;
  ctx.beginPath();
  ctx.arc(star.x, star.y, effectiveRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 確定した線を描画 (ネオン発光効果)
 */
export function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = '#38bdf8',
  lineWidth: number = 2.0,
  alpha: number = 0.95,
  scale: number = 1.0
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';

  const effLineWidth = lineWidth / Math.pow(scale, 0.4);

  // パス 1: 広がる外周ネオングロー
  ctx.shadowColor = color;
  ctx.shadowBlur = 16 / scale;
  ctx.strokeStyle = color;
  ctx.lineWidth = effLineWidth * 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // パス 2: 芯となる鮮明な光線
  ctx.shadowBlur = 4 / scale;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = effLineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}

/**
 * ドラッグ中のプレビュー線を描画
 */
export function drawDraggingPreviewLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isSnapped: boolean,
  timeSec: number,
  scale: number = 1.0
) {
  ctx.save();
  ctx.lineCap = 'round';

  const color = isSnapped ? '#38bdf8' : '#fbbf24';
  const effLineWidth = (isSnapped ? 2.5 : 2.0) / Math.pow(scale, 0.4);

  // アニメーションする破線オフセット
  ctx.setLineDash([8 / scale, 6 / scale]);
  ctx.lineDashOffset = (-timeSec * 35) / scale;

  ctx.shadowColor = color;
  ctx.shadowBlur = 14 / scale;
  ctx.strokeStyle = color;
  ctx.lineWidth = effLineWidth;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // カーソル先、またはスナップ先の星に輝く光点を描画
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 / scale;
  ctx.beginPath();
  ctx.arc(x2, y2, (4 + Math.sin(timeSec * 8) * 1.5) / Math.sqrt(scale), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 確定済み星座のラベル（「〇〇座」）を描画
 */
export function drawConstellationLabel(
  ctx: CanvasRenderingContext2D,
  constellation: Constellation,
  timeSec: number,
  scale: number = 1.0
) {
  const { name, centerX, centerY, themeColor } = constellation;
  if (!name) return;

  ctx.save();

  // 浮遊感のある微細なY座標アニメーション
  const floatY = centerY + (Math.sin(timeSec * 1.5 + (constellation.createdAt % 10)) * 3) / scale;

  // ズームに応じた読みやすいフォントサイズ調整
  const fontSize = Math.max(13, Math.min(22, Math.round(18 / Math.pow(scale, 0.35))));
  ctx.font = `700 ${fontSize}px "Shippori Mincho", "Zen Kaku Gothic New", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textMetrics = ctx.measureText(name);
  const textWidth = textMetrics.width;
  const paddingX = 16 / scale;
  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = (fontSize + 14);

  // ラベル背面のすりガラス調ピルバッジ
  ctx.save();
  ctx.fillStyle = 'rgba(2, 4, 10, 0.82)';
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.2 / Math.sqrt(scale);
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 14 / scale;

  // 角丸四角形
  const rx = centerX - rectWidth / 2;
  const ry = floatY - rectHeight / 2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rectWidth, rectHeight, 16 / scale);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 文字自体のネオングロー描画
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 12 / scale;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, centerX, floatY);

  // 左右に小さな星アイコン装飾
  ctx.font = `${Math.round(fontSize * 0.7)}px serif`;
  ctx.fillStyle = themeColor;
  ctx.fillText('✦', rx + 10 / scale, floatY);
  ctx.fillText('✦', rx + rectWidth - 10 / scale, floatY);

  ctx.restore();
}
