import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleGoogleLogin = async () => {
        if (!email) {
            alert("Por favor ingresa un correo para continuar");
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            alert("Por favor ingresa un correo válido");
            return;
        }

        setIsLoading(true);
        try {
            const user = await db.login(email);
            onLogin(user);
        } catch (error) {
            console.error("Login error", error);
            alert("Error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            
            <div className="mb-8 text-center animate-[fadeIn_0.5s_ease]">
                <h1 className="text-4xl font-bold text-primary-red mb-2">Alhmail Intelligent</h1>
                <p className="text-gray-500">Gestión de correo para ayuda humanitaria</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 animate-[slideUp_0.4s_ease]">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-user-lock text-primary-red text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800">Iniciar Sesión</h2>
                    <p className="text-sm text-gray-400 mt-1">Accede a tu cuenta institucional</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input 
                            type="email" 
                            placeholder="usuario@gmail.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-red focus:ring-2 focus:ring-red-100 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className={`
                            w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 rounded-lg transition-all shadow-sm
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? (
                            <i className="fas fa-circle-notch fa-spin text-primary-red"></i>
                        ) : (
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        )}
                        <span>{isLoading ? 'Autenticando...' : 'Continuar con Google'}</span>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Este es un sistema seguro de Alhmail. <br/>
                        Al continuar aceptas los términos de servicio.
                    </p>
                </div>
            </div>
            
            <div className="mt-8 text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Alhmail System
            </div>
        </div>
    );
};

export default Login;