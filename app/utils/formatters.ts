const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(num: number): string {
  if (num === 0) return '0';
  
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  if (tier === 0) return num.toFixed(2);
  
  const suffix = SUFFIXES[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  
  return `${scaled.toFixed(2)}${suffix}`;
} 