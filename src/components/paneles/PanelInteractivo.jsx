
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase-config';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

function PanelInteractivo({ isOpen, onClose, coords, user }) {
  const [formData, setFormData] = useState({ name: '', type: 'Salón de clase' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Manejador para el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- ¡LÓGICA CLAVE SIN CLOUD FUNCTIONS! ---
  // Se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords || !user || user.role !== 'Reporter') {
      setError('Error: No se puede reportar. Faltan permisos o coordenadas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Iniciar un "Batch Write"
      const batch = writeBatch(db);

      // 2. Tarea A: Crear el nuevo documento en 'reports'
      const reportRef = doc(collection(db, 'reports')); // Crea un ID único
      batch.set(reportRef, {
        name: formData.name,
        type: formData.type,
        location: { mapCoords: coords },
        status: "Pendiente", // Estado inicial
        reportedBy: user.uid, // ID del reportero
        reportedAt: serverTimestamp(),
      });

      // 3. Tarea B: Crear el log de actividad (Awareness)
      const logRef = doc(collection(db, 'activity_log'));
      batch.set(logRef, {
        message: `${user.displayName || 'Un reportero'} reportó un nuevo punto: ${formData.name}`,
        timestamp: serverTimestamp(),
        userId: user.uid,
      });

      // 4. Ejecutar todas las operaciones a la vez
      await batch.commit();

      // Éxito
      setFormData({ name: '', type: 'Salón de clase' }); // Resetear formulario
      onClose(); // Cerrar el panel
      
    } catch (err) {
      console.error("Error al enviar el reporte: ", err);
      setError("No se pudo enviar el reporte. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro semi-transparente */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* El panel deslizable */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 p-6 bg-white rounded-t-2xl shadow-lg z-40"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reportar Nuevo Punto
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Lugar
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Lugar
                  </label>
                  <select
                    name="type"
                    id="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  >
                    <option>Salón de clase</option>
                    <option>Oficina</option>
                    <option>Auditorio</option>
                    <option>Portería</option>
                    <option>Otro</option>
                  </select>
                </div>

                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold
                             disabled:bg-gray-400"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Reporte (+5 Puntos)"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PanelInteractivo; 
