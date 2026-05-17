import type { Course, RaceRefs, ScreenName } from "../../types";
import { effectAssets, kartSprites, logoAssets } from "../../data/assets";
import { CourseDetail } from "../course/CourseDetail";
import { MegaButton } from "../ui/MegaButton";
import { Screen } from "../ui/Screen";

interface ReadyScreenProps {
  current: ScreenName;
  course: Course;
  playerName: string;
  countdownBadge: string;
  refs: RaceRefs;
  onForceStart: () => void;
}

export function ReadyScreen({ current, course, playerName, countdownBadge, refs, onForceStart }: ReadyScreenProps) {
  return (
    <Screen name="ready" current={current} labelledBy="ready-title">
      <div className="race-layout">
        <aside className="side-panel left">
          <h2 id="ready-title">レーススタートまで...</h2>
          <CourseDetail course={course} variant="ready" />
          <div className="rule-list">
            <p><b>⚡</b> かべに触れるとスタートへ戻る</p>
            <p><b>★</b> 最初にゴールで勝ち</p>
            <p><b>🏁</b> ラップを走りきるとゴール</p>
          </div>
          <div className="key-list">
            <span>WASD / 矢印キー</span>
            <b>移動</b>
            <span>Space</span>
            <b>ダッシュ</b>
            <span>Enter</span>
            <b>準備OK</b>
          </div>
        </aside>

        <div className="ready-stage">
          <canvas ref={refs.readyCanvasRef} width={960} height={620} aria-label="レース開始前のコースプレビュー" />
          <img className="ready-effect ready-effect-spark" src={effectAssets.electricSparkBlue} alt="" aria-hidden="true" />
          <img className="ready-kart-art ready-kart-blue" src={kartSprites.blueBoost} alt="" aria-hidden="true" />
          <img className="ready-kart-art ready-kart-yellow" src={kartSprites.yellowBoost} alt="" aria-hidden="true" />
          <div className="countdown-badge">{countdownBadge}</div>
          <img className="start-line-label" src={logoAssets.startBadge} alt="" aria-hidden="true" />
        </div>

        <aside className="side-panel right">
          <h2>プレイヤー <span>1/1</span></h2>
          <div className="player-ready-card">
            <div className="tiny-car blue large" />
            <div><strong>{playerName}</strong><small>準備OK / ローカル</small></div>
            <span className="check-mark">✓</span>
          </div>
          <MegaButton action="start" tone="green" icon="🏁" label="全員準備OK！" compact full bakedLabel onClick={onForceStart} />
        </aside>
      </div>
      <div className="tip-bar">TIP かべギリギリを攻めると速いけど、ぶつからないように気をつけてね！</div>
    </Screen>
  );
}
