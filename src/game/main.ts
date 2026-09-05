import { MACHINES } from './machines';
import { loadAssets, assetUrl } from './assets';
import { Controls } from './input';
import { COLORS } from './physics';
import { Renderer } from './renderer';
import { Session } from './session';
import { Sound } from './audio';
import { TRACKS } from './tracks';
import type { Mode, Options } from './types';

function element<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required UI element: ${selector}`);
  return node;
}
const all = <T extends HTMLElement>(selector: string): T[] =>
  Array.from(document.querySelectorAll<T>(selector));
export function stamp(time: number): string {
  return `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}.${String(Math.floor((time % 1) * 100)).padStart(2, '0')}`;
}
const menu = element('#menu'),
  race = element('#race'),
  startButton = element<HTMLButtonElement>('#start');
const canvas = element<HTMLCanvasElement>('#game'),
  mini = element<HTMLCanvasElement>('#minimap');
const help = element<HTMLDialogElement>('#help'),
  pauseDialog = element<HTMLDialogElement>('#pause-dialog'),
  results = element<HTMLDialogElement>('#results');
const sound = new Sound();
let renderer: Renderer | null = null,
  selected = 0,
  color = 0,
  session: Session | null = null;
let previousFrame = 0,
  hudElapsed = 0,
  noticeUntil = 0,
  resultShown = false;
let helpOpener: HTMLElement | null = null;
const controls = new Controls(
  (key) => {
    if (key === 'Escape') {
      if (session?.phase === 'paused') resume();
      else pause();
    }
    if (key === 'KeyR') {
      session?.returnToStart();
      if (session?.phase === 'racing') announce('スタートから、もういちど！');
    }
    if (key === 'KeyV') toggleCamera();
  },
  () => pause(),
);

async function prepare(): Promise<void> {
  startButton.disabled = true;
  startButton.textContent = 'コースを読み込み中…';
  element('#load-error').hidden = true;
  element('#reload-assets').hidden = true;
  try {
    renderer = new Renderer(canvas, mini, await loadAssets());
    startButton.disabled = false;
    startButton.textContent = 'レース スタート！ ↗';
  } catch {
    element('#load-error').textContent =
      'コース画像を読み込めませんでした。通信を確認して再読み込みしてください。';
    element('#load-error').hidden = false;
    element('#reload-assets').hidden = false;
    startButton.textContent = '画像の読み込み待ち';
  }
}
element('#reload-assets').addEventListener('click', () => void prepare());
all<HTMLButtonElement>('[data-course]').forEach((button) =>
  button.addEventListener('click', () => {
    selected = Number(button.dataset['course']);
    const track = TRACKS[selected]!;
    const preview = element<HTMLImageElement>('#course-preview');
    preview.src = assetUrl(`course-${selected}.webp`);
    preview.alt = `${track.name}のコース全体`;
    element('#route-sign-preview').setAttribute(
      'transform',
      `translate(${track.routeSign.join(' ')})`,
    );
    element('#course-name').textContent = track.name;
    element('#course-level').textContent = track.level;
    element('#course-count').textContent = `0${selected + 1} / 05`;
    all('[data-course]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b === button)),
    );
  }),
);
all<HTMLButtonElement>('[data-color]').forEach((button) =>
  button.addEventListener('click', () => {
    color = Number(button.dataset['color']);
    const m = MACHINES[color]!;
    element('#machine-name').textContent = `${m.name} · ${m.role}`;
    element('#machine-detail').textContent = m.detail;
    element('#machine-stats').textContent =
      `速度 ${Math.round(m.speed * 100)} · 旋回 ${Math.round(m.turn * 100)} · ダッシュ ${Math.round(m.boost * 100)}`;
    all('[data-color]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b === button)),
    );
  }),
);
all<HTMLInputElement>('[name="mode"]').forEach((input) =>
  input.addEventListener('change', () => {
    element<HTMLSelectElement>('#difficulty').disabled =
      input.value === 'practice';
  }),
);

function start(): void {
  if (!renderer || startButton.disabled) return;
  all<HTMLDialogElement>('dialog[open]').forEach((d) => d.close());
  const mode = element<HTMLInputElement>('[name="mode"]:checked').value as Mode;
  const options: Options = {
    mode,
    color,
    assist: element<HTMLInputElement>('#assist').checked,
    difficulty:
      element<HTMLSelectElement>('#difficulty').value === 'normal'
        ? 'normal'
        : 'easy',
  };
  session = new Session(TRACKS[selected]!, options);
  session.start();
  renderer.reset(session);
  controls.clear();
  controls.active = true;
  resultShown = false;
  menu.hidden = true;
  race.hidden = false;
  noticeUntil = 0;
  element('#race-course-name').textContent = session.track.name;
  element('#race-course-number').textContent =
    `COURSE 0${selected + 1} · ${mode === 'practice' ? 'FREE RUN' : '1 LAP'}`;
  element('#announcement').classList.remove('visible');
  element('#coach').hidden = false;
  element('#camera').setAttribute('aria-pressed', 'false');
  const list = element('#racers');
  list.replaceChildren();
  for (const r of session.racers) {
    const row = document.createElement('div');
    row.className = `racer-row ${r.cpu ? '' : 'you'}`;
    row.dataset['racer'] = String(r.id);
    row.style.setProperty('--c', COLORS[r.color]!);
    const rank = document.createElement('strong'),
      dot = document.createElement('i'),
      name = document.createElement('span'),
      kind = document.createElement('small'),
      bar = document.createElement('div');
    dot.style.background = COLORS[r.color]!;
    name.textContent = r.name;
    kind.textContent = r.cpu ? 'CPU' : 'YOU';
    bar.className = 'bar';
    row.append(rank, dot, name, kind, bar);
    list.append(row);
  }
  sound.unlock();
  syncHud();
  canvas.focus();
}
startButton.addEventListener('click', start);
element('#retry').addEventListener('click', start);
element('#retry-pause').addEventListener('click', start);

function home(): void {
  if (session) session.phase = 'menu';
  all<HTMLDialogElement>('dialog[open]').forEach((d) => d.close());
  controls.active = false;
  controls.clear();
  menu.hidden = false;
  race.hidden = true;
  sound.update(0, false);
  startButton.focus();
}
element('#home').addEventListener('click', home);
element('#home-pause').addEventListener('click', home);
function pause(): void {
  if (!session || !['countdown', 'racing'].includes(session.phase)) return;
  session.pause();
  controls.clear();
  pauseDialog.showModal();
  syncHud();
  sound.update(0, false);
}
function resume(): void {
  if (session?.phase !== 'paused') return;
  pauseDialog.close();
  controls.clear();
  session.resume();
  canvas.focus();
  sound.unlock();
}
element('#pause').addEventListener('click', pause);
element('#resume').addEventListener('click', resume);
pauseDialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  resume();
});
results.addEventListener('cancel', (e) => {
  e.preventDefault();
  home();
});
all<HTMLButtonElement>('.help-open').forEach((b) =>
  b.addEventListener('click', () => {
    helpOpener = b;
    help.showModal();
  }),
);
all<HTMLButtonElement>('#help .dialog-close, #help .dialog-done').forEach((b) =>
  b.addEventListener('click', () => help.close()),
);
help.addEventListener('close', () => helpOpener?.focus());
function toggleCamera(): void {
  if (!renderer) return;
  renderer.overview = !renderer.overview;
  element('#camera').setAttribute('aria-pressed', String(renderer.overview));
}
element('#camera').addEventListener('click', toggleCamera);
element('#sound').setAttribute('aria-pressed', 'true');
element('#sound').addEventListener('click', () => {
  sound.enabled = !sound.enabled;
  element('#sound').textContent = sound.enabled ? '♪' : '×';
  element('#sound').setAttribute('aria-pressed', String(sound.enabled));
  if (sound.enabled) sound.unlock();
});
function announce(text: string): void {
  element('#announcement').textContent = text;
  element('#announcement').classList.add('visible');
  noticeUntil = (session?.time ?? 0) + 2;
}
function syncHud(): void {
  const s = session;
  if (!s || s.phase === 'menu') return;
  const r = s.racers[0]!,
    ordered = s.order();
  race.dataset['phase'] = s.phase;
  element('#time').textContent = stamp(s.time);
  element('#speed').textContent = String(
    Math.round(Math.hypot(r.vx, r.vy) * 0.48),
  );
  element('#rank-big').replaceChildren();
  const rank = document.createElement('b'),
    total = document.createElement('span');
  rank.textContent = String(ordered.indexOf(r) + 1);
  total.textContent = `/ ${ordered.length}`;
  element('#rank-big').append(rank, total);
  element('#charge-fill').style.width = `${r.charge * 100}%`;
  element('#charge-label').textContent =
    r.boost > 0 ? 'DASH!' : r.charge >= 0.98 ? 'RELEASE!' : 'CHARGE';
  element('.charge-box').classList.toggle(
    'full',
    r.charge >= 0.98 || r.boost > 0,
  );
  element('#progress').textContent = `${Math.round(r.progress * 100)}%`;
  element('#progress-fill').style.width = `${r.progress * 100}%`;
  element('#hits').textContent = `壁への接触 ${r.hits} 回`;
  for (const [index, racer] of ordered.entries()) {
    const row = element(`[data-racer="${racer.id}"]`);
    row.querySelector('strong')!.textContent = String(index + 1);
    row.querySelector<HTMLElement>('.bar')!.style.width =
      `${racer.progress * 100}%`;
    row.style.opacity = racer.respawn ? '.55' : '1';
    row.querySelector('small')!.textContent =
      racer.shock > 0
        ? 'ビリッ!'
        : racer.respawn > 0
          ? '復帰中'
          : racer.cpu
            ? 'CPU'
            : 'YOU';
    row.classList.toggle('shocked', racer.shock > 0);
    element('#racers').append(row);
  }
  const countdown = element('#countdown');
  countdown.textContent =
    s.phase === 'countdown'
      ? String(Math.max(1, Math.ceil(s.countdown)))
      : s.phase === 'finishing'
        ? 'FINISH!'
        : s.phase === 'racing' && s.time < 0.65 && !r.shock
          ? 'GO!'
          : '';
  countdown.classList.toggle('finish-word', s.phase === 'finishing');
  const coach = element('#coach');
  coach.hidden =
    s.time > 20 || s.phase === 'finishing' || s.phase === 'finished';
  coach.querySelector('b')!.textContent = r.shock
    ? 'ビリッ！ かべに気をつけて'
    : r.respawn
      ? 'もういちど、スタートから！'
      : r.charge > 0.2
        ? '曲がる方向を向いてから、離そう'
        : r.dashCount
          ? 'ナイスダッシュ！'
          : '自動で進みます';
  coach.querySelector('span')!.textContent =
    '← → で旋回。SPACE を押して減速、離してダッシュ。';
  if (s.time > noticeUntil)
    element('#announcement').classList.remove('visible');
  sound.update(r.speed, s.phase === 'racing');
}

function showResults(): void {
  if (!session || resultShown) return;
  resultShown = true;
  controls.active = false;
  controls.clear();
  const s = session,
    order = s.order(),
    winner = order.find((r) => r.finish !== null);
  element('#result-kicker').textContent = s.timeout
    ? 'TIME UP'
    : winner?.id === 0
      ? 'YOU WIN!'
      : 'RACE FINISHED';
  element('#result-title').textContent = winner
    ? winner.id === 0
      ? 'やったね、ゴール！'
      : `${winner.name}の勝利！`
    : '次こそ、ゴールへ！';
  element('#result-subtitle').textContent =
    s.options.mode === 'practice'
      ? '完走おめでとう！ 次はノーミスを目指そう。'
      : s.timeout
        ? '180秒が経過しました。練習モードで走り込もう。'
        : '最初にゴールしたレーサーの勝利！';
  const list = element('#result-list');
  list.replaceChildren();
  order.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'result-row';
    const rank = document.createElement('strong'),
      dot = document.createElement('i'),
      name = document.createElement('b'),
      value = document.createElement('span'),
      stat = document.createElement('small');
    rank.textContent = String(i + 1);
    dot.style.background = COLORS[r.color]!;
    name.textContent = `${r.name}${r.cpu ? ' (CPU)' : ''}`;
    value.textContent =
      r.finish !== null
        ? stamp(r.finish)
        : `未完走 · ${Math.round(r.progress * 100)}%`;
    stat.textContent = `接触 ${r.hits} 回 / ダッシュ ${r.dashCount} 回`;
    value.append(document.createElement('br'), stat);
    row.append(rank, dot, name, value);
    list.append(row);
  });
  results.showModal();
  sound.update(0, false);
}

function frame(now: number): void {
  const delta = Math.min((now - (previousFrame || now)) / 1000, 0.25);
  previousFrame = now;
  if (session && renderer && session.phase !== 'menu') {
    const events = session.update(delta, controls.read(session.options.assist));
    for (const e of events) {
      renderer.event(e, session);
      if (e.racer === 0 || e.type === 'finish') sound.effect(e.type);
      if (e.racer === 0 && e.type === 'collision')
        announce('ビリッ！ かべに接触 — スタートへ');
    }
    renderer.draw(session, session.phase === 'paused' ? 0 : delta);
    hudElapsed += delta;
    if (hudElapsed >= 0.1) {
      hudElapsed = 0;
      syncHud();
    }
    if (session.phase === 'finished') {
      syncHud();
      showResults();
    }
  }
  requestAnimationFrame(frame);
}
void prepare();
requestAnimationFrame(frame);
