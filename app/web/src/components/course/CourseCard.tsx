import type { CSSProperties } from "react";
import type { Course } from "../../types";
import { formatExpectedTime } from "../../utils/format";
import { CoursePartStrip } from "./CoursePartStrip";

interface CourseCardProps {
  course: Course;
  selected?: boolean;
  mode?: "home" | "map";
  onSelect?: (courseId: string) => void;
}

type CourseImageStyle = CSSProperties & {
  "--card-course-image"?: string;
};

export function CourseCard({ course, selected = false, mode = "home", onSelect }: CourseCardProps) {
  const style: CourseImageStyle = {
    "--card-course-image": `url("${course.previewAsset}")`,
  };
  const status = course.implementationStatus === "thumbnail_only" ? "詳細未確定" : course.theme;

  if (mode === "map") {
    return (
      <button
        className={`course-card map-card ${selected ? "is-selected" : ""}`}
        type="button"
        data-course-id={course.id}
        onClick={() => onSelect?.(course.id)}
      >
        <div className="course-thumb" style={style}>
          {course.themeAssets ? <img className="course-card-badge" src={course.themeAssets.badge} alt="" /> : null}
        </div>
        <CoursePartStrip parts={course.partAssets} />
        <span>{course.id}</span>
        <strong>{course.name}</strong>
        <small>{"★".repeat(course.difficultyStars)} / {status}</small>
        <em>{course.description}</em>
      </button>
    );
  }

  return (
    <article className={`course-card ${selected ? "is-selected" : ""}`}>
      <div className="course-thumb" style={style}>
        {course.themeAssets ? <img className="course-card-badge" src={course.themeAssets.badge} alt="" /> : null}
      </div>
      <CoursePartStrip parts={course.partAssets} />
      <span>{course.id}</span>
      <strong>{course.name}</strong>
      <small>{"★".repeat(course.difficultyStars)} {formatExpectedTime(course.expectedTimeSec)}</small>
    </article>
  );
}
