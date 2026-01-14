"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set, onValue, onDisconnect, serverTimestamp, remove } from "firebase/database";
import { auth, db, db_rtdb } from '@/lib/firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario está logueado
        setUser(user);
        // Buscar su documento en Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const firestoreData = { uid: user.uid, ...docSnap.data() };
          setUserData(firestoreData);
          // Nueva lógica de presencia (rtdb)
          const presenceRef = ref(db_rtdb, 'status/' + user.uid);
          const infoConnectedRef = ref(db_rtdb, '.info/connected');
          onValue(infoConnectedRef, (snap) => {
            if (snap.val() === true) {
              // Si estamos conectados
              set(presenceRef, {
                online: true,
                role: firestoreData.role, // Guardamos el rol para filtrar
                name: firestoreData.displayName,
                last_changed: serverTimestamp(),
              });
              // Si nos desconectamos (ej. cerramos el navegador)
              onDisconnect(presenceRef).remove();
            }
          });
          // --- Fin de la Lógica de Presencia ---

        } else {
          // Caso raro: usuario en Auth pero no en Firestore
          console.warn("Usuario autenticado pero sin datos en Firestore.");
          setUserData(null);
        }

      } else {
        // Usuario no está logueado
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- ¡NUEVAS FUNCIONES DE AUTENTICACIÓN! ---

  // Función de Registro
  const signUp = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ¡CRÍTICO! Crear el documento del usuario en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      displayName: displayName,
      email: email,
      role: "Comunidad", // Asignar rol por defecto
      points: 0, // Iniciar puntos
      createdAt: new Date()
    });
    
    // Actualizar estado local (el listener onAuthStateChanged también lo hará)
    setUserData({ 
      uid: user.uid, 
      displayName, 
      email, 
      role: "Comunidad", 
      points: 0 
    });
  };

  // Función de Login
  const logIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    // El listener onAuthStateChanged se encargará de actualizar el estado
  };

  // Función de Logout
  const logOut = async () => {
    if (auth.currentUser) {
      const presenceRef = ref(db_rtdb, 'status/' + auth.currentUser.uid);
      await remove(presenceRef); // Borrado manual
    }
    await signOut(auth);
    // El listener onAuthStateChanged se encargará de limpiar el estado
  };

  const value = {
    user,
    userData,
    loading,
    logIn,   // <-- Exportar
    signUp,  // <-- Exportar
    logOut   // <-- Exportar
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};