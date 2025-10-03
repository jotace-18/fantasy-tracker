import { StatNumber } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const euro = (n) => (typeof n === 'number' ? n.toLocaleString('es-ES') : n ?? '-');

export function AnimatedNumber({ value, color, isMoney }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const start = 0;
    const duration = 650;
    const startTs = performance.now();
    let frame;
    const step = (now) => {
      const p = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <StatNumber color={color}>{value == null ? '-' : `${isMoney ? euro(display) : display}${isMoney ? ' €' : ''}`}</StatNumber>
  );
}
