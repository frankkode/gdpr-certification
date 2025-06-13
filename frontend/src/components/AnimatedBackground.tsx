// 🖥️ Modern Cyber Background Component
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  lifespan: number;
}

interface ScanLine {
  id: number;
  y: number;
  speed: number;
  height: number;
  opacity: number;
}

const CyberBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const scanLinesRef = useRef<ScanLine[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initialize canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Particle system configuration
  const particleConfig = useMemo(() => ({
    maxParticles: isReducedMotion ? 20 : 60,
    spawnRate: isReducedMotion ? 0.1 : 0.3,
    baseSpeed: 0.2,
    sizeRange: [1, 2],
    opacityRange: [0.05, 0.2],
    lifespanRange: [4000, 10000],
    colors: [
      'rgba(59, 130, 246, 0.7)',   // blue-500
      'rgba(16, 185, 129, 0.7)',   // emerald-500
      'rgba(139, 92, 246, 0.7)',   // violet-500
      'rgba(6, 182, 212, 0.7)',    // cyan-500
    ]
  }), [isReducedMotion]);

  // Scan line configuration
  const scanConfig = useMemo(() => ({
    count: isReducedMotion ? 2 : 5,
    speedRange: [0.3, 0.7],
    heightRange: [1, 3],
    opacityRange: [0.03, 0.08],
    colors: [
      'rgba(59, 130, 246, 0.5)',   // blue
      'rgba(16, 185, 129, 0.5)',    // emerald
    ]
  }), [isReducedMotion]);

  // Create a new particle
  const createParticle = (): Particle => {
    return {
      id: Math.random(),
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * particleConfig.baseSpeed,
      vy: (Math.random() - 0.5) * particleConfig.baseSpeed,
      size: Math.random() * (particleConfig.sizeRange[1] - particleConfig.sizeRange[0]) + particleConfig.sizeRange[0],
      opacity: Math.random() * (particleConfig.opacityRange[1] - particleConfig.opacityRange[0]) + particleConfig.opacityRange[0],
      color: particleConfig.colors[Math.floor(Math.random() * particleConfig.colors.length)],
      lifespan: Math.random() * (particleConfig.lifespanRange[1] - particleConfig.lifespanRange[0]) + particleConfig.lifespanRange[0],
    };
  };

  // Create scan lines
  const createScanLines = () => {
    const lines: ScanLine[] = [];
    for (let i = 0; i < scanConfig.count; i++) {
      lines.push({
        id: Math.random(),
        y: Math.random() * dimensions.height,
        speed: Math.random() * (scanConfig.speedRange[1] - scanConfig.speedRange[0]) + scanConfig.speedRange[0],
        height: Math.random() * (scanConfig.heightRange[1] - scanConfig.heightRange[0]) + scanConfig.heightRange[0],
        opacity: Math.random() * (scanConfig.opacityRange[1] - scanConfig.opacityRange[0]) + scanConfig.opacityRange[0],
      });
    }
    return lines;
  };

  // Update particle physics
  const updateParticle = (particle: Particle, deltaTime: number): Particle => {
    // Apply velocity with damping
    particle.vx *= 0.998;
    particle.vy *= 0.998;
    
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Update lifespan and opacity
    particle.lifespan -= deltaTime;
    particle.opacity = (particle.lifespan / 10000) * particleConfig.opacityRange[1];

    // Wrap around screen edges
    if (particle.x < 0) particle.x = dimensions.width;
    if (particle.x > dimensions.width) particle.x = 0;
    if (particle.y < 0) particle.y = dimensions.height;
    if (particle.y > dimensions.height) particle.y = 0;

    return particle;
  };

  // Update scan lines
  const updateScanLine = (line: ScanLine, deltaTime: number): ScanLine => {
    line.y += line.speed * deltaTime;
    if (line.y > dimensions.height + line.height) {
      line.y = -line.height;
      line.opacity = Math.random() * (scanConfig.opacityRange[1] - scanConfig.opacityRange[0]) + scanConfig.opacityRange[0];
    }
    return line;
  };

  // Draw particle
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.opacity;
    ctx.fillStyle = particle.color;
    
    // Draw simple circle
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // Draw scan line
  const drawScanLine = (ctx: CanvasRenderingContext2D, line: ScanLine) => {
    const gradient = ctx.createLinearGradient(0, line.y, 0, line.y + line.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, scanConfig.colors[Math.floor(Math.random() * scanConfig.colors.length)]);
    gradient.addColorStop(1, 'transparent');
    
    ctx.save();
    ctx.globalAlpha = line.opacity;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, line.y, dimensions.width, line.height);
    ctx.restore();
  };

  // Draw connections between nearby particles
  const drawConnections = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    const connectionDistance = 100;
    
    particles.forEach((particle, i) => {
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.05;
          
          ctx.save();
          ctx.globalAlpha = opacity * Math.min(particle.opacity, other.opacity);
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    });
  };

  // Main animation loop
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || isReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Initialize scan lines
    if (scanLinesRef.current.length === 0) {
      scanLinesRef.current = createScanLines();
    }

    let lastTime = 0;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, 32); // Cap at 32ms to prevent jumps
      lastTime = currentTime;

      // Clear canvas with subtle fade
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)'; // slate-900
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Spawn new particles
      if (Math.random() < particleConfig.spawnRate && particlesRef.current.length < particleConfig.maxParticles) {
        particlesRef.current.push(createParticle());
      }

      // Update and filter particles
      particlesRef.current = particlesRef.current
        .map(particle => updateParticle(particle, deltaTime))
        .filter(particle => particle.lifespan > 0);

      // Update scan lines
      scanLinesRef.current = scanLinesRef.current.map(line => updateScanLine(line, deltaTime));

      // Draw connections first (background layer)
      drawConnections(ctx, particlesRef.current);

      // Draw scan lines
      scanLinesRef.current.forEach(line => {
        drawScanLine(ctx, line);
      });

      // Draw particles (foreground layer)
      particlesRef.current.forEach(particle => {
        drawParticle(ctx, particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, particleConfig, scanConfig, isReducedMotion]);

  // Static fallback for reduced motion preference
  if (isReducedMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 bg-slate-900">
        {/* Very subtle static elements */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Static gradient orbs */}
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"
          style={{ top: '10%', left: '5%' }}
        />
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'rgb(15, 23, 42)' }} // slate-900
      />
      
      {/* Additional CSS-based elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
      </div>
    </>
  );
};

export default CyberBackground;