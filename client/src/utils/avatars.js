export const AVATARS = [
  '🚀', '🦊', '⚡', '🦉', '🎯', '🦁', '🌟', '🦄',
  '🐯', '🐼', '🔥', '👾', '🌈', '💎', '🏆', '🍕',
  '🎸', '🤖', '🐙', '🥑', '✨', '🏎️', '🐉', '🍀'
];

export function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export const KAHOOT_COLORS = [
  {
    name: 'red',
    shape: '',
    bg: 'bg-red-600 hover:bg-red-500',
    border: 'border-red-500',
    ring: 'focus:ring-red-400',
    text: 'text-red-500',
    darkBg: 'bg-red-950/80',
    label: 'Red'
  },
  {
    name: 'blue',
    shape: '',
    bg: 'bg-blue-600 hover:bg-blue-500',
    border: 'border-blue-500',
    ring: 'focus:ring-blue-400',
    text: 'text-blue-500',
    darkBg: 'bg-blue-950/80',
    label: 'Blue'
  },
  {
    name: 'yellow',
    shape: '',
    bg: 'bg-amber-500 hover:bg-amber-400',
    border: 'border-amber-400',
    ring: 'focus:ring-amber-300',
    text: 'text-amber-400',
    darkBg: 'bg-amber-950/80',
    label: 'Yellow'
  },
  {
    name: 'green',
    shape: '',
    bg: 'bg-emerald-600 hover:bg-emerald-500',
    border: 'border-emerald-500',
    ring: 'focus:ring-emerald-400',
    text: 'text-emerald-500',
    darkBg: 'bg-emerald-950/80',
    label: 'Green'
  }
];
