import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'orders';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const ordersService = {
  async getOrders() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const orders = safeParse(raw, []);
    return Array.isArray(orders) ? orders : [];
  },

  async getOrderById(orderId) {
    const orders = await this.getOrders();
    return orders.find((o) => String(o.id) === String(orderId)) ?? null;
  },

  async saveOrders(orders) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  },

  async addOrder(order) {
    const orders = await this.getOrders();
    const newOrders = [order, ...orders];
    await this.saveOrders(newOrders);
    return order;
  },

  async updateOrder(orderId, patch) {
    const now = new Date().toISOString();
    const orders = await this.getOrders();
    const next = orders.map((o) => {
      if (String(o.id) !== String(orderId)) return o;

      const nextShipping = patch?.shipping
        ? { ...o.shipping, ...patch.shipping, updatedAt: now }
        : o.shipping;

      return { ...o, ...patch, shipping: nextShipping, updatedAt: now };
    });
    await this.saveOrders(next);
    return next.find((o) => String(o.id) === String(orderId)) ?? null;
  },

  createOrder({ items, total, totalAmount, address, addressId }) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date().toISOString();

    const resolvedTotal =
      Number.isFinite(Number(totalAmount)) ? Number(totalAmount)
        : Number.isFinite(Number(total)) ? Number(total)
          : 0;

    return {
      id,
      createdAt: now,
      updatedAt: now,
      items: Array.isArray(items) ? items : [],
      total: resolvedTotal,
      totalAmount: resolvedTotal,
      address: address ?? null,
      addressId: addressId ?? null,
      shipping: {
        status: 'Preparando',
        stepIndex: 0,
        updatedAt: now,
      },
    };
  },

  shippingSteps: ['Preparando', 'Despachado', 'En camino', 'En la puerta', 'Entregado'],
};
