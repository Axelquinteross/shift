import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { listingsService } from '../../services/listingsService';

export default function CreateListingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    if (!user?.uid) return false;
    if (!String(title).trim()) return false;
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return false;
    return true;
  }, [price, title, user?.uid]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos permiso para acceder a tu galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setPhotos((prev) => [...prev, uri]);
      }
    } catch (e) {
      console.error('Pick image error:', e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const removePhoto = (uri) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const handleSubmit = async () => {
    try {
      if (!user?.uid) {
        Alert.alert('Error', 'Tenés que iniciar sesión');
        return;
      }

      const t = String(title).trim();
      const p = Number(price);

      if (!t) {
        Alert.alert('Falta título', 'Ingresá un título para tu publicación');
        return;
      }
      if (!Number.isFinite(p) || p <= 0) {
        Alert.alert('Precio inválido', 'Ingresá un precio válido');
        return;
      }

      setSaving(true);
      const created = await listingsService.createListing({
        userId: user.uid,
        title: t,
        price: p,
        description: String(description ?? '').trim(),
        photoUris: photos,
      });

      let message = 'Tu publicación se creó correctamente';
      if (created?.photoUploadFailed) {
        message = 'Tu publicación se creó, pero no se pudieron subir las fotos.';
      } else if (created?.photoUploadPartial) {
        message = 'Tu publicación se creó, pero algunas fotos no se pudieron subir.';
      }

      Alert.alert('Publicado', message, [
        {
          text: 'OK',
          onPress: () => router.replace('/account/my-listings'),
        },
      ]);
    } catch (e) {
      console.error('Create listing error:', e);
      Alert.alert('Error', String(e?.message ?? 'No se pudo crear la publicación'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: iPhone 12 usado"
            style={styles.input}
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Precio</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Ej: 120000"
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Contá detalles del producto, estado, etc."
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#888"
            multiline
          />

          <View style={styles.photosHeader}>
            <Text style={styles.label}>Fotos</Text>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.9}>
              <Ionicons name="images-outline" size={18} color="#8B0000" />
              <Text style={styles.addPhotoText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {photos.length === 0 ? (
            <Text style={styles.photosHint}>Agregá al menos 1 foto para que se vea mejor (opcional).</Text>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(uri)} activeOpacity={0.85}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || saving) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={!canSubmit || saving}
          >
            <Text style={styles.submitText}>{saving ? 'Publicando...' : 'Publicar'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  label: {
    fontWeight: '900',
    color: '#111',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
    backgroundColor: '#fafafa',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8B0000',
    backgroundColor: '#fff',
  },
  addPhotoText: {
    color: '#8B0000',
    fontWeight: '900',
  },
  photosHint: {
    color: '#777',
    marginTop: 10,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoWrap: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f1f1',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: '#fff',
    fontWeight: '900',
  },
});
