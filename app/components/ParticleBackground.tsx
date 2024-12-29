import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';

export function ParticleBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="space-particles"
      init={particlesInit}
      className="fixed inset-0 -z-10"
      options={{
        background: {
          color: {
            value: '#000',
          },
        },
        fpsLimit: 60,
        particles: {
          color: {
            value: ['#ffffff', '#77ccff', '#88ffee'],
          },
          move: {
            enable: true,
            direction: 'none',
            outModes: {
              default: 'out',
            },
            random: true,
            speed: 0.1,
            straight: false,
            attract: {
              enable: true,
              rotate: {
                x: 600,
                y: 600,
              },
            },
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 100,
          },
          opacity: {
            animation: {
              enable: true,
              minimumValue: 0.1,
              speed: 0.5,
              sync: false,
            },
            random: {
              enable: true,
              minimumValue: 0.1,
            },
            value: 1,
          },
          shape: {
            type: 'circle',
          },
          size: {
            random: {
              enable: true,
              minimumValue: 0.5,
            },
            value: 1.5,
          },
        },
        detectRetina: true,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: 'grab',
              parallax: {
                enable: true,
                force: 20,
                smooth: 50,
              },
            },
          },
          modes: {
            grab: {
              distance: 200,
              links: {
                opacity: 0.2,
              },
            },
          },
        },
      }}
    />
  );
} 