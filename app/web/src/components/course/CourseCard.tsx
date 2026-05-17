import type { Course } from "../../types";
import { CoursePartStrip } from "./CoursePartStrip";

interface CourseCardProps {
  course: Course;
  selected?: boolean;
  mode?: "home" | "map";
  onSelect?: (courseId: string) => void;
}

export function CourseCard({ course, selected = false, mode = "home", onSelect }: CourseCardProps) {
  const status = course.implementationStatus === "thumbnail_only" ? "詳細未確定" : course.theme;
  const art = <img className="course-card-art" src={course.previewAsset} alt={`${course.name}のコースカード`} />;

  if (mode === "map") {
    return (
      <button
        className={`course-card map-card course-card-art-frame ${selected ? "is-selected" : ""}`}
        type="button"
        data-course-id={course.id}
        aria-label={`${course.id} ${course.name}。${status}。${course.description}`}
        onClick={() => onSelect?.(course.id)}
      >
        {art}
        <CoursePartStrip parts={course.partAssets} />
        {course.implementationStatus === "thumbnail_only" ? <span className="course-card-status">詳細未確定</span> : null}
      </button>
    );
  }

  return (
    <article
      className={`course-card course-card-art-frame ${selected ? "is-selected" : ""}`}
      aria-label={`おすすめコース ${course.id} ${course.name}`}
    >
      {art}
      <CoursePartStrip parts={course.partAssets} />
    </article>
  );
}
