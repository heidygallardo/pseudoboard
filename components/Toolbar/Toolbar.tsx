'use client';

import { Box } from '@chakra-ui/react';
import styles from './Toolbar.module.css';
import Image from 'next/image';
import { useCanvas } from '@/contexts/CanvasContext';
import { useState, useRef, useEffect } from 'react';

const Toolbar = () => {
  const { activeTool, setActiveTool, zoom, setZoom } = useCanvas();
  const [showDataStructureDropdown, setShowDataStructureDropdown] = useState(false);
  const [selectedDataStructure, setSelectedDataStructure] = useState<string>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDataStructureIcon = () => {
    switch (selectedDataStructure) {
      case 'array':
        return '/icons/arrayicon.png';
      case 'linkedlist':
        return '/icons/listicon.png';
      case 'binarytree':
        return '/icons/treeicon.png';
      case 'stack':
        return '/icons/stackicon.png';
      case 'queue':
        return '/icons/queue.PNG';
      default:
        return '/icons/DSicon.png';
    }
  };

  const getDataStructureLabel = () => {
    switch (selectedDataStructure) {
      case 'array':
        return 'Array';
      case 'linkedlist':
        return 'Linked List';
      case 'binarytree':
        return 'Binary Tree';
      case 'stack':
        return 'Stack';
      case 'queue':
        return 'Queue';
      default:
        return 'Data Structures';
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.1));
  };

  const handleDataStructureClick = () => {
    setShowDataStructureDropdown(!showDataStructureDropdown);
  };

  const handleDataStructureSelect = (type: string) => {
    console.log(`Selected: ${type}`);
    setSelectedDataStructure(type);
    setShowDataStructureDropdown(false);
    
    // Set the appropriate tool based on selection
    if (type === 'array') {
      setActiveTool('array');
    } else if (type === 'linkedlist') {
      // Future: setActiveTool('linkedlist');
      console.log('Linked list tool not implemented yet');
    } else if (type === 'binarytree') {
      // Future: setActiveTool('binarytree');
      console.log('Binary tree tool not implemented yet');
    } else if (type === 'stack') {
      setActiveTool('stack');
    } else if (type === 'queue') {
      setActiveTool('queue');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDataStructureDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className={styles.dataStructureContainer} ref={dropdownRef}>
        <Image
          src={getDataStructureIcon()}
          alt={getDataStructureLabel()}
          className={`${styles.toolbarIcon} ${(activeTool === 'array' || showDataStructureDropdown) ? styles.active : ''}`}
          width={40}
          height={40}
          onClick={handleDataStructureClick}
        />
        
        {showDataStructureDropdown && (
          <div className={styles.dataStructureDropdown}>
            <div 
              className={styles.dropdownItem}
              onClick={() => handleDataStructureSelect('array')}
            >
              <Image
                src="/icons/arrayicon.png"
                alt="Array"
                width={32}
                height={32}
                className={styles.dropdownIcon}
              />
              <span className={styles.dropdownLabel}>Array</span>
            </div>
            
            <div 
              className={styles.dropdownItem}
              onClick={() => handleDataStructureSelect('linkedlist')}
            >
              <Image
                src="/icons/listicon.png"
                alt="Linked List"
                width={32}
                height={32}
                className={styles.dropdownIcon}
              />
              <span className={styles.dropdownLabel}>Linked List</span>
            </div>
            
            <div 
              className={styles.dropdownItem}
              onClick={() => handleDataStructureSelect('binarytree')}
            >
              <Image
                src="/icons/treeicon.png"
                alt="Binary Tree"
                width={32}
                height={32}
                className={styles.dropdownIcon}
              />
              <span className={styles.dropdownLabel}>Binary Tree</span>
            </div>
            
            <div 
              className={styles.dropdownItem}
              onClick={() => handleDataStructureSelect('stack')}
            >
              <Image
                src="/icons/stackicon.png"
                alt="Stack"
                width={32}
                height={32}
                className={styles.dropdownIcon}
              />
              <span className={styles.dropdownLabel}>Stack</span>
            </div>
            
            <div 
              className={styles.dropdownItem}
              onClick={() => handleDataStructureSelect('queue')}
            >
              <Image
                src="/icons/queue.PNG"
                alt="Queue"
                width={32}
                height={32}
                className={styles.dropdownIcon}
              />
              <span className={styles.dropdownLabel}>Queue</span>
            </div>
          </div>
        )}
      </div>
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
