// 🌌 Military-Grade Animated Background Component
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
  hue: number;
  type: 'hash' | 'encrypt' | 'signature' | 'key';
  lifespan: number;
  maxLifespan: number;
}

interface CryptoSymbol {
  id: number;
  x: number;
  y: number;
  symbol: string;
  opacity: number;
  scale: number;
  rotation: number;
  color: string;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const symbolsRef = useRef<CryptoSymbol[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Cryptographic symbols for visual effect
  const cryptoSymbols = ['⚡', '🔐', '🛡️', '🔑', '⚿', '◊', '◈', '※', '⌬', '⌭'];
  
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
    maxParticles: 150,
    spawnRate: 0.8,
    baseSpeed: 0.5,
    maxSpeed: 2,
    sizeRange: [1, 4],
    opacityRange: [0.1, 0.6],
    lifespanRange: [3000, 8000],
    mouseInfluenceRadius: 100,
    mouseRepelStrength: 2
  }), []);

  // Create a new particle
  const createParticle = (x?: number, y?: number): Particle => {
    const types: Particle['type'][] = ['hash', 'encrypt', 'signature', 'key'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const lifespan = Math.random() * (particleConfig.lifespanRange[1] - particleConfig.lifespanRange[0]) + particleConfig.lifespanRange[0];
    
    return {
      id: Math.random(),
      x: x ?? Math.random() * dimensions.width,
      y: y ?? Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * particleConfig.baseSpeed,
      vy: (Math.random() - 0.5) * particleConfig.baseSpeed,
      size: Math.random() * (particleConfig.sizeRange[1] - particleConfig.sizeRange[0]) + particleConfig.sizeRange[0],
      opacity: Math.random() * (particleConfig.opacityRange[1] - particleConfig.opacityRange[0]) + particleConfig.opacityRange[0],
      hue: getTypeHue(type),
      type,
      lifespan,
      maxLifespan: lifespan
    };
  };

  // Get hue based on particle type
  const getTypeHue = (type: Particle['type']): number => {
    switch (type) {
      case 'hash': return 240; // Blue
      case 'encrypt': return 120; // Green
      case 'signature': return 300; // Purple
      case 'key': return 60; // Yellow
      default: return 200;
    }
  };

  // Create a new crypto symbol
  const createCryptoSymbol = (): CryptoSymbol => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
    
    return {
      id: Math.random(),
      x: Math.random() * dimensions.width,
      y: dimensions.height + 50,
      symbol: cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)],
      opacity: Math.random() * 0.3 + 0.1,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  };

  // Update particle physics
  const updateParticle = (particle: Particle, deltaTime: number): Particle => {
    // Apply mouse repulsion
    const dx = particle.x - mousePos.x;
    const dy = particle.y - mousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < particleConfig.mouseInfluenceRadius) {
      const force = (particleConfig.mouseInfluenceRadius - distance) / particleConfig.mouseInfluenceRadius;
      const angle = Math.atan2(dy, dx);
      particle.vx += Math.cos(angle) * force * particleConfig.mouseRepelStrength * deltaTime;
      particle.vy += Math.sin(angle) * force * particleConfig.mouseRepelStrength * deltaTime;
    }

    // Apply velocity with damping
    particle.vx *= 0.99;
    particle.vy *= 0.99;
    
    // Limit velocity
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    if (speed > particleConfig.maxSpeed) {
      particle.vx = (particle.vx / speed) * particleConfig.maxSpeed;
      particle.vy = (particle.vy / speed) * particleConfig.maxSpeed;
    }

    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Update lifespan and opacity
    particle.lifespan -= deltaTime;
    particle.opacity = (particle.lifespan / particle.maxLifespan) * particleConfig.opacityRange[1];

    // Wrap around screen edges
    if (particle.x < 0) particle.x = dimensions.width;
    if (particle.x > dimensions.width) particle.x = 0;
    if (particle.y < 0) particle.y = dimensions.height;
    if (particle.y > dimensions.height) particle.y = 0;

    return particle;
  };

  // Update crypto symbol
  const updateCryptoSymbol = (symbol: CryptoSymbol, deltaTime: number): CryptoSymbol => {
    symbol.y -= 0.5 * deltaTime;
    symbol.rotation += 0.5 * deltaTime;
    symbol.opacity *= 0.999;
    
    return symbol;
  };

  // Draw particle with type-specific effects
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    
    // Create gradient based on particle type
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size * 2
    );
    
    const baseColor = `hsl(${particle.hue}, 70%, 60%)`;
    const centerColor = `hsla(${particle.hue}, 70%, 80%, ${particle.opacity})`;
    const edgeColor = `hsla(${particle.hue}, 70%, 60%, 0)`;
    
    gradient.addColorStop(0, centerColor);
    gradient.addColorStop(1, edgeColor);
    
    ctx.fillStyle = gradient;
    
    // Draw different shapes based on type
    switch (particle.type) {
      case 'hash':
        // Hexagon for hash
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = particle.x + Math.cos(angle) * particle.size;
          const y = particle.y + Math.sin(angle) * particle.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'encrypt':
        // Square for encryption
        ctx.fillRect(
          particle.x - particle.size,
          particle.y - particle.size,
          particle.size * 2,
          particle.size * 2
        );
        break;
        
      case 'signature':
        // Triangle for signature
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
        ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'key':
        // Diamond for key
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.lineTo(particle.x - particle.size, particle.y);
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  };

  // Draw crypto symbol
  const drawCryptoSymbol = (ctx: CanvasRenderingContext2D, symbol: CryptoSymbol) => {
    ctx.save();
    ctx.globalAlpha = symbol.opacity;
    ctx.fillStyle = symbol.color;
    ctx.font = `${20 * symbol.scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.translate(symbol.x, symbol.y);
    ctx.rotate((symbol.rotation * Math.PI) / 180);
    ctx.fillText(symbol.symbol, 0, 0);
    
    ctx.restore();
  };

  // Draw connections between nearby particles
  const drawConnections = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    const connectionDistance = 80;
    const maxConnections = 3;
    
    particles.forEach((particle, i) => {
      let connections = 0;
      
      for (let j = i + 1; j < particles.length && connections < maxConnections; j++) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.2;
          
          ctx.save();
          ctx.globalAlpha = opacity * Math.min(particle.opacity, other.opacity);
          ctx.strokeStyle = `hsl(${(particle.hue + other.hue) / 2}, 50%, 60%)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
          ctx.restore();
          
          connections++;
        }
      }
    });
  };

  // Main animation loop
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let lastTime = 0;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clear canvas with trail effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)'; // slate-900 with low opacity
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Spawn new particles
      if (Math.random() < particleConfig.spawnRate && particlesRef.current.length < particleConfig.maxParticles) {
        particlesRef.current.push(createParticle());
      }

      // Spawn new symbols occasionally
      if (Math.random() < 0.01 && symbolsRef.current.length < 10) {
        symbolsRef.current.push(createCryptoSymbol());
      }

      // Update and filter particles
      particlesRef.current = particlesRef.current
        .map(particle => updateParticle(particle, deltaTime))
        .filter(particle => particle.lifespan > 0);

      // Update and filter symbols
      symbolsRef.current = symbolsRef.current
        .map(symbol => updateCryptoSymbol(symbol, deltaTime))
        .filter(symbol => symbol.y > -100 && symbol.opacity > 0.01);

      // Draw connections first (background layer)
      drawConnections(ctx, particlesRef.current);

      // Draw symbols
      symbolsRef.current.forEach(symbol => {
        drawCryptoSymbol(ctx, symbol);
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
  }, [dimensions, mousePos, particleConfig, cryptoSymbols]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'transparent' }}
      />
      
      {/* Additional CSS-based animated elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '10%', left: '5%' }}
        />
        
        <motion.div
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '60%', right: '10%' }}
        />
        
        <motion.div
          className="absolute w-72 h-72 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ bottom: '15%', left: '30%' }}
        />

        {/* Matrix-style binary rain (sparse) */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-green-400 font-mono text-xs"
              style={{ left: `${12.5 * i}%` }}
              animate={{
                y: [-100, window.innerHeight + 100],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5,
              }}
            >
              {Array.from({ length: 20 }).map((_, j) => (
                <div key={j} className="mb-4">
                  {Math.random() > 0.5 ? '1' : '0'}
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(15, 66, 148, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(12, 55, 124, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
    </>
  );
};

export default AnimatedBackground;