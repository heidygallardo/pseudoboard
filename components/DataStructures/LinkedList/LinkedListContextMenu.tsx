'use client';

import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface LinkedListContextMenuProps {
  x: number;
  y: number;
  currentStyle: 'textbook' | 'doodle';
  currentNodeShape: 'rectangle' | 'circle';
  onStyleChange: (style: 'textbook' | 'doodle') => void;
  onNodeShapeChange: (nodeShape: 'rectangle' | 'circle') => void;
  onClose: () => void;
}

const LinkedListContextMenu: React.FC<LinkedListContextMenuProps> = ({
  x,
  y,
  currentStyle,
  currentNodeShape,
  onStyleChange,
  onNodeShapeChange,
  onClose,
}) => {
  return (
    <Box
      position="absolute"
      left={x}
      top={y}
      zIndex={1000}
      bg="white"
      border="1px solid #ccc"
      borderRadius="8px"
      boxShadow="0 4px 12px rgba(0,0,0,0.15)"
      p="8px"
      minW="180px"
      onClick={(e) => e.stopPropagation()}
    >
      <Box display="flex" flexDirection="column" gap="4px">
        <Text fontSize="12px" fontWeight="bold" color="#333" mb="4px">
          Linked List Options
        </Text>
        
        {/* Style Options */}
        <Box>
          <Text fontSize="11px" color="#666" mb="2px">
            Style:
          </Text>
          <Box display="flex" gap="4px">
            <Box
              px="8px"
              py="4px"
              borderRadius="4px"
              bg={currentStyle === 'textbook' ? '#007bff' : '#f0f0f0'}
              color={currentStyle === 'textbook' ? 'white' : '#333'}
              fontSize="11px"
              cursor="pointer"
              onClick={() => onStyleChange('textbook')}
              _hover={{ bg: currentStyle === 'textbook' ? '#0056b3' : '#e0e0e0' }}
            >
              Textbook
            </Box>
            <Box
              px="8px"
              py="4px"
              borderRadius="4px"
              bg={currentStyle === 'doodle' ? '#007bff' : '#f0f0f0'}
              color={currentStyle === 'doodle' ? 'white' : '#333'}
              fontSize="11px"
              cursor="pointer"
              onClick={() => onStyleChange('doodle')}
              _hover={{ bg: currentStyle === 'doodle' ? '#0056b3' : '#e0e0e0' }}
            >
              Doodle
            </Box>
          </Box>
        </Box>

        {/* Node Shape Options */}
        <Box>
          <Text fontSize="11px" color="#666" mb="2px">
            Node Shape:
          </Text>
          <Box display="flex" gap="4px">
            <Box
              px="8px"
              py="4px"
              borderRadius="4px"
              bg={currentNodeShape === 'rectangle' ? '#007bff' : '#f0f0f0'}
              color={currentNodeShape === 'rectangle' ? 'white' : '#333'}
              fontSize="11px"
              cursor="pointer"
              onClick={() => onNodeShapeChange('rectangle')}
              _hover={{ bg: currentNodeShape === 'rectangle' ? '#0056b3' : '#e0e0e0' }}
            >
              Rectangle
            </Box>
            <Box
              px="8px"
              py="4px"
              borderRadius="4px"
              bg={currentNodeShape === 'circle' ? '#007bff' : '#f0f0f0'}
              color={currentNodeShape === 'circle' ? 'white' : '#333'}
              fontSize="11px"
              cursor="pointer"
              onClick={() => onNodeShapeChange('circle')}
              _hover={{ bg: currentNodeShape === 'circle' ? '#0056b3' : '#e0e0e0' }}
            >
              Circle
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LinkedListContextMenu; 