import React, { useRef, useState } from 'react';

export default function TiltCard({
  children,
  className = '',
  style = {},
  maxTilt = 4, // Maximum 4 degrees as requested
  glare = true,
  onClick = null
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out rounded-2xl ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        boxShadow: isHovered
          ? '0 8px 24px -4px rgba(29, 26, 57, 0.08)'
          : style.boxShadow || 'none',
        ...style
      }}
    >
      {children}

      {/* Subtle Purple Glare Effect */}
      {glare && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${tilt.y * 10 + 50}% ${tilt.x * 10 + 50}%, rgba(174,68,90,0.08), transparent 70%)`
          }}
        />
      )}
    </div>
  );
}
