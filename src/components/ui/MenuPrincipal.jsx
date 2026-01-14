"use client";
import ChatTab from './ChatTab';
import UsuariosTab from './UsuariosTab';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function MenuPrincipal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null); // null, 'trofeos', o 'acerca'
  
  const { userData } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
    setIsOpen(false);
    setModalContent(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setModalContent(null);
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const modalVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };
  
  // --- CORRECCIÓN 1 ---
  // w-100 no es estándar, se cambia por w-96 (24rem)
  // w-80 (20rem) se cambia por w-64 (16rem) para el menú estándar
  const modalWidthClass = (modalContent === 'chat' || modalContent === 'online')
    ? 'w-76' // Más ancho para chat/usuarios
    : 'w-64'; // Ancho estándar para el resto

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* El botón "Hamburguesa" */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-white rounded-full shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Fondo oscuro para cerrar al hacer clic (z-40) */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />

            {/* El Menú */}
            <motion.div
              // --- CORRECCIÓN 2 ---
              // Se usan comillas invertidas (`) y se interpola la variable
              className={`absolute top-12 right-0 ${modalWidthClass} bg-white rounded-lg shadow-xl overflow-hidden z-50`}
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div 
                className={`relative p-4 ${
                  (modalContent === 'chat' || modalContent === 'online')
                    ? 'min-h-[460px]' // Más alto para chat/usuarios
                    : 'min-h-85' // Altura estándar
                }`}
              >
                
                {/* --- Vista Principal del Menú --- */}
                <AnimatePresence>
                  {!modalContent && (
                    <motion.div
                      className="absolute top-0 left-0 w-full p-4"
                      variants={modalVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="flex items-center space-x-3 pb-3 mb-3 border-b">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {userData?.displayName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{userData?.displayName}</p>
                          <p className="text-sm text-gray-500">{userData?.role}</p>
                        </div>
                      </div>
                      
                      <nav className="flex flex-col space-y-2">
                        <button 
                          onClick={() => setModalContent('chat')}
                          className="text-left p-2 hover:bg-gray-100 rounded-md flex items-center"
                        >
                          <span className="mr-2">💬</span> Chat General
                        </button>
                        <button 
                          onClick={() => setModalContent('online')}
                          className="text-left p-2 hover:bg-gray-100 rounded-md flex items-center"
                        >
                          <span className="mr-2">🟢</span> Usuarios Online
                        </button>
                        <button 
                          onClick={() => setModalContent('trofeos')}
                          className="text-left p-2 hover:bg-gray-100 rounded-md"
                        >
                          🏆 Trofeos
                        </button>
                        <button 
                          onClick={() => setModalContent('acerca')}
                          className="text-left p-2 hover:bg-gray-100 rounded-md"
                        >
                          ℹ️ Acerca de LIA
                        </button>
                        <button
                          onClick={handleLogout}
                          className="text-left p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          🚪 Cerrar Sesión
                        </button>
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* --- Vista del Modal (Trofeos o Acerca de) --- */}
                <AnimatePresence>
                  {modalContent && (
                    <motion.div
                      className="absolute top-0 left-0 w-full p-4"
                      variants={modalVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {/* Botón para Volver */}
                      <button 
                        onClick={() => setModalContent(null)}
                        className="text-sm font-semibold text-blue-600 mb-2"
                      >
                        &larr; Volver
                      </button>

                      {/* Contenido de Trofeos */}
                      {modalContent === 'trofeos' && (
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800">🏆 Trofeos y Premios</h4>
                          <p className="mt-2 text-gray-700">Los premios para el podio semanal son:</p>
                          <ul className="mt-3 space-y-2">
                            <li className="flex items-center">
                              <span className="text-3xl mr-2">🥇</span>
                              <div>
                                <p className="font-semibold">1er Puesto</p>
                                <p className="text-sm text-gray-600">20 Horas de seminario</p>
                              </div>
                            </li>
                            <li className="flex items-center">
                              <span className="text-3xl mr-2">🥈</span>
                              <div>
                                <p className="font-semibold">2do Puesto</p>
                                <p className="text-sm text-gray-600">10 Horas de seminario</p>
                              </div>
                            </li>
                            <li className="flex items-center">
                              <span className="text-3xl mr-2">🥉</span>
                              <div>
                                <p className="font-semibold">3er Puesto</p>
                                <p className="text-sm text-gray-600">5 Horas de seminario</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      )}

                      {/* Contenido de Acerca de */}
                      {modalContent === 'acerca' && (
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800">ℹ️ Acerca de LIA</h4>
                          <p className="mt-2 text-gray-700 text-sm">
                            LIA (Localization Intelligent Automated) es un prototipo de sistema colaborativo 
                            que permite a la comunidad reportar, validar y buscar espacios del campus universitario
                            en tiempo real, fomentando la participación a través de gamificación.
                          </p>
                        </div>
                      )}
                      {/* Contenido de Chat General*/}
                      {modalContent === 'chat' && (
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800 mb-2">💬 Chat General</h4>
                          <ChatTab user={userData} />
                        </div>
                      )}
                      {/* Contenido de usuarios online */}
                      {modalContent === 'online' &&(
                        <div>
                          <h4 className='font-semibold text-lg text-gray-800 mb-2'>🟢 Usuarios Online</h4>
                          <UsuariosTab/>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}