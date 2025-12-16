// Script temporal para cargar productos en Firebase desde la app
import { ref, set } from 'firebase/database';
import { database } from '../config/firebase';
import products from '../data/products';

export const loadProductsToFirebase = async () => {
  try {
    console.log('Cargando productos a Firebase...');
    
    for (const product of products) {
      const productRef = ref(database, `products/${product.id}`);
      await set(productRef, {
        ...product,
        createdAt: new Date().toISOString()
      });
      console.log(`Producto ${product.name} cargado`);
    }
    
    console.log('¡Productos cargados exitosamente!');
    return true;
  } catch (error) {
    console.error('Error al cargar productos:', error);
    return false;
  }
};
