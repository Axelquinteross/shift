import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [user])
  );

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    try {
      if (!user?.uid) {
        console.log('No hay usuario autenticado');
        setLoading(false);
        return;
      }

      console.log('Cargando direcciones para usuario:', user.uid);

      const { ref, onValue } = await import('firebase/database');
      const { database } = await import('../../config/firebase');

      const addressesRef = ref(database, `addresses/${user.uid}`);
      
      const unsubscribe = onValue(addressesRef, (snapshot) => {
        console.log('Snapshot recibido:', snapshot.exists());
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Datos crudos de direcciones:', data);
          
          const addressesList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          
          console.log('Lista de direcciones procesada:', addressesList);
          setAddresses(addressesList);
        } else {
          console.log('No existen direcciones para este usuario');
          setAddresses([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading addresses:', error);
      setLoading(false);
    }
  };

  const setAsDefault = async (addressId) => {
    try {
      const { ref, update } = await import('firebase/database');
      const { database } = await import('../../config/firebase');

      // Actualizar todas las direcciones a no predeterminadas
      const updates = {};
      addresses.forEach(addr => {
        updates[`addresses/${user.uid}/${addr.id}/isDefault`] = addr.id === addressId;
      });

      await update(ref(database), updates);
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'No se pudo establecer como dirección predeterminada');
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const { ref, remove } = await import('firebase/database');
      const { database } = await import('../../config/firebase');

      const addressRef = ref(database, `addresses/${user.uid}/${addressId}`);
      await remove(addressRef);
    } catch (error) {
      console.error('Error deleting address:', error);
      Alert.alert('Error', 'No se pudo eliminar la dirección');
    }
  };

  const confirmDelete = (addressId, addressName) => {
    Alert.alert(
      'Eliminar dirección',
      `¿Estás seguro de que quieres eliminar "${addressName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteAddress(addressId),
        },
      ],
      { cancelable: true }
    );
  };

  const renderAddress = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>{item.name}</Text>
        {item.isDefault && (
          <Text style={styles.defaultBadge}>Predeterminada</Text>
        )}
      </View>
      <Text style={styles.addressText}>{item.address}</Text>
      <Text style={styles.addressText}>{item.city}</Text>
      {item.postalCode && (
        <Text style={styles.addressText}>{item.postalCode}</Text>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/account/edit-address?id=${item.id}`)}
        >
          <Ionicons name="create-outline" size={18} color="#8B0000" />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        
        {!item.isDefault && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setAsDefault(item.id)}
          >
            <Ionicons name="star-outline" size={18} color="#8B0000" />
            <Text style={styles.actionText}>Predeterminada</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => confirmDelete(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={18} color="#dc3545" />
          <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Cargando direcciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/account/add-address')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Agregar nueva dirección</Text>
      </TouchableOpacity>

      {addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No tienes direcciones guardadas</Text>
          <Text style={styles.emptyText}>
            Agrega tu primera dirección para poder usarla en tus pedidos
          </Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddress}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
  },
  addressText: {
    color: '#666',
    marginBottom: 3,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  deleteButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionText: {
    color: '#8B0000',
    fontSize: 14,
    marginLeft: 4,
  },
  deleteText: {
    color: '#dc3545',
  },
});