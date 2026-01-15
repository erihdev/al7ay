import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface InteractiveBackgroundProps {
  variant?: 'particles' | 'gradient' | 'geometric' | 'waves';
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

export function InteractiveBackground({ 
  variant = 'particles', 
  intensity = 'subtle',
  className = '' 
}: InteractiveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const opacityMap = {
    subtle: 0.3,
    medium: 0.5,
    strong: 0.7,
  };

  const opacity = opacityMap[intensity];

  if (variant === 'particles') {
    return <ParticlesBackground x={x} y={y} opacity={opacity} className={className} />;
  }

  if (variant === 'gradient') {
    return <GradientBackground x={x} y={y} opacity={opacity} className={className} />;
  }

  if (variant === 'geometric') {
    return <GeometricBackground x={x} y={y} opacity={opacity} className={className} />;
  }

  if (variant === 'waves') {
    return <WavesBackground opacity={opacity} className={className} />;
  }

  return null;
}

// Particles Background
function ParticlesBackground({ x, y, opacity, className }: any) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    delay: Math.random() * 2,
  }));

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      {particles.map((particle) => {
        const translateX = useTransform(x, [0, 1], [-30 + particle.initialX, 30 + particle.initialX]);
        const translateY = useTransform(y, [0, 1], [-30 + particle.initialY, 30 + particle.initialY]);

        return (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-primary/40"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.initialX}%`,
              top: `${particle.initialY}%`,
              x: translateX,
              y: translateY,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// Gradient Background
function GradientBackground({ x, y, opacity, className }: any) {
  const gradientX = useTransform(x, [0, 1], ['0%', '100%']);
  const gradientY = useTransform(y, [0, 1], ['0%', '100%']);

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`} style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at var(--x) var(--y), hsl(var(--primary) / 0.3), transparent 50%)`,
          ['--x' as any]: gradientX,
          ['--y' as any]: gradientY,
        }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 0% 0%, hsl(var(--primary) / 0.1), transparent 50%)',
            'radial-gradient(ellipse at 100% 0%, hsl(var(--primary) / 0.1), transparent 50%)',
            'radial-gradient(ellipse at 100% 100%, hsl(var(--primary) / 0.1), transparent 50%)',
            'radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.1), transparent 50%)',
            'radial-gradient(ellipse at 0% 0%, hsl(var(--primary) / 0.1), transparent 50%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Geometric Background
function GeometricBackground({ x, y, opacity, className }: any) {
  const shapes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    type: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'triangle',
    size: Math.random() * 60 + 20,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    rotation: Math.random() * 360,
    delay: Math.random() * 2,
  }));

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      {shapes.map((shape) => {
        const translateX = useTransform(x, [0, 1], [-20, 20]);
        const translateY = useTransform(y, [0, 1], [-20, 20]);

        return (
          <motion.div
            key={shape.id}
            className={`absolute ${
              shape.type === 'circle' 
                ? 'rounded-full' 
                : shape.type === 'square' 
                  ? 'rounded-lg' 
                  : ''
            }`}
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.initialX}%`,
              top: `${shape.initialY}%`,
              x: translateX,
              y: translateY,
              rotate: shape.rotation,
              background: shape.type === 'triangle' 
                ? 'none'
                : 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))',
              borderWidth: shape.type === 'triangle' ? 0 : 1,
              borderColor: 'hsl(var(--primary) / 0.2)',
              clipPath: shape.type === 'triangle' 
                ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                : undefined,
              backgroundColor: shape.type === 'triangle' 
                ? 'hsl(var(--primary) / 0.1)' 
                : undefined,
            }}
            animate={{
              rotate: [shape.rotation, shape.rotation + 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 20 + shape.delay * 5,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 4 + shape.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          />
        );
      })}
    </div>
  );
}

// Waves Background
function WavesBackground({ opacity, className }: any) {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      <svg
        className="absolute bottom-0 left-0 w-full h-1/2"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <motion.path
          fill="hsl(var(--primary) / 0.1)"
          animate={{
            d: [
              'M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
              'M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,144C672,149,768,203,864,213.3C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
              'M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.path
          fill="hsl(var(--primary) / 0.05)"
          animate={{
            d: [
              'M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,192C672,203,768,213,864,208C960,203,1056,181,1152,170.7C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
              'M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,218.7C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
              'M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,192C672,203,768,213,864,208C960,203,1056,181,1152,170.7C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </svg>
      
      {/* Floating orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-xl"
          style={{
            width: 100 + i * 30,
            height: 100 + i * 30,
            left: `${20 + i * 15}%`,
            top: `${10 + i * 10}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

// Simple floating particles for lighter pages
export function FloatingParticles({ count = 15, className = '' }: { count?: number; className?: string }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 3 + 4,
    delay: Math.random() * 2,
  }));

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
