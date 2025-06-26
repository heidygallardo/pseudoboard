'use client';

import { useRef, useState, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import './Grid.css';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { activeTool, zoom, position, setPosition } = useCanvas();
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'move') return;
    setDragging(true);
    setStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || activeTool !== 'move') return;
    setPosition({ x: e.clientX - start.x, y: e.clientY - start.y });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    if (activeTool === 'move') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, start, activeTool]);

  return (
    <div 
      className="canvas-container"
      onMouseDown={handleMouseDown}
      style={{
        cursor: activeTool === 'move' ? (dragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      <div
        className="canvas-background"
        style={{
          backgroundPosition: `${position.x}px ${position.y}px`,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
        }}
      />
      <div
        ref={canvasRef}
        className="canvas-content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
        }}
      >
        {/* Place future nodes or drawings here */}
      </div>
    </div>
  );
};

export default Canvas;
