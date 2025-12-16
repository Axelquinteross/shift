import * as Location from 'expo-location';

export const locationService = {
  // Solicitar permisos de ubicación
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  },

  // Obtener ubicación actual
  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permiso de ubicación denegado');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  },

  // Obtener dirección a partir de coordenadas (geocoding inverso)
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const address = results[0];
        return {
          street: `${address.street} ${address.streetNumber || ''}`.trim(),
          neighborhood: address.neighborhood || address.subregion || '',
          city: address.city || address.subregion || '',
          state: address.region || '',
          postalCode: address.postalCode || '',
          country: address.country || '',
          formattedAddress: this.formatAddress(address),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      throw error;
    }
  },

  // Formatear dirección para mostrar
  formatAddress(address) {
    const parts = [
      `${address.street} ${address.streetNumber || ''}`.trim(),
      address.neighborhood || address.subregion,
      address.city,
      address.region,
      address.postalCode,
    ].filter(Boolean);

    return parts.join(', ');
  },

  // Obtener coordenadas a partir de dirección (geocoding)
  async getCoordinatesFromAddress(address) {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      throw error;
    }
  },

  // Calcular distancia entre dos puntos
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  },

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  },
};
