interface CoursePartStripProps {
  parts: string[];
}

export function CoursePartStrip({ parts }: CoursePartStripProps) {
  return (
    <span className="course-part-strip" aria-hidden="true">
      {parts.slice(0, 4).map((src, index) => (
        <img className={`part-strip-${index + 1}`} src={src} alt="" key={src} />
      ))}
    </span>
  );
}
