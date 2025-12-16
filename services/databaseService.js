import {
    get,
    onValue,
    push,
    ref,
    remove,
    set,
    update
} from 'firebase/database';
import { database } from '../config/firebase';

// Servicios para usuarios
export const userService = {
  // Obtener datos de un usuario
  getUserData: async (uid) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      throw error;
    }
  },

  // Actualizar datos de un usuario
  updateUserData: async (uid, data) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      await update(userRef, data);
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      throw error;
    }
  },

  // Escuchar cambios en los datos de un usuario
  onUserDataChange: (uid, callback) => {
    const userRef = ref(database, `users/${uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return unsubscribe;
  }
};

// Servicios para productos
export const productService = {
  // Obtener todos los productos
  getAllProducts: async () => {
    try {
      const productsRef = ref(database, 'products');
      const snapshot = await get(productsRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },

  // Obtener un producto específico
  getProduct: async (productId) => {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  },

  // Escuchar cambios en los productos
  onProductsChange: (callback) => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
    return unsubscribe;
  },

  // Agregar un nuevo producto
  addProduct: async (product) => {
    try {
      const productsRef = ref(database, 'products');
      const newProductRef = push(productsRef);
      await set(newProductRef, {
        ...product,
        id: newProductRef.key,
        createdAt: new Date().toISOString()
      });
      return { success: true, productId: newProductRef.key };
    } catch (error) {
      console.error('Error al agregar producto:', error);
      throw error;
    }
  },

  // Actualizar un producto
  updateProduct: async (productId, data) => {
    try {
      const productRef = ref(database, `products/${productId}`);
      await update(productRef, data);
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  }
};

// Servicios para el carrito de compras
export const cartService = {
  // Obtener el carrito de un usuario
  getUserCart: async (uid) => {
    try {
      const cartRef = ref(database, `carts/${uid}`);
      const snapshot = await get(cartRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      throw error;
    }
  },

  // Agregar producto al carrito
  addToCart: async (uid, product) => {
    try {
      const cartRef = ref(database, `carts/${uid}`);
      const snapshot = await get(cartRef);
      
      let cartData = snapshot.exists() ? snapshot.val() : {};
      
      // Verificar si el producto ya está en el carrito
      if (cartData[product.id]) {
        // Incrementar cantidad
        cartData[product.id].quantity += 1;
      } else {
        // Agregar nuevo producto
        cartData[product.id] = {
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString()
        };
      }
      
      await set(cartRef, cartData);
      return { success: true };
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      throw error;
    }
  },

  // Eliminar producto del carrito
  removeFromCart: async (uid, productId) => {
    try {
      const cartRef = ref(database, `carts/${uid}/${productId}`);
      await remove(cartRef);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      throw error;
    }
  },

  // Actualizar cantidad de producto en el carrito
  updateCartItemQuantity: async (uid, productId, quantity) => {
    try {
      if (quantity <= 0) {
        return await cartService.removeFromCart(uid, productId);
      }
      
      const itemRef = ref(database, `carts/${uid}/${productId}`);
      await update(itemRef, { quantity });
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      throw error;
    }
  },

  // Vaciar carrito
  clearCart: async (uid) => {
    try {
      const cartRef = ref(database, `carts/${uid}`);
      await remove(cartRef);
      return { success: true };
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      throw error;
    }
  },

  // Escuchar cambios en el carrito
  onCartChange: (uid, callback) => {
    const cartRef = ref(database, `carts/${uid}`);
    const unsubscribe = onValue(cartRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : {});
    });
    return unsubscribe;
  }
};

// Servicios para favoritos
export const favoritesService = {
  // Obtener favoritos de un usuario
  getUserFavorites: async (uid) => {
    try {
      const favoritesRef = ref(database, `favorites/${uid}`);
      const snapshot = await get(favoritesRef);
      return snapshot.exists() ? Object.values(snapshot.val()) : [];
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      throw error;
    }
  },

  // Agregar producto a favoritos
  addToFavorites: async (uid, product) => {
    try {
      const favoritesRef = ref(database, `favorites/${uid}`);
      const snapshot = await get(favoritesRef);
      
      let favoritesData = snapshot.exists() ? snapshot.val() : {};
      
      // Verificar si el producto ya está en favoritos
      if (!favoritesData[product.id]) {
        favoritesData[product.id] = {
          ...product,
          addedAt: new Date().toISOString()
        };
      }
      
      await set(favoritesRef, favoritesData);
      return { success: true };
    } catch (error) {
      console.error('Error al agregar a favoritos:', error);
      throw error;
    }
  },

  // Eliminar producto de favoritos
  removeFromFavorites: async (uid, productId) => {
    try {
      const favoriteRef = ref(database, `favorites/${uid}/${productId}`);
      await remove(favoriteRef);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar de favoritos:', error);
      throw error;
    }
  },

  // Escuchar cambios en favoritos
  onFavoritesChange: (uid, callback) => {
    const favoritesRef = ref(database, `favorites/${uid}`);
    const unsubscribe = onValue(favoritesRef, (snapshot) => {
      callback(snapshot.exists() ? Object.values(snapshot.val()) : []);
    });
    return unsubscribe;
  }
};

// Servicios para pedidos
export const orderService = {
  // Crear un nuevo pedido
  createOrder: async (uid, orderData) => {
    try {
      const ordersRef = ref(database, `orders/${uid}`);
      const newOrderRef = push(ordersRef);
      
      const order = {
        ...orderData,
        id: newOrderRef.key,
        userId: uid,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      await set(newOrderRef, order);
      return { success: true, orderId: newOrderRef.key };
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }
  },

  // Obtener pedidos de un usuario
  getUserOrders: async (uid) => {
    try {
      const ordersRef = ref(database, `orders/${uid}`);
      const snapshot = await get(ordersRef);
      return snapshot.exists() ? Object.values(snapshot.val()) : [];
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      throw error;
    }
  },

  // Escuchar cambios en los pedidos
  onOrdersChange: (uid, callback) => {
    const ordersRef = ref(database, `orders/${uid}`);
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      callback(snapshot.exists() ? Object.values(snapshot.val()) : []);
    });
    return unsubscribe;
  }
};

export default {
  userService,
  productService,
  cartService,
  favoritesService,
  orderService
};
