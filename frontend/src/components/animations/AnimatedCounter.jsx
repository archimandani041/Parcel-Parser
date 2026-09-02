import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numericValue = typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

    let startTimestamp = null;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (numericValue - startValue) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formatted = typeof value === 'number'
    ? displayValue.toLocaleString('en-IN')
    : displayValue.toString();

  return (
    <span className={`inline-block font-mono tracking-tight ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
