import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { courses as initialCourses, getCourse } from "./data/courses";
import type { AppState, Course, RaceRefs, RaceResult, ScreenName } from "./types";
import { MenuScreen } from "./components/screens/MenuScreen";
import { RoomScreen } from "./components/screens/RoomScreen";
import { JoinScreen } from "./components/screens/JoinScreen";
import { MapScreen } from "./components/screens/MapScreen";
import { ReadyScreen } from "./components/screens/ReadyScreen";
import { GameScreen } from "./components/screens/GameScreen";
import { ResultScreen } from "./components/screens/ResultScreen";
import { Modal } from "./components/ui/Modal";
import { useRaceController } from "./hooks/useRaceController";

const initialScreen = (): ScreenName => {
  const screen = new URLSearchParams(window.location.search).get("screen");
  return screen === "room" || screen === "join" || screen === "map" || screen === "ready" || screen === "game" || screen === "result"
    ? screen
    : "menu";
};

const defaultState: AppState = {
  screen: initialScreen(),
  playerName: "ビリビリくん",
  roomName: "ビリビリ最強チーム！",
  maxPlayers: 4,
  visibility: "public",
  laps: 3,
  boostEnabled: true,
  courseId: "01",
  lastResult: null,
};

export function App() {
  const [courses, setCourses] = useState<Course[]>(() => initialCourses.map((course) => ({
    ...course,
    records: { ...course.records },
  })));
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState("PC");
  const readyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const refs: RaceRefs = useMemo(() => ({
    readyCanvasRef,
    gameCanvasRef,
    minimapCanvasRef,
  }), []);

  const selectedCourse = useMemo(() => getCourseFromList(courses, appState.courseId), [appState.courseId, courses]);

  const patchState = useCallback((patch: Partial<AppState>) => {
    setAppState((current) => ({
      ...current,
      ...patch,
      playerName: patch.playerName !== undefined ? patch.playerName.trim() || "ビリビリくん" : current.playerName,
      roomName: patch.roomName !== undefined ? patch.roomName.trim() || "ビリビリ最強チーム！" : current.roomName,
    }));
  }, []);

  const setScreen = useCallback((screen: ScreenName) => {
    setAppState((current) => ({ ...current, screen }));
  }, []);

  const selectCourse = useCallback((courseId: string) => {
    const nextCourse = getCourseFromList(courses, courseId);
    setAppState((current) => ({
      ...current,
      courseId,
      laps: nextCourse.recommendedLaps,
    }));
  }, [courses]);

  const finishRace = useCallback((result: RaceResult) => {
    setCourses((currentCourses) => currentCourses.map((course) => {
      if (course.id !== result.courseId) return course;
      if (course.records.bestTimeMs && course.records.bestTimeMs <= result.time) return course;
      return {
        ...course,
        records: {
          bestTimeMs: result.time,
          bestPlayerName: result.playerName,
        },
      };
    }));
    setAppState((current) => ({ ...current, lastResult: result }));
  }, []);

  const race = useRaceController({
    appState,
    course: selectedCourse,
    courses,
    refs,
    setScreen,
    onFinish: finishRace,
  });

  useEffect(() => {
    const syncInputMode = () => {
      setInputMode(window.matchMedia("(pointer: coarse)").matches ? "タッチ" : "PC");
    };
    syncInputMode();
    window.addEventListener("resize", syncInputMode);
    return () => window.removeEventListener("resize", syncInputMode);
  }, []);

  useEffect(() => {
    const courseImageValue = selectedCourse.previewAsset ? `url("${selectedCourse.previewAsset}")` : "none";
    const boardImageValue = selectedCourse.boardAsset ? `url("${selectedCourse.boardAsset}")` : courseImageValue;
    const theme = selectedCourse.themeAssets;
    document.body.dataset.courseTheme = selectedCourse.key;
    document.documentElement.style.setProperty("--course-image", courseImageValue);
    document.documentElement.style.setProperty("--stage-course-image", boardImageValue);
    document.documentElement.style.setProperty("--theme-panorama", theme?.panorama ? `url("${theme.panorama}")` : courseImageValue);
    document.documentElement.style.setProperty("--theme-floor", theme?.floor ? `url("${theme.floor}")` : courseImageValue);
    document.documentElement.style.setProperty("--theme-border", theme?.border ? `url("${theme.border}")` : "none");
  }, [selectedCourse]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.code !== "Escape") return;
      if (modalTitle) {
        setModalTitle(null);
        return;
      }
      if (["room", "join", "map"].includes(appState.screen)) {
        setScreen("menu");
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [appState.screen, modalTitle, setScreen]);

  return (
    <div className="app-shell">
      <main className="game-app reference-artboard" aria-live="polite">
        <MenuScreen
          current={appState.screen}
          playerName={appState.playerName}
          featuredCourse={selectedCourse}
          recommendedCourses={courses.slice(0, 3)}
          onNavigate={setScreen}
          onOpenModal={setModalTitle}
        />
        <RoomScreen
          current={appState.screen}
          appState={appState}
          courses={courses}
          selectedCourse={selectedCourse}
          onNavigate={setScreen}
          onPatchState={patchState}
          onSelectCourse={selectCourse}
          onStart={race.startReadyCountdown}
        />
        <JoinScreen current={appState.screen} onNavigate={setScreen} />
        <MapScreen
          current={appState.screen}
          courses={courses}
          selectedCourse={selectedCourse}
          selectedCourseId={appState.courseId}
          onNavigate={setScreen}
          onSelectCourse={selectCourse}
        />
        <ReadyScreen
          current={appState.screen}
          course={selectedCourse}
          playerName={appState.playerName}
          countdownBadge={race.countdownBadge}
          refs={refs}
          onForceStart={race.startRace}
        />
        <GameScreen
          current={appState.screen}
          course={selectedCourse}
          playerName={appState.playerName}
          laps={appState.laps}
          inputMode={inputMode}
          hud={race.hud}
          refs={refs}
          onBoost={race.triggerBoost}
        />
        <ResultScreen
          current={appState.screen}
          course={selectedCourse}
          playerName={appState.playerName}
          result={appState.lastResult}
          onNavigate={setScreen}
          onRetry={race.startReadyCountdown}
        />
        <Modal title={modalTitle ?? ""} open={modalTitle !== null} onClose={() => setModalTitle(null)} />
      </main>
    </div>
  );
}

function getCourseFromList(courses: Course[], courseId: string): Course {
  return courses.find((course) => course.id === courseId) ?? getCourse(courseId);
}
