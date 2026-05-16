import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "pink" | "blue" | "teal" | "green" | "yellow" | "disabled";

interface MegaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone: Tone;
  icon: ReactNode;
  label: string;
  description?: string;
  action?: string;
  compact?: boolean;
  full?: boolean;
}

export function MegaButton({
  tone,
  icon,
  label,
  description,
  action,
  compact = false,
  full = false,
  className = "",
  ...buttonProps
}: MegaButtonProps) {
  const classes = ["mega-button", tone, compact ? "compact" : "", full ? "full" : "", className]
    .filter(Boolean)
    .join(" ");
  const { "aria-label": ariaLabel, ...restButtonProps } = buttonProps;

  return (
    <button className={classes} type="button" data-action={action} aria-label={ariaLabel ?? label} {...restButtonProps}>
      <span className="button-icon" aria-hidden="true">{icon}</span>
      <span>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </button>
  );
}
