'use client';

import { Box } from '@chakra-ui/react';
import styles from './Toolbar.module.css';
import Image from 'next/image';
import { useCanvas } from '@/contexts/CanvasContext';

const Toolbar = () => {
  const { activeTool, setActiveTool, zoom, setZoom } = useCanvas();

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.1));
  };

  return (
    <Box className={styles.toolbarContainer}>
      <Image
        src="/icons/move.png"
        alt="Move"
        className={`${styles.toolbarIcon} ${activeTool === 'move' ? styles.active : ''}`}
        width={40}
        height={40}
        onClick={() => setActiveTool('move')}
      />
      <Image
        src="/icons/pencil.png"
        alt="Draw"
        className={`${styles.toolbarIcon} ${activeTool === 'draw' ? styles.active : ''}`}
        width={40}
        height={40}
        onClick={() => setActiveTool('draw')}
      />
      <Image
        src="/icons/texticon.png"
        alt="Text"
        className={`${styles.toolbarIcon} ${activeTool === 'text' ? styles.active : ''}`}
        width={40}
        height={40}
        onClick={() => setActiveTool('text')}
      />
      <Image
        src="/icons/shapeicon.png"
        alt="Shapes"
        className={`${styles.toolbarIcon} ${activeTool === 'shape' ? styles.active : ''}`}
        width={40}
        height={40}
        onClick={() => setActiveTool('shape')}
      />
      <Image
        src="/icons/DSicon.png"
        alt="Data Structures"
        className={`${styles.toolbarIcon} ${activeTool === 'datastructures' ? styles.active : ''}`}
        width={40}
        height={40}
        onClick={() => setActiveTool('datastructures')}
      />
      <div className={styles.zoomControls}>
        <button className={styles.zoomButton} onClick={handleZoomOut}>
          −
        </button>
        <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
        <button className={styles.zoomButton} onClick={handleZoomIn}>
          +
        </button>
      </div>
    </Box>
  );
};

export default Toolbar;
