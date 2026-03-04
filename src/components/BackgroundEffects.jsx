import { useEffect, useRef } from 'react';

export default function BackgroundEffects() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Create floating glow particles
    const createParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 25000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.1,
          color: Math.random() > 0.5 ? '#00ff88' : '#00d4ff',
          pulseSpeed: Math.random() * 0.02 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    createParticles();

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const pulse = Math.sin(time * p.pulseSpeed * 100 + p.pulsePhase) * 0.3 + 0.7;
        const alpha = p.opacity * pulse;

        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 8);
        gradient.addColorStop(0, p.color + Math.floor(alpha * 60).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, p.color + '00');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 8, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-100" />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay" />

      {/* Radial gradient vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, #000814 70%)',
          opacity: 0.4,
        }}
      />

      {/* Floating particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Blurred glass panels */}
      <div
        className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #00ff88, transparent)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #00d4ff, transparent)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, #6366f1, transparent)',
          filter: 'blur(100px)',
        }}
      />
    </div>
  );
}
