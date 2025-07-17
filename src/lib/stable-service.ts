import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Stable } from '@/types/stable';

const COLLECTION_NAME = 'stables';

// Convert Firestore timestamp to Date
function convertTimestampToDate(data: any): any {
  if (data && typeof data === 'object') {
    if (data.seconds) {
      return new Date(data.seconds * 1000);
    }
    if (data instanceof Timestamp) {
      return data.toDate();
    }
    // Handle nested objects
    const converted = { ...data };
    for (const key in converted) {
      if (converted[key] && typeof converted[key] === 'object') {
        converted[key] = convertTimestampToDate(converted[key]);
      }
    }
    return converted;
  }
  return data;
}

// Get all stables
export async function getAllStables(): Promise<Stable[]> {
  try {
    const stablesRef = collection(db, COLLECTION_NAME);
    const q = query(stablesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const stables: Stable[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stables.push({
        id: doc.id,
        ...convertTimestampToDate(data)
      } as Stable);
    });
    
    return stables;
  } catch (error) {
    console.error('Error getting stables:', error);
    throw error;
  }
}

// Get stable by ID
export async function getStableById(id: string): Promise<Stable | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertTimestampToDate(data)
      } as Stable;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting stable:', error);
    throw error;
  }
}

// Get stables by owner
export async function getStablesByOwner(userId: string): Promise<Stable[]> {
  try {
    const stablesRef = collection(db, COLLECTION_NAME);
    const q = query(
      stablesRef, 
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const stables: Stable[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stables.push({
        id: doc.id,
        ...convertTimestampToDate(data)
      } as Stable);
    });
    
    return stables;
  } catch (error) {
    console.error('Error getting stables by owner:', error);
    throw error;
  }
}

// Create a new stable
export async function createStable(stableData: Omit<Stable, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...stableData,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating stable:', error);
    throw error;
  }
}

// Update a stable
export async function updateStable(id: string, updates: Partial<Stable>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating stable:', error);
    throw error;
  }
}

// Delete a stable
export async function deleteStable(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting stable:', error);
    throw error;
  }
}

// Search stables
export async function searchStables(searchTerm: string): Promise<Stable[]> {
  try {
    // Note: Firestore doesn't have full-text search built-in
    // For now, we'll get all stables and filter client-side
    // In production, consider using Algolia or similar for better search
    const allStables = await getAllStables();
    
    const searchTermLower = searchTerm.toLowerCase();
    return allStables.filter(stable => 
      stable.name.toLowerCase().includes(searchTermLower) ||
      stable.description.toLowerCase().includes(searchTermLower) ||
      stable.location.toLowerCase().includes(searchTermLower)
    );
  } catch (error) {
    console.error('Error searching stables:', error);
    throw error;
  }
}

// Get featured stables
export async function getFeaturedStables(): Promise<Stable[]> {
  try {
    const stablesRef = collection(db, COLLECTION_NAME);
    const q = query(
      stablesRef, 
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    const querySnapshot = await getDocs(q);
    
    const stables: Stable[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stables.push({
        id: doc.id,
        ...convertTimestampToDate(data)
      } as Stable);
    });
    
    return stables;
  } catch (error) {
    console.error('Error getting featured stables:', error);
    throw error;
  }
}