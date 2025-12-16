import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser, updateUserProfile } from '../../services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Los datos del usuario ya se cargan automáticamente con useAuth
    }, [])
  );

  const handleLogout = async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  const handleUpdateAvatar = () => {
    // Mostrar opciones en un ActionSheet
    const options = ['Tomar foto', 'Elegir de la galería', 'Cancelar'];
    const cancelButtonIndex = 2;

    Alert.alert(
      'Actualizar foto de perfil',
      '¿Cómo deseas actualizar tu foto de perfil?',
      [
        {
          text: 'Tomar foto',
          onPress: async () => {
            try {
              setIsUploading(true);
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                await updateUserAvatar(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error al tomar la foto:', error);
              Alert.alert('Error', 'No se pudo tomar la foto');
            } finally {
              setIsUploading(false);
            }
          }
        },
        {
          text: 'Elegir de la galería',
          onPress: async () => {
            try {
              setIsUploading(true);
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                await updateUserAvatar(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error al seleccionar la imagen:', error);
              Alert.alert('Error', 'No se pudo seleccionar la imagen');
            } finally {
              setIsUploading(false);
            }
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const updateUserAvatar = async (imageUri) => {
    try {
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      // Actualizar en Firebase Database
      const result = await updateUserProfile(user.uid, { avatar: imageUri });
      
      if (result.success) {
        Alert.alert('¡Éxito!', 'Foto de perfil actualizada correctamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al actualizar el avatar:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-circle" size={80} color="#8B0000" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No hay usuario conectado</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Sección de perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={80} color="#8B0000" />
          )}
        </View>
        <Text style={styles.userName}>{user.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Sección de opciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Cuenta</Text>
        <OptionItem 
          icon="person-outline" 
          title="Editar Perfil" 
          onPress={() => router.push('/account/edit-profile')} 
        />
        <OptionItem 
          icon="card-outline" 
          title="Métodos de Pago" 
          onPress={() => router.push('/account/payment-methods')} 
        />
        <OptionItem 
          icon="location-outline" 
          title="Direcciones" 
          onPress={() => router.push('/account/addresses')} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Actividad</Text>
        <OptionItem 
          icon="cart-outline" 
          title="Mis Pedidos" 
          onPress={() => router.push('/orders')} 
        />
        <OptionItem 
          icon="pricetag-outline" 
          title="Mis publicaciones" 
          onPress={() => router.push('/account/my-listings')} 
        />
        <OptionItem 
          icon="heart-outline" 
          title="Favoritos" 
          onPress={() => router.push('/favorites')} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <OptionItem 
          icon="notifications-outline" 
          title="Notificaciones" 
          onPress={() => router.push('/settings/notifications')} 
        />
        <OptionItem 
          icon="shield-checkmark-outline" 
          title="Privacidad" 
          onPress={() => router.push('/settings/privacy')} 
        />
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#8B0000" />
        <Text style={[styles.buttonText, {color: '#8B0000'}]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Componente para las opciones del menú
function OptionItem({ icon, title, onPress }) {
  return (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#333" />
      <Text style={styles.optionText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#8B0000',
    borderRadius: 15,
    padding: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  loginButton: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
});