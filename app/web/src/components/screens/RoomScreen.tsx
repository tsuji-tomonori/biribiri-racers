import type { AppState, Course, ScreenName, Visibility } from "../../types";
import { CourseDetail } from "../course/CourseDetail";
import { MiniCourseButton } from "../course/MiniCourseButton";
import { MegaButton } from "../ui/MegaButton";
import { Screen } from "../ui/Screen";
import { ScreenHeader } from "../ui/ScreenHeader";

interface RoomScreenProps {
  current: ScreenName;
  appState: AppState;
  courses: Course[];
  selectedCourse: Course;
  onNavigate: (screen: ScreenName) => void;
  onPatchState: (patch: Partial<AppState>) => void;
  onSelectCourse: (courseId: string) => void;
  onStart: () => void;
}

const lapOptions = [1, 3, 5, 7];

export function RoomScreen({
  current,
  appState,
  courses,
  selectedCourse,
  onNavigate,
  onPatchState,
  onSelectCourse,
  onStart,
}: RoomScreenProps) {
  const changeLap = (direction: -1 | 1) => {
    const currentIndex = lapOptions.includes(appState.laps) ? lapOptions.indexOf(appState.laps) : 1;
    const nextIndex = Math.max(0, Math.min(lapOptions.length - 1, currentIndex + direction));
    onPatchState({ laps: lapOptions[nextIndex] });
  };
  const changePlayers = (direction: -1 | 1) => {
    onPatchState({ maxPlayers: Math.max(2, Math.min(8, appState.maxPlayers + direction)) });
  };
  const setVisibility = (visibility: Visibility) => onPatchState({ visibility });

  return (
    <Screen name="room" current={current} labelledBy="room-title">
      <ScreenHeader
        eyebrow="仲間をあつめて、ビリビリレースを楽しもう！"
        title="チーム作成"
        titleId="room-title"
        onBack={() => onNavigate("menu")}
      />

      <div className="room-grid">
        <section className="panel settings-panel" aria-labelledby="settings-title">
          <h3 id="settings-title">チーム設定</h3>
          <label className="setting-row">
            <span><b>チーム名</b><small>最大20文字</small></span>
            <input
              maxLength={20}
              value={appState.roomName}
              onChange={(event) => onPatchState({ roomName: event.currentTarget.value })}
            />
          </label>
          <label className="setting-row">
            <span><b>プレイヤー名</b><small>画面に表示される名前</small></span>
            <input
              maxLength={12}
              value={appState.playerName}
              onChange={(event) => onPatchState({ playerName: event.currentTarget.value })}
            />
          </label>
          <div className="setting-row">
            <span><b>最大プレイヤー数</b><small>オンラインは未接続</small></span>
            <div className="stepper">
              <button type="button" onClick={() => changePlayers(-1)} aria-label="最大プレイヤー数を減らす">‹</button>
              <output>{appState.maxPlayers}</output>
              <button type="button" onClick={() => changePlayers(1)} aria-label="最大プレイヤー数を増やす">›</button>
            </div>
          </div>
          <div className="setting-row">
            <span><b>公開設定</b><small>現在はローカルプレビュー</small></span>
            <div className="segmented" role="group" aria-label="公開設定">
              <button className={appState.visibility === "public" ? "is-selected" : ""} type="button" onClick={() => setVisibility("public")}>公開</button>
              <button className={appState.visibility === "private" ? "is-selected" : ""} type="button" onClick={() => setVisibility("private")}>非公開</button>
            </div>
          </div>
          <label className="setting-row">
            <span><b>パスワード（任意）</b><small>最大16文字</small></span>
            <input maxLength={16} placeholder="パスワードを入力" />
          </label>
          <div className="setting-row">
            <span><b>壁に触れると</b><small>びりびりでアウト</small></span>
            <span className="toggle-pill is-on">スタートへ戻る</span>
          </div>
          <div className="setting-row">
            <span><b>ラップ数</b><small>1 / 3 / 5 / 7</small></span>
            <div className="stepper">
              <button type="button" onClick={() => changeLap(-1)} aria-label="ラップ数を減らす">‹</button>
              <output>{appState.laps}</output>
              <button type="button" onClick={() => changeLap(1)} aria-label="ラップ数を増やす">›</button>
            </div>
          </div>
          <div className="setting-row">
            <span><b>ブースト</b><small>Space で短く加速</small></span>
            <button
              className={`toggle-pill ${appState.boostEnabled ? "is-on" : ""}`}
              type="button"
              onClick={() => onPatchState({ boostEnabled: !appState.boostEnabled })}
            >
              {appState.boostEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </section>

        <section className="panel player-panel" aria-labelledby="players-title">
          <h3 id="players-title">プレイヤー枠 <span>1/{appState.maxPlayers}</span></h3>
          <div className="player-slot active">
            <div className="tiny-car blue" />
            <div><strong>{appState.playerName}</strong><small>ホスト / ローカル</small></div>
          </div>
          {Array.from({ length: appState.maxPlayers - 1 }, (_, index) => (
            <div className="player-slot unavailable" key={index}>{index + 2}P 募集中（オンライン未接続）</div>
          ))}
          <div className="room-code">
            <small>チームコード</small>
            <strong>未発行</strong>
            <span>コード参加は準備中のため、現在はローカルプレイのみ利用できます。</span>
          </div>
          <MegaButton action="join" tone="blue" icon="↪" label="コードで参加画面へ" compact full bakedLabel onClick={() => onNavigate("join")} />
        </section>

        <section className="panel course-panel" aria-labelledby="course-title">
          <h3 id="course-title">コース選択</h3>
          <div className="course-picker" role="listbox" aria-label="コース">
            {courses.map((course) => (
              <MiniCourseButton
                course={course}
                selected={course.id === appState.courseId}
                onSelect={onSelectCourse}
                key={course.id}
              />
            ))}
          </div>
          <CourseDetail course={selectedCourse} />
          <MegaButton action="map" tone="teal" icon="▦" label="マップ一覧" compact full bakedLabel onClick={() => onNavigate("map")} />
        </section>
      </div>

      <footer className="screen-footer">
        <MegaButton action="menu" tone="blue" icon="←" label="もどる" compact bakedLabel onClick={() => onNavigate("menu")} />
        <MegaButton action="room-create" tone="pink" icon="🏁" label="作成する" compact bakedLabel onClick={onStart} />
      </footer>
    </Screen>
  );
}
