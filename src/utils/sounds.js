// Auto-generated from taigrr/spank audio directory.
// Maps each mode to its exact MP3 filenames as bundled in src/assets/sounds/.

export const SOUNDS = {
  pain: [
    require('../assets/sounds/pain/00_Ow.mp3'),
    require('../assets/sounds/pain/01_Ouch.mp3'),
    require('../assets/sounds/pain/02_Owwie.mp3'),
    require('../assets/sounds/pain/03_Hey_that_hurts.mp3'),
    require('../assets/sounds/pain/04_Ow_stop_it.mp3'),
    require('../assets/sounds/pain/05_What_was_that_for.mp3'),
    require('../assets/sounds/pain/06_Ow_ow_ow.mp3'),
    require('../assets/sounds/pain/07_Hey.mp3'),
    require('../assets/sounds/pain/08_Yowch.mp3'),
    require('../assets/sounds/pain/09_That_stings.mp3'),
  ],
  halo: [
    require('../assets/sounds/halo/00.mp3'),
    require('../assets/sounds/halo/01.mp3'),
    require('../assets/sounds/halo/02.mp3'),
    require('../assets/sounds/halo/03.mp3'),
    require('../assets/sounds/halo/04.mp3'),
    require('../assets/sounds/halo/05.mp3'),
    require('../assets/sounds/halo/06.mp3'),
    require('../assets/sounds/halo/07.mp3'),
    require('../assets/sounds/halo/08.mp3'),
  ],
  // sexy has 60 escalation levels (00–59) — ported from spank Go source
  sexy: Array.from({ length: 60 }, (_, i) =>
    require(`../assets/sounds/sexy/${String(i).padStart(2, '0')}.mp3`)
  ),
  // lizard mode — single escalation sound, same escalation logic as sexy
  lizard: [
    require('../assets/sounds/lizard/00.mp3'),
  ],
};

// Pain mode labels (for hit log display)
export const PAIN_LABELS = [
  'Ow', 'Ouch', 'Owwie', 'Hey that hurts',
  'Ow stop it', 'What was that for', 'Ow ow ow',
  'Hey', 'Yowch', 'That stings',
];

export const MODE_META = {
  pain:   { label: 'Pain / Ouch',    color: '#E24B4A', description: 'Plays random pain sounds when tapped' },
  sexy:   { label: 'Sexy mode',      color: '#D4537E', description: '60 escalating levels — the more you tap, the wilder it gets' },
  halo:   { label: 'Halo sounds',    color: '#378ADD', description: 'Random Halo death sounds' },
  lizard: { label: 'Lizard mode',    color: '#639922', description: 'Escalating lizard sounds' },
  custom: { label: 'Custom sounds',  color: '#7F77DD', description: 'Play your own MP3 files' },
};
