import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginUser } from '../../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        if (result?.user?.emailVerified === false) {
          Alert.alert('Verificación requerida', 'Tu cuenta aún no está verificada. Revisá tu correo y tocá el link de verificación.');
          router.replace('/(auth)/verify-email');
          return;
        }
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <View style={styles.brandMark}>
          <View style={styles.brandGlyph}>
            <View style={styles.brandSuzukiLikeTop} />
            <View style={styles.brandSuzukiLikeBottom} />
            <View style={styles.brandSuzukiLikeGap} />
          </View>
        </View>
        <Text style={styles.brandName}>SHIFT</Text>
      </View>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
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
  brandContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  brandMark: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    borderWidth: 3,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  brandGlyph: {
    width: 54,
    height: 54,
    position: 'relative',
    justifyContent: 'center',
  },
  brandSuzukiLikeTop: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 44,
    height: 22,
    backgroundColor: '#111',
    borderRadius: 10,
    transform: [{ rotate: '-25deg' }],
  },
  brandSuzukiLikeBottom: {
    position: 'absolute',
    bottom: 6,
    left: 4,
    width: 44,
    height: 22,
    backgroundColor: '#111',
    borderRadius: 10,
    transform: [{ rotate: '-25deg' }],
  },
  brandSuzukiLikeGap: {
    position: 'absolute',
    top: 10,
    left: 22,
    width: 10,
    height: 38,
    backgroundColor: '#8B0000',
    borderRadius: 6,
    transform: [{ rotate: '-25deg' }],
  },
  brandName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#111',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
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
  buttonDisabled: {
    opacity: 0.7,
  },
  link: {
    color: '#8B0000',
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});