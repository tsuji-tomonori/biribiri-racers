import type { RaceHud, RaceRefs, ScreenName } from "../../types";
import { effectAssets } from "../../data/assets";
import { Screen } from "../ui/Screen";

interface GameScreenProps {
  current: ScreenName;
  playerName: string;
  laps: number;
  inputMode: string;
  hud: RaceHud;
  refs: RaceRefs;
  onBoost: () => void;
}

export function GameScreen({ current, playerName, laps, inputMode, hud, refs, onBoost }: GameScreenProps) {
  return (
    <Screen name="game" current={current} labelledBy="game-title">
      <h2 id="game-title" className="sr-only">ゲーム中</h2>
      <div className="hud hud-top">
        <div className="hud-card logo-mini">ビリビリ<br />レーサーズ</div>
        <div className="hud-card timer"><span>のこりじかん</span><strong>{hud.time}</strong></div>
        <div className="hud-card lap"><span>ラップ</span><strong>{hud.lap}</strong></div>
        <div className="hud-card mode"><span>入力</span><strong>{inputMode}</strong></div>
      </div>

      <div className="game-board">
        <aside className="hud-column left">
          <section className="hud-panel ranking">
            <h3>ランキング</h3>
            <div className="rank-row active"><span>1</span><b>{playerName}</b><em>{hud.rankScore}</em></div>
          </section>
          <section className="hud-panel mission">
            <h3>ミッション</h3>
            <p>⚡ かべにさわるとスタートにもどる</p>
            <p>★ さいしょにゴールでかち</p>
            <p>🏁 ラップを <span>{laps}</span>周しよう</p>
          </section>
          <section className="hud-panel controls pc-controls">
            <h3>PC操作</h3>
            <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 矢印キー</p>
            <p><kbd>Space</kbd> ダッシュ</p>
            <p><kbd>E</kbd> アイテム（準備中）</p>
          </section>
        </aside>

        <div className="canvas-wrap">
          <canvas ref={refs.gameCanvasRef} width={980} height={680} tabIndex={0} aria-label="ビリビリレーサーズのレース画面" />
          <div className={`toast ${hud.toastVisible ? "is-visible" : ""}`} role="status">{hud.toastMessage}</div>
          <div className="touch-controls" aria-label="タッチ操作">
            <div className="virtual-stick"><span>⚡</span></div>
            <button className="touch-item" type="button" onClick={onBoost}>アイテム</button>
          </div>
        </div>

        <aside className="hud-column right">
          <section className="hud-panel minimap">
            <h3>ミニマップ</h3>
            <canvas ref={refs.minimapCanvasRef} width={220} height={180} aria-label="ミニマップ" />
          </section>
          <section className="hud-panel stats">
            <h3>アイテム</h3>
            <img className="hud-boost-art" src={effectAssets.boostTrailBlue} alt="" aria-hidden="true" />
            <p><span>かべ接触</span><strong>{hud.crashes}</strong></p>
            <p><span>ブースト</span><strong>{hud.boostStatus}</strong></p>
          </section>
          <button className="boost-button" type="button" onClick={onBoost} aria-label="ブーストを使う">⚡<span>つかう</span></button>
          <section className="quick-chat" aria-label="クイックチャット">
            <button type="button">いいね！</button>
            <button type="button">ナイス！</button>
            <button type="button">いくよー！</button>
            <button type="button">ドンマイ！</button>
          </section>
        </aside>
      </div>
    </Screen>
  );
}
