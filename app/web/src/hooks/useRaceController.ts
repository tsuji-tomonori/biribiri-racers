import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Course, RaceHud, RaceRefs, RaceResult, RaceState, ScreenName } from "../types";
import { formatTime } from "../utils/format";
import { kartSprites } from "../data/assets";
import { drawMiniMap, drawTrack, isOnRoad, type DrawingCaches } from "../game/drawing";
import { preloadImages } from "../game/imageCache";
import { chipRespawnPose, chipTrackForCourse, nearestChipProgress } from "../game/chips/chipTrack";

const initialHud: RaceHud = {
  time: "00:00.00",
  lap: "1/3",
  crashes: "0回",
  boostStatus: "OK",
  rankScore: "走行中",
  toastMessage: "かべに せっしょく！ スタートへ もどる",
  toastVisible: false,
};

interface UseRaceControllerArgs {
  appState: AppState;
  course: Course;
  courses: Course[];
  refs: RaceRefs;
  setScreen: (screen: ScreenName) => void;
  onFinish: (result: RaceResult) => void;
}

export interface RaceController {
  countdownBadge: string;
  hud: RaceHud;
  startReadyCountdown: () => void;
  startRace: () => void;
  triggerBoost: () => void;
  stopRace: () => void;
}

export function useRaceController({
  appState,
  course,
  courses,
  refs,
  setScreen,
  onFinish,
}: UseRaceControllerArgs): RaceController {
  const [countdownBadge, setCountdownBadge] = useState("3");
  const [hud, setHud] = useState<RaceHud>(initialHud);
  const raceRef = useRef<RaceState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const countdownTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const appStateRef = useRef(appState);
  const courseRef = useRef(course);
  const onFinishRef = useRef(onFinish);

  const caches = useMemo<DrawingCaches>(() => {
    const trackImages = preloadImages(trackAssetSources(courses));
    const kartImages = preloadImages(kartSprites);
    return { trackImages, kartImages };
  }, [courses]);

  useEffect(() => {
    appStateRef.current = appState;
    courseRef.current = course;
    onFinishRef.current = onFinish;
  }, [appState, course, onFinish]);

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const drawReadyPreview = useCallback(() => {
    const canvas = refs.readyCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawTrack(ctx, canvas.width, canvas.height, courseRef.current, caches, null, true);
  }, [caches, refs.readyCanvasRef]);

  const updateHud = useCallback((race: RaceState) => {
    const now = performance.now();
    const laps = appStateRef.current.laps;
    setHud({
      time: formatTime(now - race.startedAt),
      lap: `${Math.min(race.lap, laps)}/${laps}`,
      crashes: `${race.crashes}回`,
      boostStatus: appStateRef.current.boostEnabled
        ? now >= race.boostCooldownUntil ? "OK" : "充電中"
        : "OFF",
      rankScore: `${Math.round(race.progress * 100)}%`,
      toastMessage: race.toastMessage,
      toastVisible: race.toastUntil >= now,
    });
  }, []);

  const stopRace = useCallback(() => {
    clearCountdown();
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (raceRef.current) {
      raceRef.current.running = false;
    }
  }, [clearCountdown]);

  const finishRace = useCallback(() => {
    const race = raceRef.current;
    if (!race) return;

    const elapsed = performance.now() - race.startedAt;
    race.running = false;
    const result: RaceResult = {
      courseId: appStateRef.current.courseId,
      time: elapsed,
      crashes: race.crashes,
      playerName: appStateRef.current.playerName,
      courseName: courseRef.current.name,
    };

    onFinishRef.current(result);
    setHud((current) => ({
      ...current,
      time: formatTime(elapsed),
      crashes: `${race.crashes}回`,
      toastVisible: false,
    }));
    setScreen("result");
  }, [setScreen]);

  const resetToStart = useCallback((race: RaceState, now: number) => {
    const start = chipRespawnPose(chipTrackForCourse(courseRef.current.id));
    race.x = start.x;
    race.y = start.y;
    race.vx = 0;
    race.vy = 0;
    race.angle = start.angle;
    race.progress = 0;
    race.lastProgress = 0;
    race.crashes += 1;
    race.invulnerableUntil = now + 1100;
    race.toastUntil = now + 1200;
    race.toastMessage = "⚡ かべにせっしょく！ スタートへもどる";
  }, []);

  const updateCar = useCallback((race: RaceState, ctx: CanvasRenderingContext2D, dt: number, now: number) => {
    let ax = 0;
    let ay = 0;
    const keys = keysRef.current;
    if (keys.has("ArrowUp") || keys.has("KeyW")) ay -= 1;
    if (keys.has("ArrowDown") || keys.has("KeyS")) ay += 1;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) ax -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) ax += 1;

    const length = Math.hypot(ax, ay);
    const accel = now < race.boostPulseUntil ? 980 : 560;
    if (length > 0) {
      ax /= length;
      ay /= length;
      race.vx += ax * accel * dt;
      race.vy += ay * accel * dt;
      race.angle = Math.atan2(ay, ax);
    }

    const drag = length > 0 ? 0.982 : 0.945;
    race.vx *= drag;
    race.vy *= drag;
    const maxSpeed = now < race.boostPulseUntil ? 470 : 320;
    const speed = Math.hypot(race.vx, race.vy);
    if (speed > maxSpeed) {
      race.vx = (race.vx / speed) * maxSpeed;
      race.vy = (race.vy / speed) * maxSpeed;
    }

    const nextX = race.x + race.vx * dt;
    const nextY = race.y + race.vy * dt;
    if (!isOnRoad(ctx, courseRef.current, nextX, nextY) && now > race.invulnerableUntil) {
      resetToStart(race, now);
      return;
    }

    race.x = nextX;
    race.y = nextY;
    race.lastProgress = race.progress;
    race.progress = nearestChipProgress(chipTrackForCourse(courseRef.current.id), race.x, race.y);

    if (race.lastProgress > 0.86 && race.progress < 0.1 && now - race.startedAt > 1600) {
      race.completedLaps += 1;
      if (race.completedLaps >= appStateRef.current.laps) {
        finishRace();
      } else {
        race.lap = race.completedLaps + 1;
        race.toastUntil = now + 900;
        race.toastMessage = `LAP ${race.lap}/${appStateRef.current.laps}`;
      }
    }
  }, [finishRace, resetToStart]);

  const tick = useCallback((now: number) => {
    const race = raceRef.current;
    const gameCanvas = refs.gameCanvasRef.current;
    const minimapCanvas = refs.minimapCanvasRef.current;
    const gameCtx = gameCanvas?.getContext("2d");
    const minimapCtx = minimapCanvas?.getContext("2d");
    if (!race || !race.running || !gameCanvas || !minimapCanvas || !gameCtx || !minimapCtx) return;

    const dt = Math.min(40, now - race.lastFrame) / 1000;
    race.lastFrame = now;
    updateCar(race, gameCtx, dt, now);
    drawTrack(gameCtx, gameCanvas.width, gameCanvas.height, courseRef.current, caches, race, false);
    drawMiniMap(minimapCtx, minimapCanvas.width, minimapCanvas.height, gameCanvas.width, gameCanvas.height, courseRef.current, caches, race);
    updateHud(race);

    if (race.running) {
      animationFrameRef.current = window.requestAnimationFrame(tick);
    }
  }, [caches, refs.gameCanvasRef, refs.minimapCanvasRef, updateCar, updateHud]);

  const startRace = useCallback(() => {
    clearCountdown();
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    const start = chipRespawnPose(chipTrackForCourse(courseRef.current.id));
    const now = performance.now();
    raceRef.current = {
      x: start.x,
      y: start.y,
      vx: 0,
      vy: 0,
      angle: start.angle,
      running: true,
      startedAt: now,
      lastFrame: now,
      lap: 1,
      completedLaps: 0,
      crashes: 0,
      progress: 0,
      lastProgress: 0,
      invulnerableUntil: now + 900,
      boostCooldownUntil: 0,
      boostPulseUntil: 0,
      toastUntil: 0,
      toastMessage: "かべに せっしょく！ スタートへ もどる",
    };
    updateHud(raceRef.current);
    setScreen("game");
    window.setTimeout(() => refs.gameCanvasRef.current?.focus(), 0);
    animationFrameRef.current = window.requestAnimationFrame(tick);
  }, [clearCountdown, refs.gameCanvasRef, setScreen, tick, updateHud]);

  const startReadyCountdown = useCallback(() => {
    stopRace();
    setScreen("ready");
    drawReadyPreview();
    setCountdownBadge("3");
    let count = 3;
    countdownTimerRef.current = window.setInterval(() => {
      count -= 1;
      setCountdownBadge(count > 0 ? String(count) : "GO!");
      if (count < 0) {
        startRace();
      }
    }, 900);
  }, [drawReadyPreview, setScreen, startRace, stopRace]);

  const triggerBoost = useCallback(() => {
    const race = raceRef.current;
    if (!appStateRef.current.boostEnabled || !race || !race.running) return;
    const now = performance.now();
    if (now < race.boostCooldownUntil) return;

    race.boostPulseUntil = now + 520;
    race.boostCooldownUntil = now + 1800;
    const forward = Math.hypot(race.vx, race.vy) > 8
      ? Math.atan2(race.vy, race.vx)
      : race.angle;
    race.vx += Math.cos(forward) * 170;
    race.vy += Math.sin(forward) * 170;
  }, []);

  useEffect(() => {
    const redraw = () => {
      if (appStateRef.current.screen === "ready") drawReadyPreview();
    };
    const images = [...caches.trackImages.values(), ...caches.kartImages.values()];
    images.forEach((image) => image.addEventListener("load", redraw));
    return () => images.forEach((image) => image.removeEventListener("load", redraw));
  }, [caches, drawReadyPreview]);

  useEffect(() => {
    if (appState.screen === "ready") drawReadyPreview();
    if (appState.screen !== "game" && raceRef.current) {
      raceRef.current.running = false;
    }
  }, [appState.screen, course.id, drawReadyPreview]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "Enter" && appStateRef.current.screen === "ready") {
        startRace();
      }
      if (event.code === "Space") {
        triggerBoost();
      }
      keysRef.current.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startRace, triggerBoost]);

  useEffect(() => stopRace, [stopRace]);

  return {
    countdownBadge,
    hud,
    startReadyCountdown,
    startRace,
    triggerBoost,
    stopRace,
  };
}

function trackAssetSources(courses: Course[]): string[] {
  return [...new Set(courses.flatMap((item) => [
    item.themeAssets?.floor,
    ...item.partAssets,
  ]).filter((source): source is string => Boolean(source)))];
}
