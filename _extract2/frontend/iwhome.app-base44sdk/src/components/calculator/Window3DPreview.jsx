import React from 'react';
import { motion } from 'framer-motion';

export default function Window3DPreview({ config }) {
  const { windowType, ante, color, width, height } = config;

  // Calculate dimensions based on aspect ratio
  const aspectRatio = width / height;
  const baseSize = 300;
  const previewWidth = aspectRatio > 1 ? baseSize : baseSize * aspectRatio;
  const previewHeight = aspectRatio > 1 ? baseSize / aspectRatio : baseSize;

  // Get frame colors based on color selection
  const getFrameColors = () => {
    const woodTexture = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/e5a719543_finestra2ante.png';
    
    switch (color) {
      case 'bianco_pasta':
        return {
          outer: '#f0f0f0',
          inner: '#ffffff',
          shadow: '#d0d0d0',
          texture: null
        };
      case 'bianco_legno':
        return {
          outer: '#E8DCC4',
          inner: '#F5EDD8',
          shadow: '#C4B49A',
          texture: woodTexture
        };
      case 'effetto_legno':
        return {
          outer: '#8B6914',
          inner: '#A17D1F',
          shadow: '#6B5416',
          texture: woodTexture
        };
      default:
        return {
          outer: '#f0f0f0',
          inner: '#ffffff',
          shadow: '#d0d0d0',
          texture: null
        };
    }
  };

  const frameColors = getFrameColors();
  const frameThickness = 28;
  const glassInset = 12;
  
  const [isHovered, setIsHovered] = React.useState(false);

  // Generate individual panes with frame and glass
  const generatePanes = () => {
    const panes = [];
    const numPanes = parseInt(ante);
    const totalWidth = previewWidth - (frameThickness * 2);
    const paneWidth = totalWidth / numPanes;
    
    for (let i = 0; i < numPanes; i++) {
      const xPos = frameThickness + (i * paneWidth);
      
      panes.push(
        <g key={`pane-${i}`}>
          {/* Inner frame for each pane */}
          <rect
            x={xPos}
            y={frameThickness}
            width={paneWidth}
            height={previewHeight - (frameThickness * 2)}
            fill={frameColors.outer}
            stroke={frameColors.shadow}
            strokeWidth="2"
          />
          
          {/* Texture overlay if applicable */}
          {frameColors.texture && (
            <rect
              x={xPos}
              y={frameThickness}
              width={paneWidth}
              height={previewHeight - (frameThickness * 2)}
              fill={`url(#texture-pattern)`}
              opacity={color === 'bianco_legno' ? '0.5' : '0.8'}
            />
          )}
          
          {/* Glass depth - back layer */}
          <rect
            x={xPos + glassInset - 2}
            y={frameThickness + glassInset - 2}
            width={paneWidth - (glassInset * 2) + 4}
            height={previewHeight - (frameThickness * 2) - (glassInset * 2) + 4}
            fill="rgba(180,200,220,0.3)"
          />
          
          {/* Glass area - main */}
          <rect
            x={xPos + glassInset}
            y={frameThickness + glassInset}
            width={paneWidth - (glassInset * 2)}
            height={previewHeight - (frameThickness * 2) - (glassInset * 2)}
            fill="url(#glassGradient)"
            stroke="rgba(160,180,200,0.6)"
            strokeWidth="2"
          />
          
          {/* Glass inner frame shadow */}
          <rect
            x={xPos + glassInset}
            y={frameThickness + glassInset}
            width={paneWidth - (glassInset * 2)}
            height={previewHeight - (frameThickness * 2) - (glassInset * 2)}
            fill="none"
            stroke="rgba(100,120,140,0.3)"
            strokeWidth="1"
          />
          
          {/* Glass highlights - main */}
          <rect
            x={xPos + glassInset + 10}
            y={frameThickness + glassInset + 10}
            width={(paneWidth - (glassInset * 2)) * 0.35}
            height={(previewHeight - (frameThickness * 2) - (glassInset * 2)) * 0.45}
            fill="url(#glassHighlight)"
            opacity="0.8"
            rx="8"
          />
          
          {/* Glass secondary reflection */}
          <rect
            x={xPos + paneWidth - glassInset - 30}
            y={previewHeight - frameThickness - glassInset - 40}
            width="25"
            height="35"
            fill="url(#glassHighlight2)"
            opacity="0.5"
            rx="4"
          />
          
          {/* Hinges on left side of first pane */}
          {i === 0 && (
            <>
              <rect x={xPos + 4} y={frameThickness + 30} width="7" height="22" fill="#3a4556" rx="1.5" />
              <rect x={xPos + 5} y={frameThickness + 31} width="5" height="20" fill="url(#hingeGradient)" rx="1" />
              <circle cx={xPos + 7.5} cy={frameThickness + 41} r="2.5" fill="#2d3748" />
              
              <rect x={xPos + 4} y={previewHeight - frameThickness - 52} width="7" height="22" fill="#3a4556" rx="1.5" />
              <rect x={xPos + 5} y={previewHeight - frameThickness - 51} width="5" height="20" fill="url(#hingeGradient)" rx="1" />
              <circle cx={xPos + 7.5} cy={previewHeight - frameThickness - 41} r="2.5" fill="#2d3748" />
            </>
          )}
          
          {/* Handle on right side of each pane */}
          <g transform={`translate(${xPos + paneWidth - 22}, ${(previewHeight - (frameThickness * 2)) / 2 + frameThickness})`}>
            <rect x="0" y="-28" width="10" height="56" fill="#5a6476" rx="4" />
            <rect x="1" y="-26" width="8" height="52" fill="url(#handleGradient)" rx="3" />
            <ellipse cx="5" cy="0" rx="4" ry="5" fill="#3a4556" />
            <ellipse cx="5" cy="0" rx="2" ry="3" fill="#2d3748" />
          </g>
        </g>
      );
    }
    
    return panes;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-6 py-6"
    >
      <div className="text-center">
        <h4 className="text-lg font-semibold text-[#f8f9fa] mb-1">Anteprima 3D</h4>
        <p className="text-sm text-[#dee2e6]">Visualizzazione realistica del prodotto finito</p>
      </div>

      <div
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          animate={{
            rotateY: [0, 360]
          }}
          transition={{
            duration: isHovered ? 20 : 10,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.6))'
          }}
        >
          <svg
            width={previewWidth + 60}
            height={previewHeight + 60}
            viewBox={`-30 -30 ${previewWidth + 60} ${previewHeight + 60}`}
            style={{
              transform: 'rotateX(-8deg) rotateY(-15deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <defs>
              {/* Glass gradient - more realistic */}
              <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(235,245,255,0.95)" />
                <stop offset="30%" stopColor="rgba(220,238,255,0.9)" />
                <stop offset="70%" stopColor="rgba(210,232,255,0.92)" />
                <stop offset="100%" stopColor="rgba(200,228,255,0.95)" />
              </linearGradient>
              
              {/* Glass highlight */}
              <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              
              {/* Glass secondary highlight */}
              <linearGradient id="glassHighlight2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              
              {/* Handle gradient */}
              <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8a91a0" />
                <stop offset="30%" stopColor="#c1c9d6" />
                <stop offset="70%" stopColor="#c1c9d6" />
                <stop offset="100%" stopColor="#8a91a0" />
              </linearGradient>
              
              {/* Hinge gradient */}
              <linearGradient id="hingeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4a5568" />
                <stop offset="50%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#4a5568" />
              </linearGradient>
              
              {/* Frame gradient */}
              <linearGradient id="frameOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={frameColors.outer} />
                <stop offset="50%" stopColor={frameColors.inner} />
                <stop offset="100%" stopColor={frameColors.shadow} />
              </linearGradient>
              
              {/* Texture pattern */}
              {frameColors.texture && (
                <pattern id="texture-pattern" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                  <image href={frameColors.texture} x="0" y="0" width="150" height="150" preserveAspectRatio="xMidYMid slice" />
                </pattern>
              )}
            </defs>
            
            {/* Outer frame shadow for depth */}
            <rect
              x="-8"
              y="-8"
              width={previewWidth + 16}
              height={previewHeight + 16}
              fill={frameColors.shadow}
              rx="6"
              opacity="0.5"
            />
            
            {/* Main outer frame */}
            <rect
              x="0"
              y="0"
              width={previewWidth}
              height={previewHeight}
              fill="url(#frameOuter)"
              stroke={frameColors.shadow}
              strokeWidth="3"
              rx="4"
            />
            
            {/* Texture overlay on frame */}
            {frameColors.texture && (
              <rect
                x="0"
                y="0"
                width={previewWidth}
                height={previewHeight}
                fill="url(#texture-pattern)"
                opacity={color === 'bianco_legno' ? '0.35' : '0.7'}
                rx="4"
              />
            )}
            
            {/* Inner shadow for frame depth */}
            <rect
              x="0"
              y="0"
              width={previewWidth}
              height={previewHeight}
              fill="none"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="2"
              rx="4"
            />
            
            {/* Generate panes with glass and hardware */}
            {generatePanes()}
            
            {/* Frame highlight for realism */}
            <rect
              x="2"
              y="2"
              width={previewWidth - 4}
              height={previewHeight - 4}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              rx="3"
            />
          </svg>
        </motion.div>
      </div>

      {/* Technical details */}
      <div className="flex flex-wrap justify-center gap-3">
        <div className="bg-[#343a40]/70 backdrop-blur-sm px-4 py-2 rounded-full border border-[#f8f9fa]/20">
          <span className="text-[#f8f9fa] text-sm font-medium">📏 {width} × {height} cm</span>
        </div>
        <div className="bg-[#343a40]/70 backdrop-blur-sm px-4 py-2 rounded-full border border-[#f8f9fa]/20">
          <span className="text-[#f8f9fa] text-sm font-medium">
            {windowType === 'finestra' ? '🪟' : '🚪'} {ante} {ante === '1' ? 'Anta' : 'Ante'}
          </span>
        </div>
        <div className="bg-[#343a40]/70 backdrop-blur-sm px-4 py-2 rounded-full border border-[#f8f9fa]/20">
          <span className="text-[#f8f9fa] text-sm font-medium">🏗️ Telaio Z40</span>
        </div>
      </div>
    </motion.div>
  );
}