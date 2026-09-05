import type { Input } from './types';
export function keyboardInput(
  keys: ReadonlySet<string>,
  assist: boolean,
): Input {
  return {
    steer:
      Number(keys.has('ArrowRight') || keys.has('KeyD')) -
      Number(keys.has('ArrowLeft') || keys.has('KeyA')),
    push: keys.has('Space'),
    assist,
  };
}
export class Controls {
  active = false;
  private keys = new Set<string>();
  private held = new Map<number, string>();
  constructor(
    private shortcut: (key: string) => void,
    private onBlur: () => void,
  ) {
    window.addEventListener('keydown', (e) => {
      if (!this.active || e.ctrlKey || e.altKey || e.metaKey) return;
      // Native dialogs retain keyboard activation and Escape behavior.
      if (document.querySelector('dialog[open]')) return;
      if (['ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code))
        e.preventDefault();
      if (!e.repeat && ['Escape', 'KeyR', 'KeyV'].includes(e.code))
        this.shortcut(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.clear();
      this.onBlur();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clear();
        this.onBlur();
      }
    });
    document
      .querySelectorAll<HTMLButtonElement>('[data-control]')
      .forEach((button) => {
        const key = button.dataset['control']!;
        button.addEventListener('pointerdown', (e) => {
          if (!this.active) return;
          e.preventDefault();
          button.setPointerCapture(e.pointerId);
          this.held.set(e.pointerId, key);
          button.classList.add('active');
        });
        const release = (e: PointerEvent): void => {
          this.held.delete(e.pointerId);
          button.classList.remove('active');
        };
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('lostpointercapture', release);
      });
  }
  clear(): void {
    this.keys.clear();
    this.held.clear();
    document
      .querySelectorAll('[data-control]')
      .forEach((b) => b.classList.remove('active'));
  }
  read(assist: boolean): Input {
    const keys = new Set([...this.keys, ...this.held.values()]);
    const input = keyboardInput(keys, assist);
    if (!this.active) return { ...input, steer: 0, push: false };
    try {
      const pad = Array.from(navigator.getGamepads()).find(
        (p) => p?.connected && p.mapping === 'standard',
      );
      if (pad) {
        if (Math.abs(pad.axes[0] ?? 0) > 0.14) input.steer = pad.axes[0]!;
        input.push ||= pad.buttons[0]?.pressed ?? false;
      }
    } catch {
      /* Keyboard and touch remain usable if gamepad access is unavailable. */
    }
    return input;
  }
}
