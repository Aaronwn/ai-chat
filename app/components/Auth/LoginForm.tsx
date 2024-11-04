"use client";

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      onSuccess?.(); // 登录成功后调用回调
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-email':
            setError('邮箱格式不正确');
            break;
          case 'auth/user-not-found':
            setError('用户不存在');
            break;
          case 'auth/wrong-password':
            setError('密码错误');
            break;
          default:
            setError('登录失败，请稍后重试');
        }
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.(); // Google 登录成功后调用回调
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google 登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">登录</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 rounded-lg ${
            loading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? '登录中...' : '使用 Google 账号登录'}
        </button>
      </div>
    </div>
  );
}