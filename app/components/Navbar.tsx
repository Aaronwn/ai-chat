"use client";

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './Auth/LoginForm';
import RegisterForm from './Auth/RegisterForm';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    // 可以选择是否在注册成功后自动显示登录框
    // setShowLogin(true);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">AI聊天助手</h1>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {user.email || '用户'}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setShowRegister(false);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  登录
                </button>
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setShowLogin(false);
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  注册
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 登录/注册模态框 */}
      {(showLogin || showRegister) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowRegister(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {showLogin && <LoginForm onSuccess={handleLoginSuccess} />}
            {showRegister && <RegisterForm onSuccess={handleRegisterSuccess} />}
            <div className="mt-4 text-center">
              {showLogin ? (
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  没有账号？点击注册
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  已有账号？点击登录
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}