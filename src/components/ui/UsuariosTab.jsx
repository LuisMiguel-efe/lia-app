"use client";

import React, { useState, useEffect, useMemo } from 'react';
// ¡Importamos ambas bases de datos!
import { db, db_rtdb } from '@/lib/firebase-config';
import { ref, onValue } from 'firebase/database';
import { collection, getDocs, query } from 'firebase/firestore';

// Componente para renderizar un solo usuario
function UserRow({ user, isOnline }) {
  const getRoleColor = (role) => {
    switch(role) {
      case 'Validator': return 'text-blue-500';
      case 'Reporter': return 'text-yellow-600';
      case 'Comunidad': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center space-x-2 p-2">
      <span className={`w-3 h-3 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
      <div className="overflow-hidden">
        <p className={`text-sm font-semibold truncate ${!isOnline && 'text-gray-500 italic'}`}>
          {user.displayName || 'Usuario Sin Nombre'}
        </p>
        <p className={`text-xs font-medium ${getRoleColor(user.role)} ${!isOnline && 'opacity-50'}`}>
          {user.role}
        </p>
      </div>
    </div>
  );
}

// Componente principal del Tab
export default function UsuariosTab() {
  const [allUsers, setAllUsers] = useState([]); // Todos los usuarios (de Firestore)
  const [onlineStatus, setOnlineStatus] = useState({}); // UID: {online: true, ...} (de RTDB)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  // 1. Cargar la lista de TODOS los usuarios (de Firestore)
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        setAllUsers(userList);
      } catch (error) {
        console.error("Error al cargar todos los usuarios:", error);
      } finally {
        setIsLoadingUsers(false); // Actualizar estado de carga 1 vez
      }
    };
    
    fetchAllUsers();
  }, []);

  // 2. Escuchar la RTDB para la presencia (solo estados)
  useEffect(() => {
    const presenceRef = ref(db_rtdb, 'status/');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      setOnlineStatus(snapshot.val() || {}); // Si está vacío, usa {}
      setIsLoadingStatus(false); // Actualziar el estado de carga 2
    });

    return () => unsubscribe();
  }, []);

  // 3. (¡NUEVO!) Usar useMemo para calcular y categorizar las listas
  // Esto se re-ejecuta solo si 'allUsers' o 'onlineStatus' cambian
  const categorizedUsers = useMemo(() => {
    const categories = {
      Validator: { online: [], offline: [] },
      Reporter: { online: [], offline: [] },
      Comunidad: { online: [], offline: [] },
      Otros: { online: [], offline: [] },
    };

    for (const user of allUsers) {
      const role = user.role || 'Otros';
      const isOnline = onlineStatus[user.uid] && onlineStatus[user.uid].online;
      
      if (isOnline) {
        categories[role]?.online.push(user);
      } else {
        categories[role]?.offline.push(user);
      }
    }
    return categories;
  }, [allUsers, onlineStatus]);

  // Función de ayuda para renderizar una sección
  const renderSection = (title, users) => (
    users.length > 0 ? (
      <>
        <h4 className="font-semibold text-gray-800 text-sm mt-3 mb-1 px-2">{title}</h4>
        {users.map(user => <UserRow key={user.uid} user={user} isOnline={true} />)}
      </>
    ) : null
  );
  // Comprobar ambos estados de carga
  const isLoading = isLoadingUsers || isLoadingStatus;
  
  return (
    <div className="flex flex-col h-[350px]"> {/* Altura fija */}
      {isLoading && <p className="text-sm text-gray-500 p-2">Cargando usuarios...</p>}
      
      {!isLoading && (
        <div className="flex-1 overflow-y-auto">
          {/* Renderizar Online por Roles */}
          {renderSection('Validadores (Online)', categorizedUsers.Validator.online)}
          {renderSection('Reporteros (Online)', categorizedUsers.Reporter.online)}
          {renderSection('Comunidad (Online)', categorizedUsers.Comunidad.online)}
          {renderSection('Otros (Online)', categorizedUsers.Otros.online)}

          {/* Renderizar Offline */}
          <h4 className="font-semibold text-gray-800 text-sm mt-4 mb-1 px-2 border-t pt-2">Offline</h4>
          {categorizedUsers.Validator.offline.map(user => <UserRow key={user.uid} user={user} isOnline={false} />)}
          {categorizedUsers.Reporter.offline.map(user => <UserRow key={user.uid} user={user} isOnline={false} />)}
          {categorizedUsers.Comunidad.offline.map(user => <UserRow key={user.uid} user={user} isOnline={false} />)}
          {categorizedUsers.Otros.offline.map(user => <UserRow key={user.uid} user={user} isOnline={false} />)}
        </div>
      )}
    </div>
  );
}