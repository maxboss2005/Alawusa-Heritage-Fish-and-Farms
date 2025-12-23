// Import the functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
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
  onAuthStateChanged // ✅ Added for real-time auth state
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { 
  getFirestore, 
  setDoc, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDuxTHLfwiETTMO6Dx7YMehngZqWLgUlH0",
  authDomain: "alawusa-heritage-website.firebaseapp.com",
  projectId: "alawusa-heritage-website",
  storageBucket: "alawusa-heritage-website.firebasestorage.app",
  messagingSenderId: "857988164081",
  appId: "1:857988164081:web:ccac1200d344a8bd82bc50",
  measurementId: "G-TJQJMVVMZG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

// Utility: Show message
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) {
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.opacity = 0;
    }, 5000);
  }
}

// Export auth instance for use in other files
export { auth, db };

// ---------------- AUTH STATE LISTENER ----------------
// This helps keep the user logged in across pages
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    localStorage.setItem('loggedInUserId', user.uid);
    
    // Also store user email for display
    if (user.email) {
      localStorage.setItem('userEmail', user.email);
    }
    
    // Get user data from Firestore for name display
    getDoc(doc(db, "users", user.uid)).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.name) {
          localStorage.setItem('userName3', userData.name);
        }
      }
    });
  } else {
    // User is signed out
    localStorage.removeItem('loggedInUserId');
  }
});

export async function signInWithEmail(email, password, rememberMe) {
  try {
    // Set persistence based on "Remember me" selection
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
}

// ---------------- REGISTER ----------------
const signUp = document.getElementById("submitRegister");
if (signUp) {
  signUp.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const name = document.getElementById("registerName").value;

    try {
      // ✅ Step 1: Check if email is already used (any provider)
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        showMessage(
          "This email is already used for an existing account. Please log in instead.",
          "signUpMessage"
        );
        return;
      }

      // ✅ Step 2: Create the new account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Step 3: Save user data to Firestore WITH DEFAULT ROLE
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        createdAt: new Date(),
        provider: "email",
        role: "user" // 👈 Default role for new users
      });

      // ✅ Step 4: Send verification email
      await sendEmailVerification(user);
      showMessage("Verification email sent! Can't find email, check spam folder and mark as Not Spam.", "signUpMessage");

      // ✅ Step 5: Sign out until verified
      await signOut(auth);

    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/email-already-in-use") {
        showMessage("Email already in use. Please log in instead.", "signUpMessage");
      } else {
        showMessage("Unable to register user", "signUpMessage");
      }
    }
  });
}

// ---------------- LOGIN ----------------
const signIn = document.getElementById("submitSignIn");
if (signIn) {
  signIn.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe") ? document.getElementById("rememberMe").checked : false;

    try {
      // Save email to localStorage for convenience (like Jumia does)
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Set persistence based on "Remember me" selection
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showMessage("Please verify your email before logging in.", "signInMessage");
        await signOut(auth);
        return;
      }

      showMessage("Login successful!", "signInMessage");
      localStorage.setItem("loggedInUserId", user.uid);
      
      // Get user data for name display
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.name) {
          localStorage.setItem('userName3', userData.name);
        }
      }
      
      // Redirect after a brief delay
      setTimeout(() => {
        window.location.href = "userproducts.html";
      }, 1000);
      
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-credential") {
        showMessage("Incorrect Email or Password. Please try again.", "signInMessage");
      } else if (errorCode === "auth/too-many-requests") {
        showMessage("Too many failed attempts. Please try again later.", "signInMessage");
      } else if (errorCode === "auth/invalid-email") {
        showMessage("Invalid email address.", "signInMessage");
      } else {
        showMessage("Login failed. Please try again.", "signInMessage");
      }
    }
  });
}

// ---------------- FORGOT PASSWORD ----------------
const forgotPasswordLink = document.getElementById("forgotPassword");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;

    if (!email) {
      showMessage("Please enter your email to reset your password.", "signInMessage");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        showMessage(
          `Password reset email sent to ${email}. Can't find email, check spam folder and mark as Not Spam.`,
          "signInMessage"
        );
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === "auth/user-not-found") {
          showMessage("No account found with this email.", "signInMessage");
        } else if (errorCode === "auth/invalid-email") {
          showMessage("Invalid email address.", "signInMessage");
        } else {
          showMessage("Error: Unable to proceed", "signInMessage");
        }
      });
  });
}

// 🔑 Google Auth Provider
const provider = new GoogleAuthProvider();

