import { onAuthStateChanged, reload } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { auth, database } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Configurar listener para datos del usuario en tiempo real
        const userRef = ref(database, `users/${currentUser.uid}`);
        
        const unsubscribeUserData = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              emailVerified: !!currentUser.emailVerified,
              name: userData.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
              phone: userData.phone || '',
              avatar: userData.avatar || null
            });
          } else {
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              emailVerified: !!currentUser.emailVerified,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
              phone: '',
              avatar: null
            });
          }
          setIsAuth(true);
          setLoading(false);
        });

        return () => unsubscribeUserData();
      } else {
        setUser(null);
        setIsAuth(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    if (isAuth !== true) return;
    if (user?.emailVerified !== false) return;

    let cancelled = false;

    const tick = async () => {
      try {
        if (!auth.currentUser) return;
        await reload(auth.currentUser);
        const verified = !!auth.currentUser.emailVerified;
        if (cancelled) return;
        setUser((prev) => (prev ? { ...prev, emailVerified: verified } : prev));
      } catch (e) {
        console.error('Error auto-refreshing emailVerified:', e);
      }
    };

    tick();
    const id = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isAuth, user?.emailVerified]);

  const checkAuthStatus = () => {
    return isAuth;
  };

  const refreshEmailVerified = async () => {
    if (!auth.currentUser) return false;

    try {
      await reload(auth.currentUser);
      const verified = !!auth.currentUser.emailVerified;
      setUser((prev) => (prev ? { ...prev, emailVerified: verified } : prev));
      return verified;
    } catch (error) {
      console.error('Error al refrescar emailVerified:', error);
      return false;
    }
  };

  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    
    try {
      const { get } = await import('firebase/database');
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUser(prev => ({
          ...prev,
          name: userData.name || prev.name,
          phone: userData.phone || '',
          avatar: userData.avatar || null
        }));
      }
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
    }
  };

  return {
    user,
    loading,
    isAuth,
    checkAuthStatus,
    refreshUserData,
    refreshEmailVerified
  };
};
