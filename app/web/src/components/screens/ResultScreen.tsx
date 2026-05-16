import type { Course, RaceResult, ScreenName } from "../../types";
import { effectAssets, logoAssets } from "../../data/assets";
import { formatTime } from "../../utils/format";
import { CourseDetail } from "../course/CourseDetail";
import { MegaButton } from "../ui/MegaButton";
import { Screen } from "../ui/Screen";

interface ResultScreenProps {
  current: ScreenName;
  course: Course;
  playerName: string;
  result: RaceResult | null;
  onNavigate: (screen: ScreenName) => void;
  onRetry: () => void;
}

export function ResultScreen({ current, course, playerName, result, onNavigate, onRetry }: ResultScreenProps) {
  const resultTime = result ? formatTime(result.time) : "00:00.00";
  const crashes = result ? `${result.crashes}回` : "0回";

  return (
    <Screen name="result" current={current} labelledBy="result-title">
      <div className="result-hero">
        <div className="winner-card">
          <p className="winner-en">WINNER!</p>
          <img className="winner-banner-art" src={logoAssets.winnerBanner} alt="" aria-hidden="true" />
          <h2 id="result-title">ゆうしょう！</h2>
          <p className="ribbon">レース おつかれさま！</p>
          <div className="podium">
            <img className="medal" src={effectAssets.medalFirst} alt="1st" />
            <div className="big-car" />
          </div>
          <div className="winner-name">{playerName}</div>
          <div className="result-stats">
            <span>タイム <strong>{resultTime}</strong></span>
            <span>かべに当たった回数 <strong>{crashes}</strong></span>
          </div>
        </div>

        <div className="score-panel">
          <section className="panel">
            <CourseDetail course={course} variant="result" />
          </section>
          <section className="panel leaderboard">
            <h3>レース結果</h3>
            <div className="leader-row first"><span>1st</span><b>{playerName}</b><em>{resultTime}</em></div>
            <div className="leader-row unavailable"><span>2nd</span><b>オンライン対戦は準備中</b><em>-</em></div>
            <div className="leader-row unavailable"><span>3rd</span><b>オンライン対戦は準備中</b><em>-</em></div>
            <div className="leader-row unavailable"><span>4th</span><b>オンライン対戦は準備中</b><em>-</em></div>
          </section>
        </div>
      </div>

      <footer className="result-actions">
        <MegaButton action="start" tone="pink" icon="↻" label="もういちど" compact onClick={onRetry} />
        <MegaButton action="room" tone="teal" icon="⌂" label="ルームへ" compact onClick={() => onNavigate("room")} />
        <MegaButton action="map" tone="blue" icon="▦" label="マップへ" compact onClick={() => onNavigate("map")} />
        <MegaButton action="menu" tone="yellow" icon="☰" label="メニューへ" compact onClick={() => onNavigate("menu")} />
        <MegaButton tone="disabled" icon="↑" label="共有は準備中" compact disabled />
      </footer>
    </Screen>
  );
}
