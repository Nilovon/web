export interface ShowcaseController {
  /** Scroll progress through the pinned section, 0..1. */
  progress(): number;
  /** 0 = hero, 1..n = product panels. */
  readonly phase: number;
  readonly phaseCount: number;
  goPhase(index: number): void;
}

/**
 * Drives the pinned showcase from scroll position: which panel is visible,
 * rail highlighting and the figure caption. Works without the 3D scene.
 */
export function initShowcase(section: HTMLElement): ShowcaseController {
  const panels = [...section.querySelectorAll<HTMLElement>('[data-panel]')];
  const railButtons = [...section.querySelectorAll<HTMLButtonElement>('[data-go]')];
  const figLabel = section.querySelector<HTMLElement>('[data-fig-label]');
  const phaseCount = panels.length;
  const moduleCount = phaseCount - 1;
  let phase = 0;

  const progress = () => {
    const box = section.getBoundingClientRect();
    return Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - window.innerHeight)));
  };

  const setPhase = (next: number) => {
    if (next === phase) return;
    phase = next;
    panels.forEach((panel, i) => {
      panel.dataset.state = i === next ? 'active' : i < next ? 'past' : 'future';
      panel.inert = i !== next;
    });
    railButtons.forEach((button, i) => {
      if (i === next) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (figLabel) {
      figLabel.textContent =
        next === 0
          ? 'Fig. 0 — Assembled · drag to rotate'
          : `Fig. ${next} — Exploded view · module ${next} of ${moduleCount}`;
    }
  };

  const update = () => setPhase(Math.min(phaseCount - 1, Math.floor(progress() * phaseCount)));

  const goPhase = (index: number) => {
    const top = section.getBoundingClientRect().top + window.scrollY;
    const span = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((index + 0.5) / phaseCount) * span, behavior: 'smooth' });
  };

  railButtons.forEach((button) => {
    button.addEventListener('click', () => goPhase(Number(button.dataset.go)));
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  return {
    progress,
    get phase() {
      return phase;
    },
    phaseCount,
    goPhase,
  };
}
