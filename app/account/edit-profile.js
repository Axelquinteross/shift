import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const emailInput = useRef(null);
  const phoneInput = useRef(null);

  useEffect(() => {
    loadUserData();
  }, [user?.uid]);

  const loadUserData = async () => {
    try {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAvatar(user.avatar || null);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Actualizar foto de perfil',
      '¿Cómo deseas actualizar tu foto de perfil?',
      [
        {
          text: 'Tomar foto',
          onPress: takePhoto,
        },
        {
          text: 'Elegir de la galería',
          onPress: pickImage,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para que puedas cambiar tu foto de perfil.',
          [{ text: 'Aceptar' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor, inténtalo de nuevo.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu cámara para que puedas tomar una foto de perfil.',
          [{ text: 'Aceptar' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Por favor, inténtalo de nuevo.');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      const nextName = name.trim() || (user?.name ?? '').trim();
      if (!nextName) {
        Alert.alert('Error', 'Por favor ingresa tu nombre');
        return;
      }

      const nextPhone = phone.trim();
      const prevName = (user?.name ?? '').trim();
      const prevPhone = (user?.phone ?? '').trim();
      const prevAvatar = user?.avatar ?? null;

      // Actualizar en Firebase Database
      const updateData = {};
      if (nextName !== prevName) updateData.name = nextName;
      if (nextPhone !== prevPhone) updateData.phone = nextPhone;
      if ((avatar ?? null) !== (prevAvatar ?? null)) updateData.avatar = avatar;

      if (Object.keys(updateData).length === 0) {
        Alert.alert('Sin cambios', 'No hay cambios para guardar.');
        router.back();
        return;
      }

      const result = await updateUserProfile(user.uid, updateData);
      
      if (result.success) {
        Alert.alert(
          '¡Listo!', 
          'Tus cambios se han guardado correctamente',
          [
            {
              text: 'Aceptar',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      Alert.alert('Error', 'No se pudo guardar la información. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={showImagePickerOptions} style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={100} color="#8B0000" />
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarText}>Toca para cambiar la foto</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor="#999"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInput.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              ref={emailInput}
              style={styles.input}
              value={email}
              editable={false}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneInput.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono (opcional)</Text>
            <TextInput
              ref={phoneInput}
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+54 9 11 1234-5678"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, // Espacio para el botón fijo
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#8B0000',
    borderRadius: 15,
    padding: 5,
  },
  avatarText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  saveButton: {
    backgroundColor: '#8B0000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  saveButtonDisabled: {
    backgroundColor: '#b85c5c',
    opacity: 0.8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});