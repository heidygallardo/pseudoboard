'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import './Grid.css';

const Canvas: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { activeTool, zoom, position, setPosition, strokes, addStroke, updateLiveStroke, userCursors, updateCursor, deleteStroke } = useCanvas();
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);
  const [lastDrawPoint, setLastDrawPoint] = useState<{ x: number; y: number } | null>(null);

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
      const strokeId = `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCurrentStrokeId(strokeId);
      setCurrentStroke([pos]);
      setLastDrawPoint(pos);
    } else if (activeTool === 'eraser') {
      setDragging(true);
      const pos = getRelativePos(e);
      handleErase(pos);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    const pos = getRelativePos(e);
    
    // Always update cursor (throttled internally)
    updateCursor(pos.x, pos.y);

    if (activeTool === 'move' && dragging) {
      // Use requestAnimationFrame for smooth panning
      requestAnimationFrame(() => {
        setPosition({ x: e.clientX - start.x, y: e.clientY - start.y });
      });
    } else if (activeTool === 'draw' && isDrawing && currentStrokeId) {
      // Add point smoothing to reduce jitter
      if (lastDrawPoint) {
        const distance = Math.sqrt(
          Math.pow(pos.x - lastDrawPoint.x, 2) + Math.pow(pos.y - lastDrawPoint.y, 2)
        );
        
        // Only add point if it's moved enough (reduces noise)
        if (distance > 2) {
          const newStroke = [...currentStroke, pos];
          setCurrentStroke(newStroke);
          setLastDrawPoint(pos);
          
          // Update live stroke (optimized internally)
          updateLiveStroke({
            id: currentStrokeId,
            points: newStroke,
            color: '#000000',
            width: 4
          });
        }
      }
    } else if (activeTool === 'eraser' && dragging) {
      handleErase(pos);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'move') {
      setDragging(false);
    } else if (activeTool === 'draw' && isDrawing && currentStrokeId) {
      setIsDrawing(false);
      if (currentStroke.length > 1) {
        // Finalize the stroke
        addStroke({
          id: currentStrokeId,
          points: currentStroke,
          color: '#000000',
          width: 4
        });
      }
      setCurrentStroke([]);
      setCurrentStrokeId(null);
      setLastDrawPoint(null);
    } else if (activeTool === 'eraser') {
      setDragging(false);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, start, activeTool, isDrawing, currentStroke, currentStrokeId, updateCursor, updateLiveStroke, addStroke, position, deleteStroke, strokes, lastDrawPoint]);

  // Eraser functionality
  const handleErase = (pos: { x: number; y: number }) => {
    const eraserRadius = 10; // Eraser size
    
    strokes.forEach(stroke => {
      // Check if any point in the stroke is within eraser radius
      const isHit = stroke.points.some(point => {
        const distance = Math.sqrt(
          Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
        );
        return distance <= eraserRadius;
      });
      
      if (isHit) {
        deleteStroke(stroke.id);
      }
    });
  };

  // Viewport culling helpers
  const getStrokeBounds = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    
    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    return { minX, minY, maxX, maxY };
  };

  const isInViewport = (bounds: { minX: number; minY: number; maxX: number; maxY: number }, pos: { x: number; y: number }, zoomLevel: number) => {
    if (!canvasRef.current) return true;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const viewportMinX = (-pos.x) / zoomLevel;
    const viewportMinY = (-pos.y) / zoomLevel;
    const viewportMaxX = viewportMinX + rect.width / zoomLevel;
    const viewportMaxY = viewportMinY + rect.height / zoomLevel;
    
    // Add padding for stroke width
    const padding = 50;
    
    return !(
      bounds.maxX + padding < viewportMinX ||
      bounds.minX - padding > viewportMaxX ||
      bounds.maxY + padding < viewportMinY ||
      bounds.minY - padding > viewportMaxY
    );
  };

  // Memoized path creation for smooth doodle-like strokes
  const createPath = React.useMemo(() => 
    (points: { x: number; y: number }[]) => {
      if (points.length < 2) return '';
      
      if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
      }
      
      // Create smooth but precise curves
      let path = `M ${points[0].x} ${points[0].y}`;
      
      // Use quadratic curves for smoother lines while maintaining sharpness
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        // Control point is the midpoint for smooth but sharp curves
        const cpx = (p1.x + p2.x) / 2;
        const cpy = (p1.y + p2.y) / 2;
        
        path += ` Q ${p1.x} ${p1.y} ${cpx} ${cpy}`;
      }
      
      // Add the final point
      if (points.length > 1) {
        const lastPoint = points[points.length - 1];
        path += ` T ${lastPoint.x} ${lastPoint.y}`;
      }
      
      return path;
    }, []
  );

  return (
    <div 
      ref={canvasRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
      style={{
        cursor: activeTool === 'move' ? (dragging ? 'grabbing' : 'grab') : 
                activeTool === 'draw' ? 'crosshair' : 
                activeTool === 'eraser' ? 'pointer' : 'default',
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
          {/* Render completed strokes with better performance */}
          {strokes.map((stroke) => {
            // Simple viewport culling - only render strokes that might be visible
            const bounds = getStrokeBounds(stroke.points);
            if (!isInViewport(bounds, position, zoom)) return null;
            
            return (
              <path
                key={stroke.id}
                d={createPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width / zoom}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          
          {/* Render current stroke being drawn */}
          {isDrawing && currentStroke.length > 1 && (
            <path
              d={createPath(currentStroke)}
              stroke="#000000"
              strokeWidth={4 / zoom}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Render other users' cursors */}
          {userCursors.map((cursor) => (
            <g key={cursor.userId}>
              <circle
                cx={cursor.x}
                cy={cursor.y}
                r={8 / zoom}
                fill={cursor.color}
                opacity={0.8}
              />
              <text
                x={cursor.x + 15 / zoom}
                y={cursor.y - 10 / zoom}
                fontSize={12 / zoom}
                fill={cursor.color}
                fontWeight="bold"
              >
                {cursor.userId.slice(-4)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
});

export default Canvas;
