// Script para poblar Firebase Realtime Database con productos iniciales
import { ref, set } from 'firebase/database';
import { database } from '../config/firebase.js';
import products from '../data/products.js';

const seedProducts = async () => {
  try {
    console.log('Iniciando carga de productos a Firebase...');
    
    for (const product of products) {
      const productRef = ref(database, `products/${product.id}`);
      await set(productRef, {
        ...product,
        createdAt: new Date().toISOString()
      });
      console.log(`Producto ${product.name} agregado con ID: ${product.id}`);
    }
    
    console.log('¡Todos los productos han sido cargados exitosamente!');
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
};

seedProducts();
