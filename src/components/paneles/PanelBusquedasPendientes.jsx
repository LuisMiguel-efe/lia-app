"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase-config';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit // <-- Importar limit
} from 'firebase/firestore';

// --- Sub-componente: Pestaña de Búsquedas ---
function PendingSearchesTab({ pendingSearches, isLoading }) {
  if (isLoading) return <p className="text-gray-500">Cargando búsquedas...</p>;
  
  if (pendingSearches.length === 0) {
    return <p className="text-center text-gray-500">Nadie está buscando nada. ¡Todo al día!</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ¡Ayuda a la comunidad! Si conoces estos lugares, repórtalos en el mapa.
      </p>
      {pendingSearches.map((search) => (
        <div key={search.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-800">{search.searchQuery}</h4>
          <p className="text-sm text-gray-600">Tipo: {search.searchType}</p>
          <p className="text-sm text-gray-500">
            Buscado por: <span className="font-medium text-gray-700">{search.requestedByName}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// --- Sub-componente: Ranking (Gamificación) ---
// Función de ayuda para obtener el icono/número de ranking
function getRankDisplay(index, userId, currentUserID) {
  const isCurrentUser = userId === currentUserID;
  // Clases para el ícono/número
  const baseClasses = "font-bold text-lg flex-shrink-0";

  // Asigna medallas para los primeros 3 puestos
  if (index === 0) return <span className={`${baseClasses} ${isCurrentUser ? 'scale-125' : ''}`}>🥇</span>;
  if (index === 1) return <span className={`${baseClasses} ${isCurrentUser ? 'scale-125' : ''}`}>🥈</span>;
  if (index === 2) return <span className={`${baseClasses} ${isCurrentUser ? 'scale-125' : ''}`}>🥉</span>;
  
  // Devuelve el número para los demás
  return <span className={`${baseClasses} text-gray-500`}>{index + 1}.</span>;
}
// (Copiado de tu PanelComunidad.jsx)
function Leaderboard({ currentUser }) {
  const [topUsers, setTopUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('points', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach(doc => usersList.push({ id: doc.id, ...doc.data() }));
      setTopUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al escuchar users (ranking): ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) return <p className="text-gray-500">Cargando ranking...</p>;

  return (
    <div className="space-y-2">
      {topUsers.map((user, index) => (
        <div 
          key={user.id} 
          className={`flex justify-between items-center p-3 rounded-lg
                      ${user.id === currentUser?.uid ? 'bg-blue-100 border border-blue-300' : 'bg-white border'}`}
        >
          <div className="w-10 shrink-0 flex items-center justify-center">
            {getRankDisplay(index, user.id, currentUser?.uid)}
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="font-medium text-gray-800 truncate">{user.displayName || 'Usuario Anónimo'}</span>
          </div>
          <span className="font-bold text-blue-600">{user.points || 0} pts</span>

        </div>
      ))}
    </div>
  );
}

// Componente pequeño para las pestañas
function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 font-medium text-sm
                  ${isActive 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
    >
      {label}
    </button>
  );
}

// --- Componente Principal ---
function PanelBusquedasPendientes({ user }) {
  const [pendingSearches, setPendingSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tab, setTab] = useState('busquedas'); // 'busquedas' o 'ranking'

  useEffect(() => {
    const searchRef = collection(db, 'searchRequests');
    const q = query(
      searchRef, 
      where('status', '==', 'pendiente'),
      orderBy('createdAt', 'desc') 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const searchesList = [];
      snapshot.forEach(doc => {
        searchesList.push({ id: doc.id, ...doc.data() });
      });
      setPendingSearches(searchesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al escuchar búsquedas pendientes: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-lg z-10"
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={{
        collapsed: { height: "70px" },
        expanded: { height: "50%" } // <-- Altura aumentada para las pestañas
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* --- Vista "Peek" (Colapsada) --- */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">
            Búsquedas Pendientes
          </h3>
          {/* ¡La bolita de notificación se queda! */}
          <span className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white text-xs font-bold rounded-full">
            {pendingSearches.length}
          </span>
        </div>
        {/* ¡Se añade la puntuación! */}
        <span className="font-bold text-gray-700">
          Tus Puntos: {user?.points || 0}
        </span>
      </div>

      {/* --- Vista Expandida --- */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden h-full"
            style={{ height: "calc(100% - 70px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Pestañas */}
            <div className="flex border-b border-gray-200 px-4">
              <TabButton
                label="Búsquedas"
                isActive={tab === 'busquedas'}
                onClick={() => setTab('busquedas')}
              />
              <TabButton
                label="Ranking"
                isActive={tab === 'ranking'}
                onClick={() => setTab('ranking')}
              />
            </div>
            
            {/* Contenido de la Pestaña */}
            <div className="p-4 overflow-y-auto h-full" style={{height: "calc(100% - 41px)"}}>
              {tab === 'busquedas' && (
                <PendingSearchesTab 
                  pendingSearches={pendingSearches} 
                  isLoading={isLoading} 
                />
              )}
              {tab === 'ranking' && <Leaderboard currentUser={user} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PanelBusquedasPendientes;