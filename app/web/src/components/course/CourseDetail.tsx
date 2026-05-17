import type { Course } from "../../types";
import { formatExpectedTime, formatTime } from "../../utils/format";
import { CoursePartStrip } from "./CoursePartStrip";

interface CourseDetailProps {
  course: Course;
  variant?: "room" | "map" | "result" | "ready";
}

export function CourseDetail({ course, variant = "room" }: CourseDetailProps) {
  const visual = (
    <div className="course-detail-visual">
      <img className="course-detail-art" src={course.mapAsset} alt={`${course.name}のコースカード`} />
      <CoursePartStrip parts={course.partAssets} />
    </div>
  );

  if (variant === "ready") {
    return (
      <div className="course-info-card">
        {visual}
        <strong>{course.name}</strong>
        <span>{course.aliases[0] || course.theme}</span>
      </div>
    );
  }

  if (variant === "map") {
    return (
      <div className="course-detail map-detail">
        {course.themeAssets ? <img className="theme-badge-art" src={course.themeAssets.badge} alt="" /> : null}
        {visual}
        <div>
          <span className="status-pill">{course.implementationStatus === "thumbnail_only" ? "詳細未確定" : "おすすめ"}</span>
          <strong>{course.name}</strong>
          <p>{course.description} {course.detail}</p>
          <div className="tag-row">
            {course.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <dl className="meta-list">
            <div><dt>ラップ数</dt><dd>{course.recommendedLaps}</dd></div>
            <div><dt>想定タイム</dt><dd>{formatExpectedTime(course.expectedTimeSec)}</dd></div>
            <div><dt>ベスト</dt><dd>{course.records.bestTimeMs ? formatTime(course.records.bestTimeMs) : "未記録"}</dd></div>
          </dl>
        </div>
      </div>
    );
  }

  if (variant === "result") {
    return (
      <div className="course-detail result-course">
        {visual}
        <div>
          <small>今回のコース</small>
          <strong>{course.name}</strong>
          <p>{course.description}</p>
          <p>一人プレイの記録です。オンライン順位は今後対応予定。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail">
      {course.themeAssets ? <img className="theme-badge-art" src={course.themeAssets.badge} alt="" /> : null}
      {visual}
      <div>
        <strong>{course.name}</strong>
        <p>{course.description}</p>
        <div className="tag-row">
          {course.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
    </div>
  );
}
