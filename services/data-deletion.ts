import { auth, db } from '@/config/firebase';
import { deleteUser } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from './storage';

/**
 * Kullanıcının tüm verilerini sil
 */
export async function deleteUserData(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    const userId = user.uid;

    // 1. Firestore'dan tüm kayıtları sil
    try {
      const recordsRef = collection(db, 'work_records');
      const q = query(recordsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'work_records', docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting Firestore records:', error);
      // Devam et, diğer verileri de silmeye çalış
    }

    // 2. Local storage'dan tüm verileri sil
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      // Diğer AsyncStorage anahtarlarını da temizle
      await AsyncStorage.multiRemove([
        'breakCounted',
        'app_settings',
        'last_sync',
      ]);
    } catch (error) {
      console.error('Error clearing local storage:', error);
      // Devam et
    }

    // 3. Firebase Authentication'dan kullanıcıyı sil
    try {
      await deleteUser(user);
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      // Kullanıcı son zamanlarda giriş yapmamışsa hata verebilir
      // Bu durumda sadece veriler silinmiş olur
      if (error.code === 'auth/requires-recent-login') {
        return { 
          success: false, 
          error: 'Recent login required. Please log out and log in again, then try deleting your account.' 
        };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user data:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}








