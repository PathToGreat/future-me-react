import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { shouldAutoComplete, completeCommitment } from './commitmentIntentSystem';

const COMMITMENTS_COLLECTION = 'commitments';
const REFLECTION_DISMISSALS_COLLECTION = 'reflectionDismissals';

export async function saveCommitment(commitment) {
  if (!commitment || !commitment.userId) {
    return null;
  }

  try {
    const commitmentRef = doc(db, COMMITMENTS_COLLECTION, commitment.id);
    await setDoc(commitmentRef, {
      ...commitment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return commitment;
  } catch (error) {
    console.log('[Commitment] Storage error:', error.message);
    return null;
  }
}

export async function getActiveCommitment(userId) {
  if (!userId) {
    return null;
  }

  try {
    const commitmentsRef = collection(db, COMMITMENTS_COLLECTION);
    const q = query(
      commitmentsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('startedAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const commitment = snapshot.docs[0].data();
    
    if (shouldAutoComplete(commitment)) {
      const completed = completeCommitment(commitment);
      await updateCommitmentStatus(commitment.id, completed);
      return null;
    }
    
    return commitment;
  } catch (error) {
    console.log('[Commitment] Fetch error:', error.message);
    return null;
  }
}

export async function updateCommitmentStatus(commitmentId, updates) {
  if (!commitmentId) {
    return false;
  }

  try {
    const commitmentRef = doc(db, COMMITMENTS_COLLECTION, commitmentId);
    await updateDoc(commitmentRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.log('[Commitment] Update error:', error.message);
    return false;
  }
}

export async function getCommitmentHistory(userId, limitCount = 10) {
  if (!userId) {
    return [];
  }

  try {
    const commitmentsRef = collection(db, COMMITMENTS_COLLECTION);
    const q = query(
      commitmentsRef,
      where('userId', '==', userId),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.log('[Commitment] History fetch error:', error.message);
    return [];
  }
}

export async function hasUserDismissedReflection(userId) {
  if (!userId) {
    return false;
  }

  try {
    const dismissalRef = doc(db, REFLECTION_DISMISSALS_COLLECTION, userId);
    const snapshot = await getDoc(dismissalRef);
    
    if (!snapshot.exists()) {
      return false;
    }

    return snapshot.data().permanentlyDismissed === true;
  } catch (error) {
    console.log('[Commitment] Dismissal check error:', error.message);
    return false;
  }
}

export async function setReflectionPermanentlyDismissed(userId) {
  if (!userId) {
    return false;
  }

  try {
    const dismissalRef = doc(db, REFLECTION_DISMISSALS_COLLECTION, userId);
    await setDoc(dismissalRef, {
      permanentlyDismissed: true,
      dismissedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.log('[Commitment] Dismissal save error:', error.message);
    return false;
  }
}
