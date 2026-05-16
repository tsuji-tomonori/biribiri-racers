import type { ReactNode } from "react";
import type { ScreenName } from "../../types";

interface ScreenProps {
  name: ScreenName;
  current: ScreenName;
  labelledBy: string;
  children: ReactNode;
}

export function Screen({ name, current, labelledBy, children }: ScreenProps) {
  return (
    <section
      className={`screen screen-${name} ${current === name ? "is-active" : ""}`}
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}
