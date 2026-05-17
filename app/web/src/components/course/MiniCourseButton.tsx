import type { Course } from "../../types";
import { CoursePartStrip } from "./CoursePartStrip";

interface MiniCourseButtonProps {
  course: Course;
  selected: boolean;
  onSelect: (courseId: string) => void;
}

export function MiniCourseButton({ course, selected, onSelect }: MiniCourseButtonProps) {
  return (
    <button
      className={`mini-course course-card-art-frame ${selected ? "is-selected" : ""}`}
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={`${course.id} ${course.name}を選択`}
      data-course-id={course.id}
      onClick={() => onSelect(course.id)}
    >
      <img className="mini-course-art" src={course.previewAsset} alt={`${course.name}のコースカード`} />
      <CoursePartStrip parts={course.partAssets} />
    </button>
  );
}
