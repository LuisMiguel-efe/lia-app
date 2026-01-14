"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; // Para redirigir

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true); // ¿Es Login o Registro?
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // Solo para registro
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { logIn, signUp } = useAuth(); // Usamos las funciones del Context
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- Lógica de Login ---
        await logIn(email, password);
      } else {
        // --- Lógica de Registro ---
        if (displayName.trim().length < 3) {
          throw new Error("El nombre debe tener al menos 3 caracteres.");
        }
        await signUp(email, password, displayName);
      }
      // Si todo sale bien, redirigimos al mapa
      router.push('/'); 
    } catch (err) {
      setError(err.message || 'Error desconocido. Revisa tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-center text-gray-800">
        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h2>
      
      {/* Campo de Nombre (solo para Registro) */}
      {!isLogin && (
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            Nombre (público)
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      )}

      {/* Campo de Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {/* Campo de Contraseña */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {/* Mensaje de Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Botón de Envío */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 font-semibold text-white bg-blue-600 rounded-md shadow
                   hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Registrarse')}
      </button>

      {/* Botón para cambiar entre Login/Registro */}
      <p className="text-sm text-center">
        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="ml-1 font-medium text-blue-600 hover:underline"
        >
          {isLogin ? 'Regístrate' : 'Inicia Sesión'}
        </button>
      </p>
    </form>
  );
}

export default AuthForm;