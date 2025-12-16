import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteAccount, logoutUser } from '../../services/authService';

export default function Privacy() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const privacyOptions = [
    {
      title: 'Política de privacidad',
      onPress: () => Linking.openURL('https://tutienda.com/privacidad')
    },
    {
      title: 'Términos y condiciones',
      onPress: () => Linking.openURL('https://tutienda.com/terminos')
    },
    {
      title: deleting ? 'Eliminando cuenta...' : 'Eliminar mi cuenta',
      onPress: () => {
        if (deleting) return;
        Alert.alert(
          'Eliminar cuenta',
          'Esta acción es irreversible. Se eliminará tu cuenta y tus datos asociados. ¿Querés continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: async () => {
                try {
                  setDeleting(true);
                  const result = await deleteAccount();

                  if (result?.success) {
                    Alert.alert('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.');
                    router.replace('/(auth)/login');
                    return;
                  }

                  const message = result?.error || 'No se pudo eliminar la cuenta.';
                  Alert.alert('No se pudo eliminar', message);

                  if (message.toLowerCase().includes('volvé a iniciar sesión')) {
                    await logoutUser();
                    router.replace('/(auth)/login');
                  }
                } finally {
                  setDeleting(false);
                }
              }
            }
          ]
        );
      },
      isDestructive: true
    },
  ];

  return (
    <View style={styles.container}>
      {privacyOptions.map((option, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.option}
          onPress={option.onPress}
          disabled={deleting && option.isDestructive}
        >
          <Text 
            style={[
              styles.optionText,
              option.isDestructive && styles.destructiveText
            ]}
          >
            {option.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  option: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
  },
  destructiveText: {
    color: '#f44336',
  },
});