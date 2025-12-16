import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const selectImage = async (options = {}) => {
  try {
    // Verificar permisos en iOS
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permiso para acceder a tu galería de fotos.'
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...options
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error al seleccionar la imagen:', error);
    Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor, inténtalo de nuevo.');
    return null;
  }
};

export const takePhoto = async (options = {}) => {
  try {
    // Verificar permisos de cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos permiso para acceder a tu cámara.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...options
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error al tomar la foto:', error);
    Alert.alert('Error', 'No se pudo tomar la foto. Por favor, inténtalo de nuevo.');
    return null;
  }
};

export const showImagePickerOptions = async (options = {}) => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permiso para acceder a tu galería de fotos.'
        );
        return null;
      }
    
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo deseas seleccionar una imagen?',
      [
        {
          text: 'Tomar foto',
          onPress: async () => {
            const uri = await takePhoto(options);
            if (uri) {
              return uri;
            }
            return null;
          },
        },
        {
          text: 'Elegir de la galería',
          onPress: async () => {
            const uri = await selectImage(options);
            if (uri) {
              return uri;
            }
            return null;
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => null,
        },
      ],
      { cancelable: true }
    );
  } catch (error) {
    console.error('Error al mostrar opciones de imagen:', error);
    return null;
  }
};

export default {
  selectImage,
  takePhoto,
  showImagePickerOptions,
};
