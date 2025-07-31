'use client';
import { useEffect, useRef } from 'react';

function SplashCursor({
  // You can customize these props if you want
  SIM_RESOLUTION = 84,
  DYE_RESOLUTION = 1440,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 2,
  VELOCITY_DISSIPATION = 3,
  PRESSURE = 0.2,
  PRESSURE_ITERATIONS = 20,
  CURL = 15,
  SPLAT_RADIUS = 0.3,
  SPLAT_FORCE = 9000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 1, g: 0.5, b: 0.5 },
  TRANSPARENT = true
}) {
  const canvasRef = useRef(null);
  let animationFrameId = null; // Stocăm ID-ul pentru a anula animația

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = {
      SIM_RESOLUTION,
      DYE_RESOLUTION,
      CAPTURE_RESOLUTION,
      DENSITY_DISSIPATION,
      VELOCITY_DISSIPATION,
      PRESSURE,
      PRESSURE_ITERATIONS,
      CURL,
      SPLAT_RADIUS,
      SPLAT_FORCE,
      SHADING,
      COLOR_UPDATE_SPEED,
      BACK_COLOR,
      TRANSPARENT,
      PAUSED: false, // Default to not paused
      TRANSPARENT_BACK: false, // Not used directly in props, but part of original config
    };

    const GL = get  WebGLContext(canvas);
    const pointers = [];
    const defaultPointer = new Pointer();
    defaultPointer.id = 0;
    defaultPointer.down = true;
    pointers.push(defaultPointer);

    function getWebGLContext(canvas) {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = canvas.getContext('webgl2', params);
      if (gl) {
        return gl;
      }
      gl = canvas.getContext('webgl', params);
      return gl;
    }

    // Converted from function pointerPrototype() to class Pointer
    class Pointer {
      constructor() {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = [0, 0, 0]; // Initialize color
      }
    }

    const GL_EXTENSIONS = get         )
            return;
        }

        const touches = e.changedTouches;
        let pointer = pointers[0]; // Simplified for single touch handling
        for (let i = 0; i < touches.length; i++) {
          updatePointerUpData(pointer);
        }
    });

    // Event listener for toggling splash effect from SplashToggleButton
    const handleToggleSplash = (event) => {
      config.PAUSED = !event.detail;
      if (!config.PAUSED) {
        if (animationFrameId === null) { // only request if not already running
          animationFrameId = requestAnimationFrame(updateFrame);
        }
      } else {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    };

    // Listen for the custom event from SplashToggleButton
    window.addEventListener('cursorSplashToggle', handleToggleSplash);

    // Initial start of the animation loop based on initial config.PAUSED state
    if (!config.PAUSED) {
      animationFrameId = requestAnimationFrame(updateFrame);
    }

    // Cleanup function: remove event listener and cancel animation frame
    return () => {
      window.removeEventListener('cursorSplashToggle', handleToggleSplash);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    SIM_RESOLUTION,
    DYE_RESOLUTION,
    CAPTURE_RESOLUTION,
    DENSITY_DISSIPATION,
    VELOCITY_DISSIPATION,
    PRESSURE,
    PRESSURE_ITERATIONS,
    CURL,
    SPLAT_RADIUS,
    SPLAT_FORCE,
    SHADING,
    COLOR_UPDATE_SPEED,
    BACK_COLOR,
    TRANSPARENT,
  ]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        pointerEvents: 'none', // Ensure it doesn't block interactions
        width: '100%',
        height: '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}

export default SplashCursor;