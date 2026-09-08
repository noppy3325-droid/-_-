/**
 * 文化祭展示用インタラクティブWebアプリ「オリジナル星座メーカー」
 * Plain TypeScript + HTML5 Canvas 2D API 実装
 * ピンチイン・ピンチアウト（ズーム＆パン）対応・大宇宙モード
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Star, Line, Constellation, DragState, SparkleParticle, Viewport } from './types';
import {
  generateStarField,
  findNearestStarScreen,
  calculateConstellationCenter,
  drawCosmicBackground,
  drawStar,
  drawGlowLine,
  drawDraggingPreviewLine,
  drawConstellationLabel,
  updateAndDrawParticles,
  spawnSparkles,
  SNAP_DISTANCE,
  THEME_COLORS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from './utils/canvasHelper';
import { soundEffects } from './utils/audio';
import { Controls } from './components/Controls';
import { HeaderBanner } from './components/HeaderBanner';
import { CompletionModal } from './components/CompletionModal';
import { ConstellationListDrawer } from './components/ConstellationListDrawer';
import { GuideModal } from './components/GuideModal';

const STORAGE_KEY = 'original_constellations_v2';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 星空と星座のデータ構造
  const [stars, setStars] = useState<Star[]>([]);
  const [pendingLines, setPendingLines] = useState<Line[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ビューポート状態（ズーム倍率とパン移動量）
  const [viewport, setViewport] = useState<Viewport>(() => {
    const initialScale = 0.85;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      scale: initialScale,
      panX: (w - WORLD_WIDTH * initialScale) / 2,
      panY: (h - WORLD_HEIGHT * initialScale) / 2,
    };
  });

  // UI・モーダル状態
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [activeHighlightConstellationId, setActiveHighlightConstellationId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<'draw' | 'pan'>('draw');
  
  // 管理者モード（URLパラメータ or タイトル5回タップで有効化）
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('admin') === 'true';
    }
    return false;
  });
  const [titleClickCount, setTitleClickCount] = useState(0);

  const handleTitleClick = () => {
    setTitleClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdmin((curr) => !curr);
        soundEffects.playConnect();
        return 0;
      }
      return next;
    });
  };

  // 確実に管理者モードを切り替えるための隠しキーボードショートカット (Ctrl + Shift + A)
  useEffect(() => {
    const handleAdminShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdmin((curr) => {
          soundEffects.playConnect();
          return !curr;
        });
      }
    };
    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, []);

  // Refs for real-time Canvas Animation Loop without stale closures
  const starsRef = useRef<Star[]>([]);
  starsRef.current = stars;

  const toolModeRef = useRef<'draw' | 'pan'>(toolMode);
  toolModeRef.current = toolMode;

  const pendingLinesRef = useRef<Line[]>([]);
  pendingLinesRef.current = pendingLines;

  const constellationsRef = useRef<Constellation[]>([]);
  constellationsRef.current = constellations;

  const viewportRef = useRef<Viewport>(viewport);
  viewportRef.current = viewport;

  const particlesRef = useRef<SparkleParticle[]>([]);

  // ドラッグ線描画状態
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startStar: null,
    currentX: 0,
    currentY: 0,
    hoveredStar: null,
    snapCandidate: null,
  });

  // ポインター追跡（ピンチ操作およびパン用）
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const interactionModeRef = useRef<'draw' | 'pan' | 'pinch' | null>(null);

  const panStartRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  }>({ startX: 0, startY: 0, panX: 0, panY: 0 });

  const pinchStateRef = useRef<{
    initialDist: number;
    initialScale: number;
    midScreenX: number;
    midScreenY: number;
    worldMidX: number;
    worldMidY: number;
  } | null>(null);

  // Save constellations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(constellations));
    } catch {
      // Ignore quota errors
    }
  }, [constellations]);

  // キーボードの矢印キーによるパン（移動）操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      const PAN_SPEED = 50;
      let dx = 0;
      let dy = 0;
      
      switch (e.key) {
        case 'ArrowUp':
          dy = PAN_SPEED;
          break;
        case 'ArrowDown':
          dy = -PAN_SPEED;
          break;
        case 'ArrowLeft':
          dx = PAN_SPEED;
          break;
        case 'ArrowRight':
          dx = -PAN_SPEED;
          break;
        default:
          return; // 矢印キー以外は無視
      }
      
      e.preventDefault();
      setViewport((prev) => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy,
      }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Audio mute/unmute sync
  const handleToggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    soundEffects.enabled = next;
  };

  /**
   * 星空の初期化・再生成
   */
  const initStarField = useCallback((keepConstellations: boolean = true) => {
    // 広大な宇宙ワールドに星を生成
    const newStars = generateStarField(WORLD_WIDTH, WORLD_HEIGHT);
    setStars(newStars);
    setPendingLines([]);

    if (!keepConstellations) {
      setConstellations([]);
    }

    soundEffects.playClear();
  }, []);

  /**
   * 画面リサイズと高DPI対応
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      if (starsRef.current.length === 0) {
        initStarField(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initStarField]);

  /**
   * ズーム倍率の変更（指定スクリーン座標を中心とする）
   */
  const zoomAtScreenPoint = useCallback((screenX: number, screenY: number, factor: number) => {
    const vp = viewportRef.current;
    const oldScale = vp.scale;
    const newScale = Math.max(0.35, Math.min(2.5, oldScale * factor));
    if (Math.abs(newScale - oldScale) < 0.001) return;

    const worldX = (screenX - vp.panX) / oldScale;
    const worldY = (screenY - vp.panY) / oldScale;

    const newPanX = screenX - worldX * newScale;
    const newPanY = screenY - worldY * newScale;

    setViewport({ scale: newScale, panX: newPanX, panY: newPanY });
    viewportRef.current = { scale: newScale, panX: newPanX, panY: newPanY };
  }, []);

  /**
   * デスクトップマウスホイール / トラックパッドピンチ対応
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // トラックパッドピンチ (ctrlKey=true) と通常マウスホイール両方に対応
      const zoomDelta = -e.deltaY;
      const zoomSpeed = e.ctrlKey ? 0.015 : 0.0018;
      const factor = Math.exp(zoomDelta * zoomSpeed);

      zoomAtScreenPoint(screenX, screenY, factor);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoomAtScreenPoint]);

  /**
   * メイン描画ループ (requestAnimationFrame)
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (timeMs: number) => {
      const timeSec = timeMs * 0.001;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.save();
      // DPRスケーリング適用
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. 深宇宙とネビュラ背景の描画（スクリーン空間）
      drawCosmicBackground(ctx, width, height, timeSec);

      // 2. ワールド空間座標変換（ズーム＆パン適用）
      const vp = viewportRef.current;
      const currentScale = vp.scale;

      ctx.save();
      ctx.translate(vp.panX, vp.panY);
      ctx.scale(currentScale, currentScale);

      // 星の高速検索マップ作成
      const starsMap = new Map<string, Star>();
      const currentStars = starsRef.current;
      for (const s of currentStars) {
        starsMap.set(s.id, s);
      }

      // 3. 確定済み星座の線を描画
      // ズームアウト時は全体の透明度を下げてごちゃつきを抑える
      const fadeRatio = Math.min(1.0, currentScale * 1.5);
      
      for (const constellation of constellationsRef.current) {
        const isFocused = activeHighlightConstellationId === constellation.id;
        const themeColor = constellation.themeColor || THEME_COLORS[0].color;
        // フォーカスされている場合は透明度を下げない
        const lineAlpha = isFocused ? 1.0 : (0.85 * fadeRatio);
        const labelAlpha = isFocused ? 1.0 : fadeRatio;

        ctx.globalAlpha = 1.0; // Reset before each
        for (const line of constellation.lines) {
          const s1 = starsMap.get(line.fromStarId);
          const s2 = starsMap.get(line.toStarId);
          if (s1 && s2) {
            drawGlowLine(
              ctx,
              s1.x,
              s1.y,
              s2.x,
              s2.y,
              line.color || themeColor,
              isFocused ? 2.8 : 2.0,
              lineAlpha,
              currentScale
            );
          }
        }

        // 星座名ラベルの描画
        ctx.globalAlpha = labelAlpha;
        if (labelAlpha > 0.05) {
          drawConstellationLabel(ctx, constellation, timeSec, currentScale);
        }
        ctx.globalAlpha = 1.0;
      }

      // 4. 現在引いている制作中ラインの描画 (ネオンシアン)
      for (const line of pendingLinesRef.current) {
        const s1 = starsMap.get(line.fromStarId);
        const s2 = starsMap.get(line.toStarId);
        if (s1 && s2) {
          drawGlowLine(ctx, s1.x, s1.y, s2.x, s2.y, '#38bdf8', 2.2, 0.95, currentScale);
        }
      }

      // 5. ドラッグ中のプレビュー線を描画
      const dragState = dragStateRef.current;
      if (dragState.isDragging && dragState.startStar) {
        const targetX = dragState.snapCandidate
          ? dragState.snapCandidate.x
          : dragState.currentX;
        const targetY = dragState.snapCandidate
          ? dragState.snapCandidate.y
          : dragState.currentY;

        drawDraggingPreviewLine(
          ctx,
          dragState.startStar.x,
          dragState.startStar.y,
          targetX,
          targetY,
          Boolean(dragState.snapCandidate),
          timeSec,
          currentScale
        );
      }

      // 画面のワールド座標における描画領域（バウンディングボックス）を計算
      const cullMargin = 150 / currentScale; // 光のスパイクや影が画面外で切れないように余裕を持たせる
      const screenWorldLeft = -vp.panX / currentScale - cullMargin;
      const screenWorldTop = -vp.panY / currentScale - cullMargin;
      const screenWorldRight = (width - vp.panX) / currentScale + cullMargin;
      const screenWorldBottom = (height - vp.panY) / currentScale + cullMargin;

      // 6. 画面内の星だけを描画（カリング処理による軽量化）
      for (const star of currentStars) {
        if (
          star.x >= screenWorldLeft &&
          star.x <= screenWorldRight &&
          star.y >= screenWorldTop &&
          star.y <= screenWorldBottom
        ) {
          const isHovered = dragState.hoveredStar?.id === star.id;
          const isSelected = dragState.startStar?.id === star.id;
          const isSnapTarget = dragState.snapCandidate?.id === star.id;

          drawStar(ctx, star, timeSec, isHovered, isSelected, isSnapTarget, currentScale);
        }
      }

      // 7. 星屑パーティクルエフェクトの描画・更新
      updateAndDrawParticles(ctx, particlesRef.current);

      ctx.restore(); // ワールド空間の復元
      ctx.restore(); // DPRトランスフォームの復元

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeHighlightConstellationId]);

  /**
   * ポインター操作（星の選択・ドラッグ線結び、ピンチイン・アウト、パン移動）
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pointerCount = pointersRef.current.size;

    // 2本指タッチ時はピンチイン・アウトモードへ
    if (pointerCount === 2) {
      interactionModeRef.current = 'pinch';
      dragStateRef.current.isDragging = false;
      dragStateRef.current.startStar = null;
      dragStateRef.current.snapCandidate = null;

      const pts = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      const rect = canvas.getBoundingClientRect();
      const screenMidX = midX - rect.left;
      const screenMidY = midY - rect.top;
      const vp = viewportRef.current;

      pinchStateRef.current = {
        initialDist: Math.max(10, dist),
        initialScale: vp.scale,
        midScreenX: screenMidX,
        midScreenY: screenMidY,
        worldMidX: (screenMidX - vp.panX) / vp.scale,
        worldMidY: (screenMidY - vp.panY) / vp.scale,
      };
      return;
    }

    if (pointerCount === 1) {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const vp = viewportRef.current;

      // 中クリックまたは右クリック時、あるいはツールモードが「移動(pan)」の時は直接パンモード
      if (e.button === 1 || e.button === 2 || toolModeRef.current === 'pan') {
        interactionModeRef.current = 'pan';
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          panX: vp.panX,
          panY: vp.panY,
        };
        return;
      }

      // 描画モード時：左クリック / 1本指タッチ：スクリーン座標から最も近い星をスナップ距離内で探索
      const { star: nearStar } = findNearestStarScreen(
        screenX,
        screenY,
        starsRef.current,
        vp.scale,
        vp.panX,
        vp.panY,
        SNAP_DISTANCE
      );

      if (nearStar) {
        // 星の上での操作：線の描画モード
        interactionModeRef.current = 'draw';
        dragStateRef.current = {
          isDragging: true,
          startStar: nearStar,
          currentX: nearStar.x,
          currentY: nearStar.y,
          hoveredStar: nearStar,
          snapCandidate: null,
        };

        soundEffects.playStarSelect();
        spawnSparkles(particlesRef.current, nearStar.x, nearStar.y, 10, nearStar.color);
      } else {
        // 星のない空間での操作：星空のパン移動モード
        interactionModeRef.current = 'pan';
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          panX: vp.panX,
          panY: vp.panY,
        };
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const vp = viewportRef.current;

    // 1. ピンチイン・ピンチアウト操作 (2本指)
    if (pointersRef.current.size >= 2 && pinchStateRef.current) {
      const pts = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;

      const pinch = pinchStateRef.current;
      const scaleRatio = dist / pinch.initialDist;
      const newScale = Math.max(0.35, Math.min(2.5, pinch.initialScale * scaleRatio));

      // ピンチの中心点を維持するようにパン座標を追従
      const newPanX = midX - pinch.worldMidX * newScale;
      const newPanY = midY - pinch.worldMidY * newScale;

      setViewport({ scale: newScale, panX: newPanX, panY: newPanY });
      viewportRef.current = { scale: newScale, panX: newPanX, panY: newPanY };
      return;
    }

    // 2. 星空のパン移動 (1本指ドラッグ / 中ドラッグ)
    if (interactionModeRef.current === 'pan') {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      const newPanX = panStartRef.current.panX + dx;
      const newPanY = panStartRef.current.panY + dy;

      setViewport((prev) => ({ ...prev, panX: newPanX, panY: newPanY }));
      viewportRef.current = { scale: vp.scale, panX: newPanX, panY: newPanY };
      return;
    }

    // 3. 星の結線ドラッグ操作
    if (interactionModeRef.current === 'draw' && dragStateRef.current.isDragging && dragStateRef.current.startStar) {
      // スクリーン座標からワールド座標へ変換
      const worldX = (screenX - vp.panX) / vp.scale;
      const worldY = (screenY - vp.panY) / vp.scale;
      dragStateRef.current.currentX = worldX;
      dragStateRef.current.currentY = worldY;

      // 始点の星を除外し、スクリーン距離でスナップ候補を探索
      const { star: candidate } = findNearestStarScreen(
        screenX,
        screenY,
        starsRef.current,
        vp.scale,
        vp.panX,
        vp.panY,
        SNAP_DISTANCE,
        dragStateRef.current.startStar.id
      );

      if (candidate && (!dragStateRef.current.snapCandidate || dragStateRef.current.snapCandidate.id !== candidate.id)) {
        soundEffects.playSnap();
      }

      dragStateRef.current.snapCandidate = candidate;
    } else if (pointersRef.current.size === 0) {
      // 通常マウスホバー時の星検知
      const { star: hovered } = findNearestStarScreen(
        screenX,
        screenY,
        starsRef.current,
        vp.scale,
        vp.panX,
        vp.panY,
        SNAP_DISTANCE
      );
      dragStateRef.current.hoveredStar = hovered;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }

    if (interactionModeRef.current === 'draw' && dragStateRef.current.isDragging && dragStateRef.current.startStar) {
      const startStar = dragStateRef.current.startStar;
      const rect = canvas?.getBoundingClientRect();
      const screenX = rect ? e.clientX - rect.left : 0;
      const screenY = rect ? e.clientY - rect.top : 0;
      const vp = viewportRef.current;

      // スナップ候補、または離した位置の近傍星
      let targetStar = dragStateRef.current.snapCandidate;
      if (!targetStar && rect) {
        const { star: nearEnd } = findNearestStarScreen(
          screenX,
          screenY,
          starsRef.current,
          vp.scale,
          vp.panX,
          vp.panY,
          SNAP_DISTANCE,
          startStar.id
        );
        targetStar = nearEnd;
      }

      if (targetStar && targetStar.id !== startStar.id) {
        // 重複線のチェック（A->B または B->A が既に引かれていないか）
        const exists = pendingLinesRef.current.some(
          (l) =>
            (l.fromStarId === startStar.id && l.toStarId === targetStar!.id) ||
            (l.fromStarId === targetStar!.id && l.toStarId === startStar.id)
        );

        if (!exists) {
          const newLine: Line = {
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            fromStarId: startStar.id,
            toStarId: targetStar.id,
            createdAt: Date.now(),
          };

          setPendingLines((prev) => [...prev, newLine]);
          soundEffects.playConnect();

          // スパークル演出
          spawnSparkles(particlesRef.current, targetStar.x, targetStar.y, 16, '#38bdf8');
          spawnSparkles(
            particlesRef.current,
            (startStar.x + targetStar.x) / 2,
            (startStar.y + targetStar.y) / 2,
            8,
            '#ffffff'
          );
        }
      }
    }

    if (pointersRef.current.size === 0) {
      interactionModeRef.current = null;
      dragStateRef.current = {
        isDragging: false,
        startStar: null,
        currentX: 0,
        currentY: 0,
        hoveredStar: null,
        snapCandidate: null,
      };
    }
  };

  const handlePointerCancel = () => {
    pointersRef.current.clear();
    pinchStateRef.current = null;
    interactionModeRef.current = null;
    dragStateRef.current = {
      isDragging: false,
      startStar: null,
      currentX: 0,
      currentY: 0,
      hoveredStar: null,
      snapCandidate: null,
    };
  };

  /**
   * ズームインボタン
   */
  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    zoomAtScreenPoint(rect.width / 2, rect.height / 2, 1.25);
  };

  /**
   * ズームアウトボタン
   */
  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    zoomAtScreenPoint(rect.width / 2, rect.height / 2, 1 / 1.25);
  };

  /**
   * ズームリセットボタン
   */
  const handleResetZoom = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const defaultScale = 0.85;
    const newPanX = (rect.width - WORLD_WIDTH * defaultScale) / 2;
    const newPanY = (rect.height - WORLD_HEIGHT * defaultScale) / 2;

    setViewport({ scale: defaultScale, panX: newPanX, panY: newPanY });
    viewportRef.current = { scale: defaultScale, panX: newPanX, panY: newPanY };
  };

  /**
   * 現在の線をクリア
   */
  const handleClearLines = () => {
    if (pendingLines.length === 0) return;
    setPendingLines([]);
    soundEffects.playClear();
  };

  /**
   * 星座の完成モーダルを開く
   */
  const handleOpenCompleteModal = () => {
    if (pendingLines.length === 0) return;
    setIsCompletionModalOpen(true);
  };

  /**
   * 星座の確定・命名登録
   */
  const handleConfirmConstellation = (
    name: string,
    themeColor: string,
    description: string
  ) => {
    if (pendingLines.length === 0) return;

    // 構成する星IDの一意な集合
    const starIdSet = new Set<string>();
    pendingLines.forEach((line) => {
      starIdSet.add(line.fromStarId);
      starIdSet.add(line.toStarId);
    });
    const starIds = Array.from(starIdSet);

    // 重心座標の計算
    const starsMap = new Map<string, Star>();
    starsRef.current.forEach((s) => starsMap.set(s.id, s));
    const center = calculateConstellationCenter(starIds, starsMap);

    const newConstellation: Constellation = {
      id: `constellation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      lines: pendingLines.map((l) => ({ ...l, color: themeColor })),
      starIds,
      centerX: center.x,
      centerY: center.y,
      themeColor,
      description,
      createdAt: Date.now(),
    };

    setConstellations((prev) => [...prev, newConstellation]);
    setPendingLines([]);
    setIsCompletionModalOpen(false);

    // 祝祭ファンファーレ音と星屑の大バースト
    soundEffects.playConstellationComplete();
    starIds.forEach((sid) => {
      const s = starsMap.get(sid);
      if (s) {
        spawnSparkles(particlesRef.current, s.x, s.y, 20, themeColor);
      }
    });
    spawnSparkles(particlesRef.current, center.x, center.y, 35, '#ffffff');
  };

  /**
   * 星座の削除 (管理者限定)
   */
  const handleDeleteConstellation = (id: string) => {
    if (!isAdmin) return;
    setConstellations((prev) => prev.filter((c) => c.id !== id));
    soundEffects.playClear();
  };

  /**
   * 星座の強調フォーカス（図鑑から選択された星座へカメラ移動）
   */
  const handleFocusConstellation = (c: Constellation) => {
    setActiveHighlightConstellationId(c.id);
    setTimeout(() => {
      setActiveHighlightConstellationId(null);
    }, 4000);

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const targetScale = Math.max(0.9, viewportRef.current.scale);
      const newPanX = rect.width / 2 - c.centerX * targetScale;
      const newPanY = rect.height / 2 - c.centerY * targetScale;
      setViewport({ scale: targetScale, panX: newPanX, panY: newPanY });
      viewportRef.current = { scale: targetScale, panX: newPanX, panY: newPanY };
    }

    spawnSparkles(particlesRef.current, c.centerX, c.centerY, 30, c.themeColor);
  };

  /**
   * キャンバス全体の高解像度エクスポート (管理者限定)
   */
  const handleExportCanvasImage = () => {
    if (!isAdmin) return;

    // 高解像度での出力 (2x スケールでよりシャープに)
    const EXPORT_WIDTH = 4000;
    const EXPORT_HEIGHT = (WORLD_HEIGHT / WORLD_WIDTH) * EXPORT_WIDTH;
    const EXPORT_SCALE = EXPORT_WIDTH / WORLD_WIDTH;

    // 画面外のキャンバスを作成
    const offCanvas = document.createElement('canvas');
    // デバイスピクセル比の考慮は不要なため、そのまま設定
    offCanvas.width = EXPORT_WIDTH;
    offCanvas.height = EXPORT_HEIGHT;
    const ctx = offCanvas.getContext('2d', { alpha: false }); // 背景を不透明に設定
    if (!ctx) return;

    // 高画質描画設定
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 背景を確実に黒く塗りつぶす (透過によるバグを防ぐため)
    ctx.fillStyle = '#02040a';
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

    // スケールを適用 (描画関数内で座標系をWORLD系に変換)
    ctx.save();
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

    // 1. 背景描画 (WORLD_WIDTH/HEIGHTをベースに描画)
    drawCosmicBackground(ctx, WORLD_WIDTH, WORLD_HEIGHT, performance.now() * 0.001);

    // 2. 星の描画
    stars.forEach((star) => {
      drawStar(ctx, star, false, 1.0);
    });

    // 3. 星座と線の描画
    constellations.forEach((c) => {
      c.lines.forEach((line) => {
        const s1 = stars.find((s) => s.id === line.fromStarId);
        const s2 = stars.find((s) => s.id === line.toStarId);
        if (s1 && s2) {
          drawGlowLine(ctx, s1.x, s1.y, s2.x, s2.y, line.color, 3.0, 1.0, 1.0);
        }
      });
      drawConstellationLabel(ctx, c, 0, 1.0);
    });

    ctx.restore();

    // 4. ダウンロード処理
    try {
      // pngに変更して画質劣化(圧縮ノイズ)を防ぐ
      const dataUrl = offCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `stellar_canvas_export_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
      alert('画像のエクスポートに失敗しました。');
    }
  };

  /**
   * 全画面モード切替
   */
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 構成中の星数
  const uniquePendingStarCount = React.useMemo(() => {
    const set = new Set<string>();
    pendingLines.forEach((l) => {
      set.add(l.fromStarId);
      set.add(l.toStarId);
    });
    return set.size;
  }, [pendingLines]);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#02040a] text-slate-200">
      {/* メインCanvas */}
      <canvas
        ref={canvasRef}
        id="constellation-canvas"
        className="block w-full h-full cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />

      {/* ヘッダーバナー */}
      <HeaderBanner
        constellationCount={constellations.length}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onTitleClick={handleTitleClick}
      />

      {/* フッター操作ツールバー */}
      <Controls
        toolMode={toolMode}
        onChangeToolMode={setToolMode}
        lineCount={pendingLines.length}
        constellationCount={constellations.length}
        isAudioEnabled={isAudioEnabled}
        zoomScale={viewport.scale}
        onComplete={handleOpenCompleteModal}
        onClearLines={handleClearLines}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleAudio={handleToggleAudio}
        onOpenRegistry={() => setIsRegistryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isAdmin={isAdmin}
        onExportImage={handleExportCanvasImage}
      />

      {/* 星座命名・登録モーダル */}
      <CompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={handleConfirmConstellation}
        lineCount={pendingLines.length}
        starCount={uniquePendingStarCount}
      />

      {/* 星座図鑑ドロワー */}
      <ConstellationListDrawer
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
        constellations={constellations}
        onFocusConstellation={handleFocusConstellation}
        onDeleteConstellation={handleDeleteConstellation}
        isAdmin={isAdmin}
      />

      {/* 遊び方ガイドモーダル */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
