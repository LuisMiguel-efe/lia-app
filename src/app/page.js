
"use client"; 

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MapaComunidad from '@/components/mapa/MapaComunidad';
import PanelInteractivo from '@/components/paneles/PanelInteractivo'; 
import PanelValidacion from '@/components/paneles/PanelValidacion';
import PanelComunidad from '@/components/paneles/PanelComunidad'; // ¡NUEVO!
import PanelBusquedasPendientes from '@/components/paneles/PanelBusquedasPendientes';
import MenuPrincipal from '@/components/ui/MenuPrincipal';

export default function Home() {
  const { user, userData, loading } = useAuth();
  
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState(null);
  const [highlightedPin, setHighlightedPin] = useState(null); // <-- AÑADIR ESTO

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg">Cargando LIA...</p>
      </div>
    );
  }

  const handleMapClick = (coords) => {
    if (userData?.role === 'Reporter') {
      setNewPinCoords(coords);
      setIsReportPanelOpen(true); 
    }
  };

  const handleCloseReportPanel = () => {
    setIsReportPanelOpen(false);
    setNewPinCoords(null); 
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-800">
      <MenuPrincipal />

      <MapaComunidad 
        onMapClick={handleMapClick}
        tempPinCoords={newPinCoords}
        highlightedPin={highlightedPin}
      />
      
      {/* --- RENDERIZADO CONDICIONAL POR ROL --- */}
      {/* 3. ¡NUEVO! Panel de Comunidad (Feed y Ranking) */}
      {/* Lo mostramos a todos los usuarios logueados */}
      {userData?.role === 'Comunidad' && (
        <PanelComunidad 
          user={userData}
          onSearchResultClick={setHighlightedPin}
        />
      )}
      {/* 1. Panel para Reporteros (se activa con clic) */}
      {userData?.role === 'Reporter' && (
        <PanelInteractivo
          isOpen={isReportPanelOpen}
          onClose={handleCloseReportPanel}
          coords={newPinCoords}
          user={userData} 
        />
      )}
      {/* 4. Panel para Búsquedas Pendientes (Solo reportero) (siempre disponible) */}
      {userData?.role === 'Reporter' && (
        <PanelBusquedasPendientes user={userData} />
      )}
      
      {/* 2. Panel para Validadores (siempre disponible) */}
      {userData?.role === 'Validator' && (
        <PanelValidacion user={userData} />
      )}


    </main>
  );
} 