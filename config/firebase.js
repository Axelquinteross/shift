import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase - REEMPLAZA CON TUS PROPIAS CREDENCIALES
const firebaseConfig = {
  apiKey: "AIzaSyBWNbYfl5FNWKl6w-P7q_8DhQCXG-m9rgE",
  authDomain: "shift-38cd5.firebaseapp.com",
  databaseURL: "https://shift-38cd5-default-rtdb.firebaseio.com",
  projectId: "shift-38cd5",
  storageBucket: "shift-38cd5.appspot.com",
  messagingSenderId: "1067383889006",
  appId: "1:1067383889006:web:ef4bf08b0f3b84e83a9a7f"
};

// Inicializar Firebase solo si no existe
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar Auth con persistencia para React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar servicios
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
