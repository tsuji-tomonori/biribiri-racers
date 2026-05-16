import { useState } from "react";
import type { ScreenName } from "../../types";
import { MegaButton } from "../ui/MegaButton";
import { Screen } from "../ui/Screen";
import { ScreenHeader } from "../ui/ScreenHeader";

interface JoinScreenProps {
  current: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export function JoinScreen({ current, onNavigate }: JoinScreenProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("オンライン検索は未接続です。入力形式だけ確認できます。");

  const normalizeCode = (value: string) => value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^([A-Z]{4})([0-9])/, "$1-$2")
    .slice(0, 9);

  const submit = () => {
    const rawCode = code.trim().toUpperCase().replace(/\s+/g, "-");
    const valid = /^[A-Z]{4}-[0-9]{4}$/.test(rawCode);
    setCode(rawCode);
    setStatus(valid
      ? "コード形式は正しいです。オンライン検索サービスは未接続です。"
      : "コード形式は AAAA-9999 で入力してください。");
  };

  return (
    <Screen name="join" current={current} labelledBy="join-title">
      <ScreenHeader
        eyebrow="ルームコードを入力して、いっしょにレースしよう！"
        title="コードで参加"
        titleId="join-title"
        onBack={() => onNavigate("menu")}
      />
      <div className="join-grid">
        <section className="panel">
          <h3>ルームコードを入力</h3>
          <label className="code-input">
            <span>BIRI-1234 形式</span>
            <input
              autoComplete="off"
              inputMode="text"
              maxLength={10}
              placeholder="BIRI-1234"
              value={code}
              onChange={(event) => setCode(normalizeCode(event.currentTarget.value))}
            />
          </label>
          <div className="button-row">
            <MegaButton action="paste-code" tone="blue" icon="⌘" label="貼り付け" compact onClick={() => setStatus("クリップボード連携は未実装です。コードは手入力してください。")} />
            <MegaButton action="join-submit" tone="pink" icon="↪" label="参加する" compact onClick={submit} />
          </div>
          <p className="inline-status">{status}</p>
        </section>
        <section className="panel">
          <h3>最近のコード / フレンドのチーム</h3>
          <div className="empty-state">
            <strong>履歴はありません</strong>
            <span>ルーム履歴の保存とフレンド連携は今後対応予定です。</span>
          </div>
        </section>
        <section className="panel found-team-panel">
          <h3>見つかったチーム</h3>
          <div className="empty-state electric">
            <strong>検索サービス未接続</strong>
            <span>現在はローカル一人プレイのみ利用できます。ルーム詳細は実データ接続後に表示します。</span>
          </div>
          <dl className="rule-summary">
            <div><dt>勝利条件</dt><dd>さいしょにゴールでかち</dd></div>
            <div><dt>壁ルール</dt><dd>かべにさわるとスタートにもどる</dd></div>
            <div><dt>操作</dt><dd>WASD / 矢印キー、Space</dd></div>
          </dl>
          <MegaButton action="room" tone="teal" icon="＋" label="自分でルーム作成" compact full onClick={() => onNavigate("room")} />
        </section>
      </div>
    </Screen>
  );
}
