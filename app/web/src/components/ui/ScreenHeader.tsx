import type { ReactNode } from "react";
import { IconButton } from "./IconButton";

interface ScreenHeaderProps {
  eyebrow: string;
  title: string;
  titleId: string;
  onBack: () => void;
  aside?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, titleId, onBack, aside }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <IconButton aria-label="メニューへ戻る" onClick={onBack}>←</IconButton>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
      </div>
      {aside}
    </header>
  );
}