// --- Google Login ---
const googleLoginBtn = document.getElementById("googleLoginBtn");
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      // Check "Remember me" for Google login too
      const rememberMe = document.getElementById("rememberMe") ? document.getElementById("rememberMe").checked : false;
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✅ Check if the Google email exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Email not registered
        await signOut(auth);
        showMessage(
          "Access denied. Only registered Google accounts are allowed to log in.",
          "signInMessage"
        );
        return;
      }

      // Save email for convenience
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', user.email);
      }

      // ✅ Login success
      showMessage(`Welcome back, ${user.displayName}!`, "signInMessage");
      localStorage.setItem("loggedInUserId", user.uid);
      
      setTimeout(() => {
        window.location.href = "userproducts.html";
      }, 1000);

    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/account-exists-with-different-credential") {
        showMessage(
          "An account already exists with this Google email but uses a different sign-in method. Please use email/password login instead.",
          "signInMessage"
        );
      } else {
        showMessage("Error signing in", "signInMessage");
      }
    }
  });
}

// --- Google Register ---
const googleRegisterBtn = document.getElementById("googleRegisterBtn");
if (googleRegisterBtn) {
  googleRegisterBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✅ Step 1: Check if this email already exists in Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (methods.includes("google.com") || methods.length > 0) {
        // Already registered with Google or another method
        showMessage(
          "This Google account is already registered. Please log in instead.",
          "signUpMessage"
        );
        await signOut(auth);
        return;
      }

      // ✅ Step 2: Check if already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        showMessage(
          "This Google account is already registered. Please log in instead.",
          "signUpMessage"
        );
        await signOut(auth);
        return;
      }

      // ✅ Step 3: Register new Google user
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        createdAt: new Date(),
        provider: "google",
        role: "user" // 👈 Default role for Google users
      });

      showMessage(`Welcome ${user.displayName}! Your Google account has been registered.`, "signUpMessage");
      localStorage.setItem("loggedInUserId", user.uid);
      window.location.href = "userproducts.html";

    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/account-exists-with-different-credential") {
        showMessage(
          "This Google email is already linked to another account. Please sign in instead.",
          "signUpMessage"
        );
      } else {
        showMessage("Error signing up", "signUpMessage");
      }
    }
  });
}

// ---------------- ADMIN CHECK FUNCTIONS ----------------

// Function to check if current user is admin (checks admins collection first)
export async function checkIfUserIsAdmin() {
  try {
    const user = auth.currentUser;
    const userId = user ? user.uid : localStorage.getItem('loggedInUserId');
    
    if (!userId) return false;
    
    console.log("🔍 Checking admin status for user:", userId);
    
    // FIRST: Check admins collection (as per your Firebase rules)
    try {
      const adminDocRef = doc(db, "admins", userId);
      const adminDoc = await getDoc(adminDocRef);
      
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        console.log("✅ Found in admins collection:", adminData);
        return true; // User is in admins collection = admin
      }
    } catch (error) {
      console.log("No admin record in admins collection:", error.message);
    }
    
    // SECOND: Check users collection as fallback (for users with role field)
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("📋 User data from users collection:", userData);
        
        // Check if user has admin role in users collection
        if (userData.role === "admin" || userData.role === "Admin") {
          return true;
        }
      }
    } catch (error) {
      console.log("Error checking users collection:", error.message);
    }
    
    console.log("❌ User is not an admin");
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Function to get user role
export async function getUserRole() {
  try {
    const user = auth.currentUser;
    const userId = user ? user.uid : localStorage.getItem('loggedInUserId');
    
    if (!userId) return "guest";
    
    // Check admins collection first
    const adminDocRef = doc(db, "admins", userId);
    const adminDoc = await getDoc(adminDocRef);
    
    if (adminDoc.exists()) {
      return "admin";
    }
    
    // Check users collection
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role || "user";
    }
    
    return "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user";
  }
}

// Function to get combined user data from both collections
export async function getUserData() {
  try {
    const user = auth.currentUser;
    const userId = user ? user.uid : localStorage.getItem('loggedInUserId');
    
    if (!userId) return null;
    
    const result = {
      id: userId,
      isAdmin: false,
      name: "",
      email: "",
      role: "user"
    };
    
    // Check admins collection
    const adminDocRef = doc(db, "admins", userId);
    const adminDoc = await getDoc(adminDocRef);
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      result.isAdmin = true;
      result.role = "admin";
      result.name = adminData.name || "";
      result.email = adminData.email || "";
    }
    
    // Check users collection and merge data
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Only override if not already set from admins collection
      if (!result.name && userData.name) result.name = userData.name;
      if (!result.email && userData.email) result.email = userData.email;
      
      // If user has admin role in users collection, mark as admin
      if (userData.role === "admin" || userData.role === "Admin") {
        result.isAdmin = true;
        result.role = userData.role;
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

// ---------------- LOGOUT ----------------
export async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem('loggedInUserId');
    // Don't remove rememberedEmail - that's the point of "Remember me"
    
    // Show message if on login page
    const signInMessage = document.getElementById("signInMessage");
    if (signInMessage) {
      showMessage("Logged out successfully.", "signInMessage");
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}