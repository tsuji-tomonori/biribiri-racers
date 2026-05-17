import type { Course, ScreenName } from "../../types";
import { effectAssets, kartSprites, logoAssets } from "../../data/assets";
import { CourseCard } from "../course/CourseCard";
import { MegaButton } from "../ui/MegaButton";
import { Screen } from "../ui/Screen";

interface MenuScreenProps {
  current: ScreenName;
  playerName: string;
  featuredCourse: Course;
  recommendedCourses: Course[];
  onNavigate: (screen: ScreenName) => void;
  onOpenModal: (title: string) => void;
}

export function MenuScreen({ current, playerName, featuredCourse, recommendedCourses, onNavigate, onOpenModal }: MenuScreenProps) {
  return (
    <Screen name="menu" current={current} labelledBy="menu-title">
      <div className="hero-panel">
        <p className="eyebrow">さわるとビリビリ！ はしりぬけて、いちばんのりをめざそう！</p>
        <h1 id="menu-title" className="logo-title">
          <img src={logoAssets.main} alt="ビリビリレーサーズ" />
        </h1>
        <div className="menu-actions" aria-label="メインメニュー">
          <MegaButton action="room" tone="pink" icon="⚡" label="ルーム作成" description="コースとルールをえらぶ" bakedLabel onClick={() => onNavigate("room")} />
          <MegaButton action="join" tone="blue" icon="↪" label="コードで参加" description="オンライン参加は準備中" bakedLabel onClick={() => onNavigate("join")} />
          <MegaButton action="howto" tone="teal" icon="?" label="あそびかた" description="かべに触れたらスタートへ" bakedLabel onClick={() => onOpenModal("あそびかた")} />
          <MegaButton action="settings" tone="yellow" icon="⚙" label="設定" description="演出と操作を確認" bakedLabel onClick={() => onOpenModal("設定")} />
        </div>
        <div className="notice-bar">
          <img className="notice-icon" src={logoAssets.newBadge} alt="" aria-hidden="true" />
          <span><b>おしらせ</b> v2コースカード、カート、エフェクトでホーム画面を更新しました。</span>
        </div>
      </div>

      <div className="showcase-panel">
        <div className="profile-card">
          <div className="avatar" aria-hidden="true">⚡</div>
          <div>
            <strong>{playerName}</strong>
            <span>ローカルプレイヤー</span>
          </div>
        </div>
        <button className="map-shortcut" type="button" onClick={() => onNavigate("map")}>マップ一覧</button>
        <div className="course-stage" aria-label={`おすすめステージ ${featuredCourse.name}`}>
          <div className="track-preview">
            <div className="theme-panorama" aria-hidden="true" />
            <img className="featured-course-card" src={featuredCourse.previewAsset} alt={`${featuredCourse.name}のコースカード`} />
            <div className="course-parts-layer" aria-hidden="true">
              {stageParts(featuredCourse).map(({ src, className }) => (
                <img className={`course-part ${className}`} src={src} alt="" key={`${className}-${src}`} />
              ))}
            </div>
            <img className="stage-logo" src={logoAssets.startBadge} alt="" />
            <img className="stage-kart stage-kart-blue" src={kartSprites.blueBoost} alt="" />
            <img className="stage-kart stage-kart-pink" src={kartSprites.pinkBoost} alt="" />
            <img className="stage-kart stage-kart-green" src={kartSprites.greenBoost} alt="" />
            <img className="stage-effect stage-effect-spark" src={effectAssets.electricSparkBlue} alt="" />
            <img className="goal-banner" src={logoAssets.goalBadge} alt="" />
          </div>
        </div>
        <section className="help-card" aria-labelledby="help-title">
          <h2 id="help-title">あそびかた</h2>
          <p>かべにさわるとビリビリでアウト！</p>
          <p>スタートにもどってやりなおし！</p>
          <p>ゴールにたどりついたプレイヤーのかち！</p>
        </section>
        <section className="recommended-courses" aria-label="おすすめコース">
          {recommendedCourses.map((course) => <CourseCard course={course} selected={course.id === featuredCourse.id} key={course.id} />)}
        </section>
        <div className="footer-shortcuts" aria-label="ショートカット">
          <button type="button" onClick={() => onOpenModal("設定")}>スキン</button>
          <button type="button" onClick={() => onNavigate("map")}>ランキング</button>
          <button type="button" onClick={() => onNavigate("join")}>フレンド</button>
          <button type="button" onClick={() => onOpenModal("あそびかた")}>おしらせ</button>
        </div>
      </div>
    </Screen>
  );
}

function stageParts(course?: Course) {
  if (!course) return [];
  return [
    { src: course.partAssets[0], className: "part-banner" },
    { src: course.partAssets[1], className: "part-start" },
    { src: course.partAssets[2], className: "part-road-a" },
    { src: course.partAssets[4], className: "part-road-b" },
    { src: course.partAssets[3], className: "part-boost" },
  ].filter((item) => Boolean(item.src));
}
