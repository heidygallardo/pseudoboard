"use client"
import Image from "next/image";
import { Heading } from "@chakra-ui/react";
import Canvas from '@/components/Canvas/Canvas';
import Toolbar from '@/components/Toolbar/Toolbar';
import { CanvasProvider } from '@/contexts/CanvasContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <CanvasProvider>
      <div 
        className={isMobile ? 'logo-mobile' : ''}
        style={!isMobile ? { 
          position: 'fixed', 
          top: '0px',
          left: '24px', 
          zIndex: 9999,
          transform: 'translateY(-74px)'
        } : {}}
      >
        <Image
          src="/icons/transparent.png"
          alt="PseudoBoard"
          width={isMobile ? 180 : 300}
          height={isMobile ? 50 : 70}
          style={{ 
            display: 'block',
            opacity: 0.7
          }}
        />
      </div>
      <Toolbar />
      <Canvas />
    </CanvasProvider>
  );
}
