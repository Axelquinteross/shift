import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const COUPONS = [
  {
    code: 'SHIFT10',
    title: '10% OFF en tu compra',
    detail: 'Aplica en productos seleccionados. (Inventado)',
  },
  {
    code: 'ENVIOGRATIS',
    title: 'Envío gratis',
    detail: 'Válido para compras desde $30.000. (Inventado)',
  },
  {
    code: 'FULL20',
    title: '20% OFF Full',
    detail: 'Aplica si elegís envío Full. (Inventado)',
  },
];

export default function CouponsScreen() {
  const [input, setInput] = useState('');
  const normalized = useMemo(() => input.trim().toUpperCase(), [input]);

  const onApply = (code) => {
    Alert.alert('Cupón aplicado', `Se aplicó el cupón ${code} (modo demo).`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cupones</Text>
        <Text style={styles.subtitle}>Probá con SHIFT10, ENVIOGRATIS o FULL20.</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Ingresar cupón</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ej: SHIFT10"
            placeholderTextColor="#777"
            autoCapitalize="characters"
            style={styles.input}
          />
          <Pressable
            style={[styles.applyButton, !normalized && styles.applyButtonDisabled]}
            disabled={!normalized}
            onPress={() => onApply(normalized)}
          >
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={COUPONS}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onApply(item.code)}>
            <View style={styles.cardTop}>
              <View style={styles.codePill}>
                <Ionicons name="ticket" size={14} color="#fff" />
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8B0000" />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.detail}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f3f3' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  subtitle: { marginTop: 6, color: '#555', fontWeight: '600' },
  inputCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  inputLabel: { fontWeight: '900', color: '#111', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    fontWeight: '800',
    color: '#111',
  },
  applyButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: { opacity: 0.55 },
  applyButtonText: { color: '#fff', fontWeight: '900' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  codePill: {
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  cardSubtitle: { marginTop: 4, color: '#555', fontWeight: '600' },
});
