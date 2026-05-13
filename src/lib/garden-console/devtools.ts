/**
 * garden-console/devtools.ts
 * Console greeting variants (time-based, 12 variants)
 */

const styles = {
  title: 'color: #2d5a27; font-size: 16px; font-weight: bold;',
  body: 'color: #8b7355; font-size: 13px;',
  link: 'color: #666; font-size: 12px;',
  warning: 'color: #c41e3a; font-size: 14px; font-weight: bold;',
};

const repo = 'https://github.com/9scorp4/9scorp4.github.io';
const dejar = 'dejar nombre="..." mensaje="..."';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Chain delayed logs, returns final delay for footer timing
 */
const chain = (steps: Array<[number, () => void]>): number => {
  let delay = 0;
  for (const [wait, fn] of steps) {
    delay += wait;
    setTimeout(fn, delay);
  }
  return delay;
};

const footer = (): void => {
  console.log('%c\nthe code grows here:\n' + repo, styles.body);
  console.log('%cwant to help tend the garden?\nleave a note: ' + dejar, styles.link);
};

// Morning: cool, unhurried (800ms pause before footer)
const morning = [
  () => chain([
    [0, () => console.log("%c🌿 you've found the root system.", styles.title)],
    [800, footer],
  ]),
  () => chain([
    [0, () => console.log("%c🌿 buenos días.", styles.title)],
    [600, () => console.log("%cyou're early.", styles.body)],
    [800, footer],
  ]),
  () => chain([
    [0, () => console.log('%c🌿 the garden wakes up with you.', styles.title)],
    [800, footer],
  ]),
];

// Afternoon: warmer, quicker beats (400-500ms)
const afternoon = [
  () => chain([
    [0, () => console.log('%c🌿 what are you doing here!?', styles.title)],
    [500, () => console.log('%c...gotcha.', styles.body)],
    [400, () => console.log('%cwelcome to the root system.', styles.body)],
    [600, footer],
  ]),
  () => chain([
    [0, () => console.log('%c🌿 caught you peeking at the source.', styles.title)],
    [500, () => console.log("%c...that's encouraged, actually.", styles.body)],
    [600, footer],
  ]),
  () => chain([
    [0, () => console.log('%c🌿 inspecting the roots?', styles.title)],
    [400, () => console.log('%cgood instinct.', styles.body)],
    [600, footer],
  ]),
];

// Evening: contemplative, longer pauses for quotes (1000-1200ms)
const evening = [
  () => chain([
    [0, () => console.log('%c🌿 "the map is not the territory..."', styles.title)],
    [1200, () => console.log("%c    but you've found where the map is drawn.", styles.body)],
    [1000, footer],
  ]),
  () => chain([
    [0, () => console.log('%c🌿 "information is a difference that makes a difference."', styles.title)],
    [1000, () => console.log('%c    — you just made one by looking here.', styles.body)],
    [1000, footer],
  ]),
  () => chain([
    [0, () => console.log('%c🌿 "the pattern which connects."', styles.title)],
    [1000, () => console.log("%c    you're tracing it now.", styles.body)],
    [1000, footer],
  ]),
];

/**
 * Night: maximum chaos, fake loading, dramatic reveals
 */
function createNightVariants(): Array<() => number> {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hour}:${minutes}`;

  return [
    () => chain([
      [0, () => console.log('%c⚠️ UNAUTHORIZED ACCESS DETECTED', styles.warning)],
      [300, () => console.log('%c   TRACING IP ADDRESS...', styles.warning)],
      [400, () => console.log('%c   ALERTING AUTHORITIES...', styles.warning)],
      [600, () => console.log('%c   ...', styles.warning)],
      [800, () => console.log(`%c...just kidding.`, styles.body)],
      [400, () => console.log(`%cit's ${timeStr} and you're reading source code.`, styles.body)],
      [300, () => console.log('%crespect.', styles.body)],
      [800, footer],
    ]),
    () => chain([
      [0, () => console.log('%c⚠️ INTRUDER ALERT', styles.warning)],
      [350, () => console.log('%c   DEPLOYING COUNTERMEASURES...', styles.warning)],
      [450, () => console.log('%c   ████████░░░░░░░░', styles.warning)],
      [300, () => console.log('%c   ████████████░░░░', styles.warning)],
      [300, () => console.log('%c   ████████████████', styles.warning)],
      [600, () => console.log('%c...nah.', styles.body)],
      [400, () => console.log('%cwelcome, night owl.', styles.body)],
      [300, () => console.log(`%cit's ${timeStr}. we're both awake.`, styles.body)],
      [800, footer],
    ]),
    () => chain([
      [0, () => console.log('%c⚠️ SECURITY BREACH IN SECTOR 7G', styles.warning)],
      [400, () => console.log('%c   SCANNING...', styles.warning)],
      [350, () => console.log('%c   SCANNING...', styles.warning)],
      [350, () => console.log('%c   SCANNING...', styles.warning)],
      [500, () => console.log('%c...there is no sector 7G.', styles.body)],
      [500, () => console.log(`%cit's ${timeStr} and the garden doesn't sleep either.`, styles.body)],
      [800, footer],
    ]),
  ];
}

/**
 * Show time-appropriate greeting in devtools console
 */
export function showGreeting(): void {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    pick(morning)();
  } else if (hour >= 12 && hour < 18) {
    pick(afternoon)();
  } else if (hour >= 18 && hour < 23) {
    pick(evening)();
  } else {
    pick(createNightVariants())();
  }
}
