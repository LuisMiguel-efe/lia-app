"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import PuntoInteres from './PuntoInteres';

// Recibimos las nuevas props: onMapClick y tempPinCoords
function MapaComunidad({ onMapClick, tempPinCoords, highlightedPin}) { 
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'spaces'), where('status', '==', 'Validado'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const spacesList = [];
      querySnapshot.forEach((doc) => {
        spacesList.push({ id: doc.id, ...doc.data() });
      });
      setSpaces(spacesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al escuchar los espacios: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- ¡NUEVO! ---
  // Manejador de clic en el mapa
  const handleMapClick = (e) => {
    // Calculamos las coordenadas del clic como porcentaje
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Llamamos a la función del padre (page.js)
    onMapClick({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      onClick={handleMapClick} // <-- ¡NUEVO! Evento de Clic
    >
      <Image
        src="/mapa-campus.png"
        alt="Mapa del Campus Universitario"
        fill={true}
        className="object-cover"
        priority
      />

      {/* 1. Puntos validados (como antes) */}
      {!isLoading && spaces.map((space) => (
        <PuntoInteres
          key={space.id}
          type={space.type}
          name={space.name}
          coords={space.location.mapCoords}
          isHighlighted={highlightedPin === space.id}
        />
      ))}
      
      {/* 2. ¡NUEVO! Pin temporal (Awareness para el reportero) */}
      {tempPinCoords && (
        <PuntoInteres
          type="temporal"
          name="Nuevo Punto"
          coords={tempPinCoords}
        />
      )}
    </div>
  );
}

export default MapaComunidad;