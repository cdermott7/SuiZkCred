'use client';

import { useState, useEffect, useRef } from 'react';

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains('dark-mode'));
    
    // Set up mutation observer to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          setIsDarkMode(document.documentElement.classList.contains('dark-mode'));
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !isDarkMode) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters - more variety for better effect
    const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    
    // Font configuration
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);
    
    // Vertical position for each column
    const drops = Array(columns).fill(1);
    
    // Random starting positions for natural look
    for (let i = 0; i < drops.length; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
    }

    // Animation function
    const draw = () => {
      // Add semi-transparent background to create fade effect
      context.fillStyle = 'rgba(0, 5, 0, 0.05)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Green text
      context.font = `${fontSize}px monospace`;
      
      // Loop through each column
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        
        // Vary the brightness for depth effect
        const brightness = Math.random() * 155 + 100; // 100-255 range
        context.fillStyle = `rgba(0, ${brightness}, 0, 0.8)`;
        
        // Draw the character
        context.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Move to next position or reset if at bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Increment position
        drops[i]++;
      }
    };

    // Animation frame
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode]); // Re-initialize when dark mode changes

  if (!isDarkMode) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
}