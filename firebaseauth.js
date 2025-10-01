// Import the functions you need from the SDKs you need
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
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

function showMessage(message, divId) {
  var messageDiv = document.getElementById(divId);
  messageDiv.style.display = 'block';
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function(){
      messageDiv.style.opacity = 0;
  },5000);
}

// ---------------- REGISTER ----------------
const signUp = document.getElementById('submitRegister');
signUp.addEventListener('click', (event) => {
  event.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const name = document.getElementById('registerName').value;

  const auth = getAuth();
  const db = getFirestore();

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      // Save to Firestore
      const userData = { email: email, name: name };
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, userData);

      // Send email verification
      await sendEmailVerification(user);
      showMessage("Verification email sent! Please check your inbox/spam.", "signUpMessage");

      // Sign out until verified
      await signOut(auth);

    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
          showMessage('Email already in use. Please use a different email.', 'signUpMessage');
      } else {
          showMessage('Unable to create user: ' + error.message, 'signUpMessage');
      }
    });
});

// ---------------- LOGIN ----------------
const signIn = document.getElementById('submitSignIn');
signIn.addEventListener('click', (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const auth = getAuth();

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (!user.emailVerified) {
        showMessage("Please verify your email before logging in.", "signInMessage");
        signOut(auth);
        return;
      }

      showMessage("Login successful!", "signInMessage");
      localStorage.setItem("loggedInUserId", user.uid);
      window.location.href = "homepage.html"; // Redirect to homepage
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/invalid-credential') {
          showMessage('Incorrect Email or Password. Please try again.', 'signInMessage');
      } else {
          showMessage('Account does not exist. Please register.', 'signInMessage');
      }
    });
});


// ---------------- FORGOT PASSWORD ----------------
const forgotPasswordLink = document.getElementById('forgotPassword');

forgotPasswordLink.addEventListener('click', (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const auth = getAuth();

  if (!email) {
    showMessage("Please enter your email to reset your password.", "signInMessage");
    return;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      showMessage(`Password reset email sent to ${email}. Check your inbox! Else check spam folder.`, "signInMessage");
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/user-not-found') {
        showMessage("No account found with this email.", "signInMessage");
      } else if (errorCode === 'auth/invalid-email') {
        showMessage("Invalid email address.", "signInMessage");
      } else {
        showMessage("Error: " + error.message, "signInMessage");
      }
    });
});


