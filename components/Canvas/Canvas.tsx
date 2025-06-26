'use client';

import { useRef, useState, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import './Grid.css';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { activeTool, zoom, position, setPosition, strokes, addStroke } = useCanvas();
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  const getRelativePos = (e: React.MouseEvent | MouseEvent) => {
    const containerRect = canvasRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };
    
    // Get mouse position relative to the container
    const containerX = e.clientX - containerRect.left;
    const containerY = e.clientY - containerRect.top;
    
    // Convert to canvas coordinates (accounting for transform)
    return {
      x: (containerX - position.x) / zoom,
      y: (containerY - position.y) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'move') {
      setDragging(true);
      setStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      const pos = getRelativePos(e);
      setCurrentStroke([pos]);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (activeTool === 'move' && dragging) {
      setPosition({ x: e.clientX - start.x, y: e.clientY - start.y });
    } else if (activeTool === 'draw' && isDrawing) {
      const pos = getRelativePos(e);
      setCurrentStroke(prev => [...prev, pos]);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'move') {
      setDragging(false);
    } else if (activeTool === 'draw' && isDrawing) {
      setIsDrawing(false);
      if (currentStroke.length > 1) {
        addStroke({
          id: Date.now().toString(),
          points: currentStroke,
          color: '#000000',
          width: 2
        });
      }
      setCurrentStroke([]);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, start, activeTool, isDrawing, currentStroke]);

  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <div 
      ref={canvasRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
      style={{
        cursor: activeTool === 'move' ? (dragging ? 'grabbing' : 'grab') : 
                activeTool === 'draw' ? 'crosshair' : 'default',
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
        className="canvas-content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
        }}
      >
        {/* Future content like shapes, text, etc. will go here */}
      </div>
      
      {/* SVG layer for drawings - positioned absolutely in container coordinates */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          overflow: 'visible'
        }}
      >
        <g transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}>
          {/* Render completed strokes */}
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={createPath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.width / zoom}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* Render current stroke being drawn */}
          {isDrawing && currentStroke.length > 1 && (
            <path
              d={createPath(currentStroke)}
              stroke="#000000"
              strokeWidth={2 / zoom}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      </svg>
    </div>
  );
};

export default Canvas;
