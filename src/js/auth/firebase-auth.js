// Firebase Authentication Module
// Handles all auth operations: login, register, password reset, Google auth

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js';
import {
  getAuth,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  fetchSignInMethodsForEmail,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore,
  setDoc,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDuxTHLfwiETTMO6Dx7YMehngZqWLgUlH0',
  authDomain: 'alawusa-heritage-website.firebaseapp.com',
  projectId: 'alawusa-heritage-website',
  storageBucket: 'alawusa-heritage-website.firebasestorage.app',
  messagingSenderId: '857988164081',
  appId: '1:857988164081:web:ccac1200d344a8bd82bc50',
  measurementId: 'G-TJQJMVVMZG'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

// Utility: Display message to user
function showMessage(message, elementId) {
  const messageDiv = document.getElementById(elementId);
  if (!messageDiv) return;

  messageDiv.style.display = 'block';
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = '1';

  setTimeout(() => {
    messageDiv.style.opacity = '0';
  }, 5000);
}

// Export auth instances
export { auth, db };

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem('loggedInUserId', user.uid);
    if (user.email) {
      localStorage.setItem('userEmail', user.email);
    }

    getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
      if (docSnap.exists() && docSnap.data().name) {
        localStorage.setItem('userName3', docSnap.data().name);
      }
    });
  } else {
    localStorage.removeItem('loggedInUserId');
  }
});

// Sign in with email and password
export async function signInWithEmail(email, password, rememberMe) {
  try {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
}

// Register handler
const signUpBtn = document.getElementById('submitRegister');
if (signUpBtn) {
  signUpBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const name = document.getElementById('registerName').value.trim();

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        showMessage('This email is already registered. Please log in instead.', 'signUpMessage');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: new Date(),
        provider: 'email',
        role: 'user'
      });

      await sendEmailVerification(user);
      showMessage('Verification email sent! Check spam folder if needed.', 'signUpMessage');
      await signOut(auth);
    } catch (error) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Email already in use. Please log in instead.'
        : 'Unable to register. Please try again.';
      showMessage(errorMessage, 'signUpMessage');
    }
  });
}

// Login handler
const signInBtn = document.getElementById('submitSignIn');
if (signInBtn) {
  signInBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showMessage('Please verify your email before logging in.', 'signInMessage');
        await signOut(auth);
        return;
      }

      showMessage('Login successful!', 'signInMessage');
      localStorage.setItem('loggedInUserId', user.uid);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().name) {
        localStorage.setItem('userName3', userDoc.data().name);
      }

      setTimeout(() => {
        window.location.href = 'userproducts.html';
      }, 1000);
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      showMessage(errorMessage, 'signInMessage');
    }
  });
}

// Forgot password handler
const forgotPasswordBtn = document.getElementById('forgotPassword');
if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();

    if (!email) {
      showMessage('Please enter your email to reset your password.', 'signInMessage');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        showMessage(`Password reset email sent to ${email}. Check spam folder if needed.`, 'signInMessage');
      })
      .catch((error) => {
        let errorMessage = 'Unable to process request.';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        }
        showMessage(errorMessage, 'signInMessage');
      });
  });
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Google login handler
const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    try {
      const rememberMe = document.getElementById('rememberMe')?.checked || false;
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        showMessage('Access denied. Only registered Google accounts allowed.', 'signInMessage');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', user.email);
      }

      showMessage(`Welcome back, ${user.displayName}!`, 'signInMessage');
      localStorage.setItem('loggedInUserId', user.uid);

      setTimeout(() => {
        window.location.href = 'userproducts.html';
      }, 1000);
    } catch (error) {
      const errorMessage = error.code === 'auth/account-exists-with-different-credential'
        ? 'This email uses a different sign-in method. Please use email/password login.'
        : 'Error signing in. Please try again.';
      showMessage(errorMessage, 'signInMessage');
    }
  });
}

// Google register handler
const googleRegisterBtn = document.getElementById('googleRegisterBtn');
if (googleRegisterBtn) {
  googleRegisterBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (methods.length > 0) {
        showMessage('This Google account is already registered. Please log in.', 'signUpMessage');
        await signOut(auth);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        showMessage('This Google account is already registered. Please log in.', 'signUpMessage');
        await signOut(auth);
        return;
      }

      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        createdAt: new Date(),
        provider: 'google',
        role: 'user'
      });

      showMessage(`Welcome ${user.displayName}! Your account is registered.`, 'signUpMessage');
      localStorage.setItem('loggedInUserId', user.uid);
      window.location.href = 'userproducts.html';
    } catch (error) {
      const errorMessage = error.code === 'auth/account-exists-with-different-credential'
        ? 'This email is linked to another account. Please sign in.'
        : 'Error signing up. Please try again.';
      showMessage(errorMessage, 'signUpMessage');
    }
  });
}

// Check if user is admin
export async function checkIfUserIsAdmin() {
  try {
    const user = auth.currentUser;
    const userId = user?.uid || localStorage.getItem('loggedInUserId');

    if (!userId) return false;

    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) return true;

    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && (userDoc.data().role === 'admin' || userDoc.data().role === 'Admin');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get user role
export async function getUserRole() {
  try {
    const user = auth.currentUser;
    const userId = user?.uid || localStorage.getItem('loggedInUserId');

    if (!userId) return 'guest';

    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) return 'admin';

    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().role || 'user' : 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

// Get combined user data
export async function getUserData() {
  try {
    const user = auth.currentUser;
    const userId = user?.uid || localStorage.getItem('loggedInUserId');

    if (!userId) return null;

    const result = {
      id: userId,
      isAdmin: false,
      name: '',
      email: '',
      role: 'user'
    };

    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      result.isAdmin = true;
      result.role = 'admin';
      result.name = adminData.name || '';
      result.email = adminData.email || '';
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (!result.name) result.name = userData.name || '';
      if (!result.email) result.email = userData.email || '';
      if (userData.role === 'admin' || userData.role === 'Admin') {
        result.isAdmin = true;
        result.role = userData.role;
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// Logout
export async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem('loggedInUserId');

    const signInMessage = document.getElementById('signInMessage');
    if (signInMessage) {
      showMessage('Logged out successfully.', 'signInMessage');
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}
