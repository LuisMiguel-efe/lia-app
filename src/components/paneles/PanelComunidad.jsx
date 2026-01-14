"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase-config';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  Timestamp,
  where,
  addDoc,
  doc,
  writeBatch,
  increment
} from 'firebase/firestore';

// --- Sub-componente: Feed de Actividad (Sin cambios) ---
function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const logRef = collection(db, 'activity_log');
    const q = query(logRef, orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesList = [];
      snapshot.forEach(doc => activitiesList.push({ id: doc.id, ...doc.data() }));
      setActivities(activitiesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al escuchar activity_log: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) return <p className="text-gray-500">Cargando actividad...</p>;
  if (activities.length === 0) return <p className="text-gray-500">No hay actividad reciente.</p>;

  return (
    <ul className="space-y-3">
      {activities.map(activity => (
        <li key={activity.id} className="text-sm text-gray-700 p-2 bg-gray-100 rounded-md">
          {activity.message}
          <span className="block text-xs text-gray-500 mt-1">
            {activity.timestamp ? new Date(activity.timestamp.toDate()).toLocaleString() : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

// --- Sub-componente: Ranking (Sin cambios) ---
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

function Leaderboard({ user }) {
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
                      ${user.id === user?.uid ? 'bg-blue-100 border border-blue-300' : 'bg-white border'}`}
        >
          {/* --- MODIFICACIÓN DE RENDERIZADO --- */}
          <div className="w-10 shrink-0 flex items-center justify-center">
            {/* Llama a la nueva función de ayuda */}
            {getRankDisplay(index, user.id, user?.uid)}
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="font-medium text-gray-800 truncate">{user.displayName || 'Usuario Anónimo'}</span>
          </div>
          <span className="font-bold text-blue-600">{user.points || 0} pts</span>
          {/* --- FIN DE MODIFICACIÓN --- */}

        </div>
      ))}
    </div>
  );
}


// --- ¡NUEVO SUB-COMPONENTE: Pestaña de Búsqueda! (Sin cambios) ---
function TabBuscar({ user, spaces, onSearchResultClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Salón de clase');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Filtra los espacios existentes
  const results = useMemo(() => {
    if (!searchQuery) return [];
    return spaces.filter(space => 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      space.type === searchType
    );
  }, [searchQuery, searchType, spaces]);

  const handlePublishSearch = async () => {  
    if (!searchQuery || isPublishing || !user) return;
    setIsPublishing(true);
    // Crear el writeBanch
    const batch = writeBatch(db);
  
    try {
      const searchRef = doc(collection(db, 'searchRequests'));

      batch.set(searchRef, {
        requestedBy: user.uid,
        requestedByName: user.displayName || 'Usuario anónimo',
        searchQuery: searchQuery,
        searchType: searchType,
        status: 'pendiente',
        createdAt: Timestamp.now()
      });
      // 4. Sumar puntos al Usuario (1 Pts)
      const usuarioRef = doc(db, 'users', user.uid);
      batch.update(usuarioRef, { points: increment(1) }); // Usar increment
      
      await batch.commit();
      setSearchQuery(''); // Limpiar
    } catch (error) {
      console.error("Error al publicar búsqueda:", error);
    } finally {
      setIsPublishing(false);
    }

  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label htmlFor="searchType" className="block text-sm font-medium text-gray-700">Tipo de Lugar</label>
        <select
          id="searchType"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option>Salón de clase</option>
          <option>Oficina</option>
          <option>Auditorio</option>
          <option>Portería</option>
          <option>Otro</option>
        </select>
      </div>
      <div>
        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700">Nombre del Lugar</label>
        <input
          type="text"
          id="searchQuery"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ej: Salón 315 FIET"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div className="pt-2">
        {searchQuery && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Resultados:</h4>
            {results.map(space => (
              <div key={space.id} className="p-2 bg-gray-50 rounded-md">
                <p className="font-medium">{space.name}</p>
                <button 
                onClick={() => onSearchResultClick(space.id)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Resaltar en el mapa
              </button>
              </div>
            ))}
          </div>
        )}
        
        {searchQuery && results.length === 0 && (
          <div className="text-center p-4 bg-gray-50 rounded-md">
            <p className="text-gray-600">No se encontró {searchQuery}.</p>
            <button
              onClick={handlePublishSearch}
              disabled={isPublishing}
              className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isPublishing ? 'Publicando...' : 'Publicar Búsqueda (+1 Punto)'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Un Reportero o Validador será notificado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ¡NUEVO SUB-COMPONENTE: Pestaña Mis Búsquedas! (¡CORREGIDO!) ---
function TabMisBusquedas({ user }) {
  const [mySearches, setMySearches] = useState([]);
  
  // --- ¡AQUÍ ESTÁ LA CORRECCIÓN 1! ---
  // El estado inicial de 'isLoading' depende de si 'user' existe.
  // Si no hay usuario, no hay nada que cargar (isLoading: false).
  // Si SÍ hay usuario, entonces SÍ estamos cargando (isLoading: true).
  const [isLoading, setIsLoading] = useState(() => !!user); // Convierte 'user' a booleano

  useEffect(() => {
    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN 2! ---
    // Si no hay usuario, el estado inicial ya es 'false',
    // así que no hacemos nada. Simplemente salimos del efecto.
    if (!user) {
      return; // No hay llamada a setIsLoading aquí.
    }

    // Si llegamos aquí, 'user' existe y 'isLoading' es 'true'.
    // Iniciamos la carga asíncrona.
    const q = query(
      collection(db, 'searchRequests'), 
      where('requestedBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    // El 'onSnapshot' es asíncrono, por lo que estas llamadas
    // a setIsLoading(false) SÍ son correctas.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMySearches(list);
      setIsLoading(false); // Correcto (dentro de un callback)
    }, (error) => {
      console.error("Error al escuchar mis búsquedas:", error);
      setIsLoading(false); // Correcto (dentro de un callback)
    });
    
    return () => unsubscribe();
  }, [user]); // El 'user' sigue siendo la dependencia correcta

  // El resto de la lógica de renderizado no cambia
  if (isLoading) return <p>Cargando mis búsquedas...</p>;
  if (!user) return <p>Inicia sesión para ver tus búsquedas.</p>;
  if (mySearches.length === 0) return <p className="text-center text-gray-500">No has publicado ninguna búsqueda.</p>;

  return (
    <div className="p-4 space-y-3">
      {mySearches.map(search => (
        <div key={search.id} className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">{search.searchQuery}</span>
            <span 
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                search.status === 'pendiente' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
              }`}
            >
              {search.status === 'pendiente' ? 'Pendiente' : 'Resuelta'}
            </span>
          </div>
          <p className="text-sm text-gray-500">{search.searchType}</p>
        </div>
      ))}
    </div>
  );
}

// --- Panel Principal (Contenedor) (Sin cambios) ---
function PanelComunidad({ user, onSearchResultClick }) { 
  const [tab, setTab] = useState('buscar'); // <-- Estado inicial cambiado a 'buscar'
  const [isExpanded, setIsExpanded] = useState(false);
  const [spaces, setSpaces] = useState([]); 

  // ¡NUEVO EFECTO para cargar los spaces para la búsqueda!
  useEffect(() => {
    const q = query(collection(db, 'spaces'), where('status', '==', 'Validado'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpaces(list);
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
        expanded: { height: "60%" } // <-- Altura aumentada para más pestañas
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* --- Vista "Peek" (Colapsada) --- */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-gray-900">
          Comunidad {isExpanded ? `(${tab.charAt(0).toUpperCase() + tab.slice(1)})` : ''}
        </h3>
        <span className="font-bold text-gray-700">
          Tus Puntos: {user?.points || 0}
        </span>
      </div>

      {/* --- Vista Expandida (con Pestañas) --- */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden h-full"
            style={{ height: "calc(100% - 70px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Pestañas (¡ACTUALIZADAS!) */}
            <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
              <TabButton
                label="Buscar"
                isActive={tab === 'buscar'}
                onClick={() => setTab('buscar')}
              />
              <TabButton
                label="Mis Búsquedas"
                isActive={tab === 'mis-busquedas'}
                onClick={() => setTab('mis-busquedas')}
              />
              <TabButton
                label="Actividad"
                isActive={tab === 'actividad'}
                onClick={() => setTab('actividad')}
              />
              <TabButton
                label="Ranking"
                isActive={tab === 'ranking'}
                onClick={() => setTab('ranking')}
              />
            </div>
            
            {/* Contenido de la Pestaña (¡ACTUALIZADO!) */}
            <div className="p-4 overflow-y-auto h-full" style={{height: "calc(100% - 41px)"}}>
              {tab === 'buscar' && <TabBuscar user={user} spaces={spaces} onSearchResultClick={onSearchResultClick} />}
              {tab === 'mis-busquedas' && <TabMisBusquedas user={user} />}
              {tab === 'actividad' && <ActivityFeed />}
              {tab === 'ranking' && <Leaderboard user={user} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Componente pequeño para las pestañas (Sin cambios)
function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 font-medium text-sm whitespace-nowrap
                  ${isActive 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
    >
      {label}
    </button>
  );
}

export default PanelComunidad;