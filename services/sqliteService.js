import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db;
let initPromise = null;
let sqliteDisabled = false;

const ensureDbInitialized = async () => {
  if (Platform.OS === 'web') return false;
  if (sqliteDisabled) return false;
  if (db) return true;

  if (initPromise) {
    const ok = await initPromise;
    return Boolean(ok && db);
  }

  const ok = await initDatabase();
  return Boolean(ok && db);
};

const normalizeSQLiteProductRow = (row) => {
  if (!row) return row;

  const price = row.price === null || row.price === undefined ? 0 : Number(row.price);
  const rating = row.rating === null || row.rating === undefined ? 0 : Number(row.rating);
  const stock = row.stock === null || row.stock === undefined ? 0 : Number(row.stock);

  return {
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    price: Number.isFinite(price) ? price : 0,
    category: row.category ?? '',
    image: row.image ?? '',
    rating: Number.isFinite(rating) ? rating : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    sellerName: row.seller_name ?? row.sellerName ?? '',
    sellerLocation: row.seller_location ?? row.sellerLocation ?? '',
    condition: row.product_condition ?? row.condition ?? '',
    soldCount: Number.isFinite(Number(row.sold_count ?? row.soldCount)) ? Number(row.sold_count ?? row.soldCount) : 0,
    createdAt: row.created_at ?? row.createdAt ?? null
  };
};

const ensureProductColumns = async () => {
  const ok = await ensureDbInitialized();
  if (!ok) return false;

  try {
    const columns = await db.getAllAsync('PRAGMA table_info(products)');
    const existing = new Set((columns || []).map((c) => String(c.name)));

    const addColumnIfMissing = async (name, type) => {
      if (existing.has(name)) return;
      await db.execAsync(`ALTER TABLE products ADD COLUMN "${name}" ${type};`);
      existing.add(name);
    };

    await addColumnIfMissing('seller_name', 'TEXT');
    await addColumnIfMissing('seller_location', 'TEXT');
    await addColumnIfMissing('product_condition', 'TEXT');
    await addColumnIfMissing('sold_count', 'INTEGER');

    return true;
  } catch (error) {
    console.error('Error al verificar/migrar columnas de products:', error);
    return false;
  }
};

export const initDatabase = async () => {
  if (Platform.OS === 'web') return false;
  if (sqliteDisabled) return false;
  if (db) return true;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync('shift_app_v2.db');

      const statements = [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          photo TEXT,
          created_at TEXT,
          updated_at TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS addresses (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT,
          address TEXT,
          city TEXT,
          postal_code TEXT,
          is_default INTEGER,
          created_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`,
        `CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          price REAL,
          category TEXT,
          image TEXT,
          rating REAL,
          stock INTEGER,
          seller_name TEXT,
          seller_location TEXT,
          product_condition TEXT,
          sold_count INTEGER,
          created_at TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS cart (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          product_id TEXT,
          quantity INTEGER,
          added_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );`,
        `CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          product_id TEXT,
          added_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );`,
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          total_amount REAL,
          status TEXT,
          items TEXT,
          created_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      ];

      for (const stmt of statements) {
        await db.execAsync(stmt);
      }

      await ensureProductColumns();

      console.log('Base de datos SQLite inicializada correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      sqliteDisabled = true;
      db = null;
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

export const userSQLiteService = {
  saveUser: async (userData) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return { success: false, error: new Error('SQLite not available') };
      
      await db.runAsync(
        `INSERT OR REPLACE INTO users (id, name, email, photo, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userData.id,
          userData.name,
          userData.email,
          userData.photo,
          userData.createdAt || new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error al guardar usuario en SQLite:', error);
      return { success: false, error };
    }
  },

  getUser: async (userId) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return null;
      
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      
      return user;
    } catch (error) {
      console.error('Error al obtener usuario de SQLite:', error);
      return null;
    }
  }
};

export const productSQLiteService = {
  saveProducts: async (products) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return { success: false, error: new Error('SQLite not available') };

      await ensureProductColumns();
      
      for (const product of products) {
        await db.runAsync(
          `INSERT OR REPLACE INTO products (id, name, description, price, category, image, rating, stock, seller_name, seller_location, product_condition, sold_count, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id,
            product.name ?? '',
            product.description ?? '',
            Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
            product.category ?? '',
            product.image ?? '',
            Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0,
            Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
            product.sellerName ?? product.seller_name ?? '',
            product.sellerLocation ?? product.seller_location ?? '',
            product.condition ?? product.product_condition ?? '',
            Number.isFinite(Number(product.soldCount ?? product.sold_count)) ? Number(product.soldCount ?? product.sold_count) : 0,
            product.createdAt || product.created_at || new Date().toISOString()
          ]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al guardar productos en SQLite:', error);
      return { success: false, error };
    }
  },

  getProduct: async (productId) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return null;

      const product = await db.getFirstAsync(
        'SELECT * FROM products WHERE id = ?',
        [String(productId)]
      );

      return normalizeSQLiteProductRow(product);
    } catch (error) {
      console.error('Error al obtener producto de SQLite:', error);
      return null;
    }
  },

  getProducts: async () => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return [];
      
      const products = await db.getAllAsync('SELECT * FROM products');
      return products.map(normalizeSQLiteProductRow);
    } catch (error) {
      console.error('Error al obtener productos de SQLite:', error);
      return [];
    }
  }
};

export const addressSQLiteService = {
  saveAddress: async (address) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return { success: false, error: new Error('SQLite not available') };
      
      await db.runAsync(
        `INSERT OR REPLACE INTO addresses (id, user_id, name, address, city, postal_code, is_default, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          address.id,
          address.userId,
          address.name,
          address.address,
          address.city,
          address.postalCode,
          address.isDefault ? 1 : 0,
          address.createdAt || new Date().toISOString()
        ]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error al guardar dirección en SQLite:', error);
      return { success: false, error };
    }
  },

  getAddresses: async (userId) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return [];
      
      const addresses = await db.getAllAsync(
        'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
      
      return addresses.map(addr => ({
        ...addr,
        isDefault: addr.is_default === 1,
        postalCode: addr.postal_code
      }));
    } catch (error) {
      console.error('Error al obtener direcciones de SQLite:', error);
      return [];
    }
  }
};

export const cartSQLiteService = {
  addToCart: async (userId, productId, quantity = 1) => {
    try {
      const ok = await ensureDbInitialized();
      if (!ok) return { success: false, error: new Error('SQLite not available') };
      
      await db.runAsync(
        `INSERT OR REPLACE INTO cart (user_id, product_id, quantity, added_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, productId, quantity, new Date().toISOString()]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error al agregar al carrito en SQLite:', error);
      return { success: false, error };
    }
  },

  getCart: async (userId) => {
    try {
      if (!db) await initDatabase();
      
      const cart = await db.getAllAsync(
        'SELECT * FROM cart WHERE user_id = ?',
        [userId]
      );
      
      return cart;
    } catch (error) {
      console.error('Error al obtener carrito de SQLite:', error);
      return [];
    }
  }
};

export default {
  initDatabase,
  userSQLiteService,
  productSQLiteService,
  addressSQLiteService,
  cartSQLiteService
};
