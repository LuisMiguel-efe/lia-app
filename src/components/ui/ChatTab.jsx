"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase-config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc,
  Timestamp,
  limit
} from 'firebase/firestore';

// Este componente está diseñado para vivir DENTRO del Menú Principal
export default function ChatTab({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null); // Para auto-scroll

  // 1. Escuchar los mensajes del chat
  useEffect(() => {
    const messagesRef = collection(db, 'chat_messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Auto-scroll al fondo cuando lleguen mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Enviar un mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    setNewMessage(''); // Limpiar input
    await addDoc(collection(db, 'chat_messages'), {
      text: newMessage,
      senderName: user.displayName || 'Anónimo',
      senderId: user.uid,
      createdAt: Timestamp.now(),
    });
  };

  return (
    <div className="flex flex-col h-[350px]"> {/* Altura fija para el modal */}
      {/* 1. Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 rounded-md">
        {isLoading && <p className="text-sm text-gray-500">Cargando chat...</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-[80%] ${msg.senderId === user.uid ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <span className="block text-xs font-semibold opacity-70">
                {msg.senderName}
              </span>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Input de Mensaje */}
      <form onSubmit={handleSendMessage} className="flex mt-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-r-md"
        >
          &gt;
        </button>
      </form>
    </div>
  );
}