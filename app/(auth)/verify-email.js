import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { logoutUser, resendVerificationEmail } from '../../services/authService';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, refreshEmailVerified } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    try {
      setLoading(true);
      const result = await resendVerificationEmail();
      if (!result?.success) {
        Alert.alert('Error', result?.error ?? 'No se pudo reenviar el correo');
        return;
      }
      Alert.alert('Listo', 'Te enviamos un correo para verificar tu cuenta. Revisá tu inbox (y spam).');
    } catch (e) {
      console.error('Error resending verification email:', e);
      Alert.alert('Error', 'No se pudo reenviar el correo');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    try {
      setLoading(true);
      const verified = await refreshEmailVerified();
      if (!verified) {
        Alert.alert('Aún no verificado', 'Todavía no aparece como verificada. Abrí el correo y tocá el link de verificación.');
        return;
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Error checking verification:', e);
      Alert.alert('Error', 'No se pudo verificar el estado. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Error logout:', e);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificá tu cuenta</Text>
      <Text style={styles.subtitle}>
        Te enviamos un correo de verificación a:{'\n'}
        <Text style={styles.email}>{user?.email ?? 'tu email'}</Text>
      </Text>

      <Text style={styles.help}>
        Abrí el correo y tocá el botón/link de verificación. Luego volvés acá y tocás “Ya verifiqué”.
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResend}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Reenviar correo</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
        onPress={handleCheck}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Ya verifiqué (revisar)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} disabled={loading}>
        <Text style={styles.link}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#444',
    marginBottom: 10,
    lineHeight: 20,
  },
  email: {
    fontWeight: '700',
  },
  help: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#8B0000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#8B0000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#8B0000',
    textAlign: 'center',
    marginTop: 18,
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
