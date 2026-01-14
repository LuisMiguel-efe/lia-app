"use client";

import React from 'react';

// --- Iconos SVG (Inclyendo "temporal") ---
// Puedes reemplazar estos con íconos de lucide-react si lo instalas
const icons = {
  'Salón de clase': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 6 8-4 8 4"/>
      <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/>
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/>
      <path d="M18 5v.01"/>
      <path d="M6 5v.01"/>
      <path d="M12 10v.01"/>
    </svg>
  ),
  'Oficina': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      <rect width="20" height="14" x="2" y="6" rx="2"/>
    </svg>
  ),
  'Auditorio': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 8 8 5-8 5-8-5Z"/>
      <path d="M4 13v6l8 5 8-5v-6"/>
      <path d="m12 3-8 5 8 5 8-5Z"/>
    </svg>
  ),
  'temporal': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  'default': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
    </svg>
  )
};

// ¡NUEVA PROP: isHighlighted!
function PuntoInteres({ type, name, coords, isHighlighted }) {
  
  const getIcon = (type) => {
    return icons[type] || icons['default'];
  };

  const getColor = (type) => {
    switch (type) {
      case 'Salón de clase': return 'bg-blue-500 border-blue-700';
      case 'Oficina': return 'bg-green-500 border-green-700';
      case 'Auditorio': return 'bg-purple-500 border-purple-700';
      case 'temporal': return 'bg-gray-400 border-gray-600 animate-pulse';
      default: return 'bg-gray-500 border-gray-700';
    }
  };

  if (!coords) {
    return null;
  }

  // Clases base
  const baseClasses = "absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all";
  const zIndex = type === 'temporal' ? 10 : 5;
  
  // Clases de resaltado (para Etapa 3)
  const highlightClasses = isHighlighted 
    ? "z-20 scale-125" 
    : `z-${zIndex}`;

  return (
    <div
      className={`${baseClasses} ${highlightClasses}`}
      style={{
        top: `${coords.y}%`,
        left: `${coords.x}%`,
      }}
    >
      {/* El Pin */}
      <div className={`relative w-8 h-8 ${getColor(type)} rounded-full border-2 shadow-md flex items-center justify-center text-white`}>
        {getIcon(type)}
        
        {/* El resaltado (si está activo) */}
        {isHighlighted && (
          <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        )}
      </div>
      
      {/* La "pata" del pin */}
      <div className="w-1.5 h-4 bg-gray-700 mx-auto -mt-1 shadow-md"></div>

      {/* La Etiqueta de texto (siempre visible) */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1">
        <span className="block text-xs font-semibold text-gray-900 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          {name}
        </span>
      </div>
    </div>
  );
}

export default PuntoInteres;