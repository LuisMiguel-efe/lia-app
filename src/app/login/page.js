"use client";

import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

// Esta página es un simple contenedor centrado para el formulario
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-xl">
        {/* Logo (opcional) */}
        <div className="text-center">
          <span className="text-3xl font-bold text-blue-600">LIA</span>
          <p className="text-gray-600">Localización Inteligente Automatizada</p>
        </div>
        
        {/* El componente de formulario */}
        <AuthForm />
      </div>
    </div>
  );
}
