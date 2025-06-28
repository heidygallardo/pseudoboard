'use client';

import { Box } from '@chakra-ui/react';
import styles from './Toolbar.module.css';
import Image from 'next/image';
import { useCanvas } from '@/contexts/CanvasContext';
import { useState, useRef, useEffect } from 'react';
import TooltipWrapper from './TooltipWrapper';

const Toolbar = () => {
  const { activeTool, setActiveTool, zoom, setZoom, clearAll } = useCanvas();
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
    // Future: Add data structure to canvas
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
      <TooltipWrapper tooltip="Move & Pan">
        <Image
          src="/icons/move.png"
          alt="Move"
          className={`${styles.toolbarIcon} ${activeTool === 'move' ? styles.active : ''}`}
          width={40}
          height={40}
          onClick={() => setActiveTool('move')}
        />
      </TooltipWrapper>
      
      <TooltipWrapper tooltip="Draw">
        <Image
          src="/icons/pencil.png"
          alt="Draw"
          className={`${styles.toolbarIcon} ${activeTool === 'draw' ? styles.active : ''}`}
          width={40}
          height={40}
          onClick={() => setActiveTool('draw')}
        />
      </TooltipWrapper>
      
      <TooltipWrapper tooltip="Eraser">
        <Image
          src="/icons/eraserIcon.png"
          alt="Eraser"
          className={`${styles.toolbarIcon} ${activeTool === 'eraser' ? styles.active : ''}`}
          width={40}
          height={40}
          onClick={() => setActiveTool('eraser')}
        />
      </TooltipWrapper>
      
      <TooltipWrapper tooltip="Text">
        <Image
          src="/icons/texticon.png"
          alt="Text"
          className={`${styles.toolbarIcon} ${activeTool === 'text' ? styles.active : ''}`}
          width={40}
          height={40}
          onClick={() => setActiveTool('text')}
        />
      </TooltipWrapper>
      
      <TooltipWrapper tooltip="Shapes">
        <Image
          src="/icons/shapeicon.png"
          alt="Shapes"
          className={`${styles.toolbarIcon} ${activeTool === 'shape' ? styles.active : ''}`}
          width={40}
          height={40}
          onClick={() => setActiveTool('shape')}
        />
      </TooltipWrapper>
      <div className={styles.dataStructureContainer} ref={dropdownRef}>
        <TooltipWrapper tooltip={getDataStructureLabel()}>
          <Image
            src={getDataStructureIcon()}
            alt={getDataStructureLabel()}
            className={`${styles.toolbarIcon} ${showDataStructureDropdown ? styles.active : ''}`}
            width={40}
            height={40}
            onClick={handleDataStructureClick}
          />
        </TooltipWrapper>
        
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
          </div>
        )}
      </div>
      <TooltipWrapper tooltip="Clear All">
        <Image
          src="/icons/clearallIcon.png"
          alt="Clear All"
          className={styles.toolbarIcon}
          width={40}
          height={40}
          onClick={clearAll}
          style={{ cursor: 'pointer' }}
        />
      </TooltipWrapper>
      <div className={styles.zoomControls}>
        <TooltipWrapper tooltip="Zoom Out">
          <button className={styles.zoomButton} onClick={handleZoomOut}>
            −
          </button>
        </TooltipWrapper>
        <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
        <TooltipWrapper tooltip="Zoom In">
          <button className={styles.zoomButton} onClick={handleZoomIn}>
            +
          </button>
        </TooltipWrapper>
      </div>
    </Box>
  );
};

export default Toolbar;
