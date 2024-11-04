"use client";

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 表单验证
    if (password.length < 6) {
      setError('密码长度至少为6位');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password);
      // 注册成功后的处理
      onSuccess?.();
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof FirebaseError) {
        // 处理具体的 Firebase 错误
        switch (error.code) {
          case 'auth/email-already-in-use':
            setError('该邮箱已被注册');
            break;
          case 'auth/invalid-email':
            setError('邮箱格式不正确');
            break;
          case 'auth/operation-not-allowed':
            setError('邮箱注册功能未启用');
            break;
          case 'auth/weak-password':
            setError('密码强度太弱');
            break;
          default:
            setError('注册失败，请稍后重试');
        }
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">注册</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
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
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
            minLength={6}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
            minLength={6}
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
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </div>
  );
}