import {
    ref as dbRef,
    onValue,
    push,
    remove,
    set
} from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, database, storage } from '../config/firebase';

const ensureAuthUid = (uid) => {
  const resolved = uid ?? auth?.currentUser?.uid;
  if (!resolved) throw new Error('Usuario no autenticado');
  return resolved;
};

const uriToBlob = (uri) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        resolve(xhr.response);
      };
      xhr.onerror = () => {
        reject(new Error('No se pudo leer el archivo de imagen'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    } catch (e) {
      reject(e);
    }
  });
};

const uploadImageAsync = async (uri, path) => {
  const blob = await uriToBlob(uri);
  const imgRef = storageRef(storage, path);
  try {
    await uploadBytes(imgRef, blob, { contentType: 'image/jpeg' });
  } catch (e) {
    console.error('Storage upload error:', {
      code: e?.code,
      message: e?.message,
      serverResponse: e?.serverResponse,
    });
    throw e;
  }
  try {
    blob?.close?.();
  } catch {
    // ignore
  }
  return await getDownloadURL(imgRef);
};

export const listingsService = {
  async createListing({ userId, title, price, description, photoUris }) {
    const uid = ensureAuthUid(userId);
    const listingsRef = dbRef(database, 'listings');
    const newListingRef = push(listingsRef);
    const listingId = newListingRef.key;

    if (!listingId) throw new Error('No se pudo generar ID de publicación');

    const createdAt = new Date().toISOString();

    const normalizedTitle = String(title ?? '').trim();
    const normalizedDescription = String(description ?? '').trim();
    const normalizedPrice = Number(price);

    const uris = Array.isArray(photoUris) ? photoUris.filter(Boolean) : [];

    const photoUrls = [];
    for (let i = 0; i < uris.length; i += 1) {
      const uri = uris[i];
      try {
        const url = await uploadImageAsync(uri, `listings/${uid}/${listingId}/${i}.jpg`);
        photoUrls.push(url);
      } catch (e) {
        console.error('Listing photo upload failed:', e);
        break;
      }
    }

    const listing = {
      id: listingId,
      userId: uid,
      title: normalizedTitle,
      description: normalizedDescription,
      price: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
      photos: photoUrls,
      photoUploadFailed: uris.length > 0 && photoUrls.length === 0,
      photoUploadPartial: uris.length > 0 && photoUrls.length > 0 && photoUrls.length < uris.length,
      createdAt,
    };

    await set(dbRef(database, `listings/${listingId}`), listing);
    await set(dbRef(database, `listingsByUser/${uid}/${listingId}`), listing);

    return listing;
  },

  onMyListingsChange(userId, callback) {
    const uid = ensureAuthUid(userId);
    const myRef = dbRef(database, `listingsByUser/${uid}`);

    const unsubscribe = onValue(myRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const data = snapshot.val() ?? {};
      const list = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .sort((a, b) => {
          const aMs = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bMs = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bMs - aMs;
        });

      callback(list);
    });

    return unsubscribe;
  },

  async deleteListing({ userId, listingId }) {
    const uid = ensureAuthUid(userId);
    if (!listingId) return;

    await remove(dbRef(database, `listings/${listingId}`));
    await remove(dbRef(database, `listingsByUser/${uid}/${listingId}`));
  },
};
