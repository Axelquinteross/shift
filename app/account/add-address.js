import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { locationService } from '../../services/locationService';

export default function AddAddress() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    try {
      setIsDetectingLocation(true);
      
      const location = await locationService.getCurrentLocation();
      const addressData = await locationService.getAddressFromCoordinates(
        location.latitude, 
        location.longitude
      );

      if (addressData) {
        setAddress(addressData.street || '');
        setCity(addressData.city || '');
        setPostalCode(addressData.postalCode || '');
        
        Alert.alert(
          'Ubicación detectada',
          `Se ha detectado tu ubicación actual: ${addressData.formattedAddress}`,
          [{ text: 'Aceptar' }]
        );
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert(
        'Error',
        'No se pudo detectar tu ubicación. Por favor, verifica que tengas activada la ubicación y los permisos necesarios.',
        [{ text: 'Aceptar' }]
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    // Validación básica
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para esta dirección');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Por favor ingresa la dirección');
      return;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Por favor ingresa la ciudad');
      return;
    }

    try {
      setIsLoading(true);

      if (!user?.uid) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Guardando dirección para usuario:', user.uid);
      console.log('Datos de dirección:', { name, address, city, postalCode });

      // Importar funciones de Firebase
      const { ref, push, set } = await import('firebase/database');
      const { database } = await import('../../config/firebase');

      // Crear objeto de dirección
      const newAddress = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        isDefault: false,
        createdAt: new Date().toISOString(),
        userId: user.uid
      };

      console.log('Objeto de dirección a guardar:', newAddress);

      // Guardar en Firebase Database
      const addressesRef = ref(database, `addresses/${user.uid}`);
      const newAddressRef = push(addressesRef);
      await set(newAddressRef, newAddress);

      console.log('Dirección guardada exitosamente con ID:', newAddressRef.key);

      Alert.alert(
        '¡Éxito!',
        'La dirección se ha agregado correctamente',
        [
          {
            text: 'Aceptar',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      Alert.alert('Error', 'No se pudo guardar la dirección. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Agregar nueva dirección</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.locationButton, isDetectingLocation && styles.locationButtonDisabled]}
          onPress={handleDetectLocation}
          disabled={isDetectingLocation}
        >
          {isDetectingLocation ? (
            <ActivityIndicator color="#8B0000" size="small" />
          ) : (
            <Ionicons name="location" size={20} color="#8B0000" />
          )}
          <Text style={[styles.locationButtonText, isDetectingLocation && styles.locationButtonTextDisabled]}>
            {isDetectingLocation ? 'Detectando ubicación...' : 'Usar mi ubicación actual'}
          </Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de la dirección</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Casa, Trabajo"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Calle y número"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ej: Buenos Aires"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código postal</Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="Ej: 1000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar dirección</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationButtonDisabled: {
    borderColor: '#ccc',
    opacity: 0.7,
  },
  locationButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#8B0000',
  },
  locationButtonTextDisabled: {
    color: '#999',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
