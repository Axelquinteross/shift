import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    deleteUser,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { get, ref, remove, set, update } from 'firebase/database';
import { auth, database } from '../config/firebase';

// Registrar nuevo usuario
export const registerUser = async (email, password, name) => {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil del usuario
    await updateProfile(user, {
      displayName: name
    });

    // Guardar datos adicionales en Realtime Database
    const userData = {
      uid: user.uid,
      email: email,
      name: name,
      createdAt: new Date().toISOString(),
      avatar: null,
      phone: ''
    };

    await set(ref(database, `users/${user.uid}`), userData);

    // Enviar email de verificación
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.error('Error sending verification email:', e);
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error en registro:', error);
    let errorMessage = 'Error al registrar usuario';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo electrónico ya está en uso';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
};

export const deleteAccount = async () => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    const uid = auth.currentUser.uid;

    try {
      await remove(ref(database, `users/${uid}`));
    } catch (e) {
      console.error('Error deleting user data from database:', e);
    }

    await deleteUser(auth.currentUser);

    try {
      await AsyncStorage.multiRemove(['savedCards', 'notificationPreferences']);
    } catch (e) {
      console.error('Error clearing AsyncStorage after deleteAccount:', e);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);

    if (error?.code === 'auth/requires-recent-login') {
      return {
        success: false,
        error: 'Por seguridad, volvé a iniciar sesión y luego intentá eliminar la cuenta nuevamente.'
      };
    }

    return { success: false, error: 'No se pudo eliminar la cuenta' };
  }
};

export const resendVerificationEmail = async () => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    await sendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error: 'No se pudo reenviar el correo de verificación' };
  }
};

// Iniciar sesión
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Obtener datos adicionales del usuario desde Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: !!user.emailVerified,
          ...userData
        }
      };
    } else {
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: !!user.emailVerified
        }
      };
    }
  } catch (error) {
    console.error('Error en login:', error);
    let errorMessage = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales inválidas (correo o contraseña incorrectos)';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Usuario deshabilitado';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Inténtalo más tarde';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error: 'Error al cerrar sesión' };
  }
};

// Observar estado de autenticación
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario está autenticado, obtener datos adicionales
      try {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            ...userData
          });
        } else {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      }
    } else {
      // Usuario no está autenticado
      callback(null);
    }
  });
};

// Actualizar perfil del usuario
export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, data);
    
    // Si hay displayName, actualizar también en Auth
    if (data.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: data.name
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return { success: false, error: 'Error al actualizar perfil' };
  }
};

// Restablecer contraseña
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    let errorMessage = 'Error al enviar correo de restablecimiento';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChange,
  updateUserProfile,
  resetPassword,
  resendVerificationEmail
};
