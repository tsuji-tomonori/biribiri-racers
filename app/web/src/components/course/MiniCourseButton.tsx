import type { CSSProperties } from "react";
import type { Course } from "../../types";
import { CoursePartStrip } from "./CoursePartStrip";

interface MiniCourseButtonProps {
  course: Course;
  selected: boolean;
  onSelect: (courseId: string) => void;
}

type CourseImageStyle = CSSProperties & {
  "--card-course-image"?: string;
};

export function MiniCourseButton({ course, selected, onSelect }: MiniCourseButtonProps) {
  const style: CourseImageStyle = {
    "--card-course-image": `url("${course.previewAsset}")`,
  };

  return (
    <button
      className={`mini-course ${selected ? "is-selected" : ""}`}
      type="button"
      role="option"
      aria-selected={selected}
      data-course-id={course.id}
      onClick={() => onSelect(course.id)}
    >
      <span className="mini-course-thumb" style={style} />
      <CoursePartStrip parts={course.partAssets} />
      <b>{course.id}</b>
      <strong>{course.name}</strong>
    </button>
  );
}
