import type { Course, ScreenName } from "../../types";
import { CourseCard } from "../course/CourseCard";
import { CourseDetail } from "../course/CourseDetail";
import { MegaButton } from "../ui/MegaButton";
import { Screen } from "../ui/Screen";
import { ScreenHeader } from "../ui/ScreenHeader";

interface MapScreenProps {
  current: ScreenName;
  courses: Course[];
  selectedCourse: Course;
  selectedCourseId: string;
  onNavigate: (screen: ScreenName) => void;
  onSelectCourse: (courseId: string) => void;
}

export function MapScreen({ current, courses, selectedCourse, selectedCourseId, onNavigate, onSelectCourse }: MapScreenProps) {
  return (
    <Screen name="map" current={current} labelledBy="map-title">
      <ScreenHeader
        eyebrow="走りたいコースをえらんでレースに出発しよう！"
        title="マップ一覧"
        titleId="map-title"
        onBack={() => onNavigate("menu")}
        aside={<div className="unlock-badge"><strong>{courses.length}/{courses.length}</strong><span>解放済み</span></div>}
      />
      <div className="map-grid">
        <section className="course-grid" aria-label="コースカード一覧">
          {courses.map((course) => (
            <CourseCard
              course={course}
              selected={course.id === selectedCourseId}
              mode="map"
              onSelect={onSelectCourse}
              key={course.id}
            />
          ))}
        </section>
        <aside className="panel map-detail-panel">
          <CourseDetail course={selectedCourse} variant="map" />
          <div className="button-row">
            <MegaButton action="select-map-course" tone="pink" icon="✓" label="このコース" compact onClick={() => onNavigate("room")} />
            <MegaButton action="room" tone="blue" icon="←" label="チームへ" compact onClick={() => onNavigate("room")} />
          </div>
        </aside>
      </div>
    </Screen>
  );
}
