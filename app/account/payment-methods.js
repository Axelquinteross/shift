import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import creditCardType from 'credit-card-type';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Formik } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as yup from 'yup';

// Esquema de validación
const validationSchema = yup.object().shape({
  cardNumber: yup
    .string()
    .required('Número de tarjeta requerido')
    .matches(/^\d{15,16}$/, 'Número de tarjeta inválido'),
  cardName: yup
    .string()
    .required('Nombre en la tarjeta requerido')
    .min(3, 'Mínimo 3 caracteres'),
  expiryDate: yup
    .string()
    .required('Fecha de vencimiento requerida')
    .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Formato inválido (MM/YY)'),
  cvv: yup
    .string()
    .required('CVV requerido')
    .matches(/^\d{3,4}$/, 'CVV inválido')
});

export default function PaymentMethods() {
  const [cards, setCards] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoErrors, setLogoErrors] = useState({});

  // Cargar tarjetas guardadas
  const loadCards = async () => {
    try {
      const savedCards = await AsyncStorage.getItem('savedCards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    } catch (error) {
      console.error('Error al cargar tarjetas:', error);
      Alert.alert('Error', 'No se pudieron cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  // Cargar tarjetas al montar el componente
  useEffect(() => {
    loadCards();
  }, []);

  // Recargar tarjetas cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  // Obtener el tipo de tarjeta
  const getCardType = (cardNumber) => {
    const normalized = String(cardNumber ?? '').replace(/\D/g, '');

    const fallbackType = () => {
      if (!normalized) return 'unknown';
      if (normalized.startsWith('4')) return 'visa';
      if (/^3[47]/.test(normalized)) return 'american-express';
      if (/^5[1-5]/.test(normalized)) return 'mastercard';
      if (/^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(normalized)) return 'mastercard';
      return 'unknown';
    };

    try {
      const cardInfo = creditCardType(normalized)[0];
      const type = cardInfo ? cardInfo.type : 'unknown';
      return type !== 'unknown' ? type : fallbackType();
    } catch (e) {
      console.error('Error detecting card type:', e);
      return fallbackType();
    }
  };

  const getCardBackground = (cardNumber) => {
    const type = getCardType(cardNumber);
    switch (type) {
      case 'visa':
        return ['#1a1f71', '#f7b600'];
      case 'mastercard':
        return ['#EB001B', '#F79E1B'];
      case 'amex':
      case 'american-express':
        return ['#006FCF', '#009CDE'];
      default:
        return ['#2c3e50', '#4ca1af'];
    }
  };

  // Obtener el ícono de la tarjeta
  const getCardIcon = (cardNumber) => {
    const type = getCardType(cardNumber);

    const logoByType = {
      visa: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/visa.png',
      mastercard: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/mastercard.png',
      'american-express': 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/american-express.png',
      amex: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/american-express.png',
    };

    const fallbackByType = {
      visa: <FontAwesome5 name="cc-visa" size={40} color="#111" />,
      mastercard: <FontAwesome5 name="cc-mastercard" size={40} color="#111" />,
      'american-express': <FontAwesome5 name="cc-amex" size={40} color="#111" />,
      amex: <FontAwesome5 name="cc-amex" size={40} color="#111" />,
    };

    const brandKey = String(type);
    const shouldUseFallback = !!logoErrors?.[brandKey];
    const logoUri = logoByType[brandKey];

    switch (type) {
      case 'visa':
        return { 
          component: (
            <View style={styles.cardLogoPill}>
              {shouldUseFallback ? (
                fallbackByType.visa
              ) : (
                <Image
                  source={{ uri: logoUri }}
                  style={styles.cardLogoImage}
                  onError={(e) => {
                    console.error('Card logo load error (visa):', e?.nativeEvent);
                    setLogoErrors((prev) => ({ ...prev, visa: true }));
                  }}
                />
              )}
            </View>
          ),
          type: 'Visa'
        };
      case 'mastercard':
        return { 
          component: (
            <View style={styles.cardLogoPill}>
              {shouldUseFallback ? (
                fallbackByType.mastercard
              ) : (
                <Image
                  source={{ uri: logoUri }}
                  style={styles.cardLogoImage}
                  onError={(e) => {
                    console.error('Card logo load error (mastercard):', e?.nativeEvent);
                    setLogoErrors((prev) => ({ ...prev, mastercard: true }));
                  }}
                />
              )}
            </View>
          ),
          type: 'Mastercard'
        };
      case 'amex':
      case 'american-express':
        return { 
          component: (
            <View style={styles.cardLogoPill}>
              {shouldUseFallback ? (
                fallbackByType['american-express']
              ) : (
                <Image
                  source={{ uri: logoUri }}
                  style={styles.cardLogoImage}
                  onError={(e) => {
                    console.error('Card logo load error (amex):', e?.nativeEvent);
                    setLogoErrors((prev) => ({ ...prev, 'american-express': true, amex: true }));
                  }}
                />
              )}
            </View>
          ),
          type: 'American Express'
        };
      default:
        return { 
          component: <Ionicons name="card" size={40} color="white" />,
          type: 'Tarjeta'
        };
    }
  };

  // Formatear número de tarjeta para mostrar
  const formatCardNumber = (number) => {
    const normalized = String(number ?? '').replace(/\D/g, '');
    return `•••• •••• •••• ${normalized.slice(-4)}`;
  };

  // Manejar el envío del formulario
  const handleAddCard = async (values, { resetForm }) => {
    try {
      const normalizedNumber = String(values.cardNumber ?? '').replace(/\D/g, '');
      const newCard = {
        id: Date.now().toString(),
        number: normalizedNumber,
        name: values.cardName,
        expiry: values.expiryDate,
        cvv: values.cvv,
        type: getCardType(normalizedNumber)
      };

      const updatedCards = [...cards, newCard];
      await AsyncStorage.setItem('savedCards', JSON.stringify(updatedCards));
      setCards(updatedCards);
      setModalVisible(false);
      resetForm();
      Alert.alert('Éxito', 'Tarjeta agregada correctamente');
    } catch (error) {
      console.error('Error al guardar la tarjeta:', error);
      Alert.alert('Error', 'No se pudo guardar la tarjeta');
    }
  };

  // Eliminar tarjeta
  const handleDeleteCard = async (cardId) => {
    try {
      const updatedCards = cards.filter(card => card.id !== cardId);
      await AsyncStorage.setItem('savedCards', JSON.stringify(updatedCards));
      setCards(updatedCards);
      Alert.alert('Éxito', 'Tarjeta eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la tarjeta:', error);
      Alert.alert('Error', 'No se pudo eliminar la tarjeta');
    }
  };

  // Renderizar tarjetas guardadas
  const renderCards = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      );
    }

    if (cards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No hay tarjetas guardadas</Text>
        </View>
      );
    }

    return cards.map((card) => {
      const cardIcon = getCardIcon(card.number);
      const gradientColors = getCardBackground(card.number);
      
      return (
        <View key={card.id} style={styles.card}>
          <LinearGradient
            colors={gradientColors}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.cardHeader}>
            <View style={styles.cardChip} />
            <View style={styles.cardLogoContainer}>
              {cardIcon.component}
            </View>
          </View>
          
          <Text style={styles.cardNumber}>{formatCardNumber(card.number)}</Text>
          
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardExpiry}>VENCE {card.expiry}</Text>
            </View>
            <Text style={styles.cardType}>{cardIcon.type}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleDeleteCard(card.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>Métodos de Pago</Text>
        {renderCards()}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Agregar tarjeta</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar tarjeta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Formik
              initialValues={{ cardNumber: '', cardName: '', expiryDate: '', cvv: '' }}
              validationSchema={validationSchema}
              onSubmit={handleAddCard}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Número de tarjeta</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="number-pad"
                      maxLength={16}
                      value={values.cardNumber}
                      onChangeText={(text) => {
                        handleChange('cardNumber')(String(text ?? '').replace(/\D/g, ''));
                      }}
                      onBlur={handleBlur('cardNumber')}
                    />
                    {touched.cardNumber && errors.cardNumber && (
                      <Text style={styles.errorText}>{errors.cardNumber}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre en la tarjeta</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="JUAN PEREZ"
                      value={values.cardName}
                      onChangeText={handleChange('cardName')}
                      onBlur={handleBlur('cardName')}
                    />
                    {touched.cardName && errors.cardName && (
                      <Text style={styles.errorText}>{errors.cardName}</Text>
                    )}
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.label}>Vencimiento</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        keyboardType="number-pad"
                        maxLength={5}
                        value={values.expiryDate}
                        onChangeText={(text) => {
                          if (text.length === 2 && !values.expiryDate.includes('/')) {
                            handleChange('expiryDate')(`${text}/`);
                          } else {
                            handleChange('expiryDate')(text);
                          }
                        }}
                        onBlur={handleBlur('expiryDate')}
                      />
                      {touched.expiryDate && errors.expiryDate && (
                        <Text style={styles.errorText}>{errors.expiryDate}</Text>
                      )}
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>CVV</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        value={values.cvv}
                        onChangeText={handleChange('cvv')}
                        onBlur={handleBlur('cvv')}
                      />
                      {touched.cvv && errors.cvv && (
                        <Text style={styles.errorText}>{errors.cvv}</Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>Agregar tarjeta</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative',
    height: 200,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
    padding: 20,
    zIndex: 0,
  },
  cardHeader: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  cardLogoContainer: {
    position: 'relative',
    marginLeft: 'auto',
    zIndex: 2,
  },
  cardLogoPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardLogoImage: {
    width: 64,
    height: 28,
    resizeMode: 'contain',
  },
  cardChip: {
    width: 40,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
  },
  cardNumber: {
    position: 'relative',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  cardName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
    zIndex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardFooter: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    zIndex: 1,
  },
  cardExpiry: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    letterSpacing: 1,
  },
  cardType: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#8B0000',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
});