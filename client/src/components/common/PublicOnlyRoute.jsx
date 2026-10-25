import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

export default function PublicOnlyRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    const redirectParam = searchParams.get('redirect');
    const destination = redirectParam ? decodeURIComponent(redirectParam) : (isAdmin ? '/admin' : '/dashboard');
    return <Navigate to={destination} replace />;
  }

  return children;
}
