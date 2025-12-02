
  
  

      
  // Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

  // Initialize cart
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  // Update cart count
  function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    document.getElementById("cartCount").innerText = totalItems;
  }
  
  // Render cart items
  function renderCart() {
    const cartContent = document.getElementById("cartContent");
    
    if (cart.length === 0) {
      cartContent.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <a href="userproducts.html"><button class="shop-btn"><i class="fas fa-shopping-bag"></i> Start Shopping</button></a>
        </div>
      `;
      return;
    }
    
    let subtotal = 0;
    let shipping = 0;
    
    const itemsHTML = cart.map((item, index) => {
      const quantity = item.quantity || 1;
      const itemSubtotal = item.price * quantity;
      const itemShipping = (item.shipping || 1600) * quantity;
      
      subtotal += itemSubtotal;
      shipping += itemShipping;
      
      return `
  <div class="cart-item">
    <div class="item-image">
      <img src="${item.img}" alt="${item.name}">
    </div>
    <div class="item-details">
      <h3>${item.name}</h3>
      <div class="item-price">₦${item.price.toLocaleString()}</div>
      <div class="item-actions">
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${index}, ${quantity - 1})">-</button>
          <input type="number" class="quantity-input" value="${quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
          <button class="quantity-btn" onclick="updateQuantity(${index}, ${quantity + 1})">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${index})">
          <i class="fas fa-trash"></i> Remove
        </button>
        <a href="userproducts.html?id=${item.id}" class="edit-price-btn">
          <i class="fas fa-edit"></i> Edit Price
        </a>
      </div>
    </div>
    <div class="item-subtotal">₦${itemSubtotal.toLocaleString()}</div>
  </div>
`;

    }).join('');
    
    const total = subtotal + shipping;
    
    cartContent.innerHTML = `
      <div class="cart-items">
        ${itemsHTML}
      </div>
      <div class="cart-summary">
        <h3 class="summary-title">Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal (${cart.reduce((total, item) => total + (item.quantity || 1), 0)} items)</span>
          <span>₦${subtotal.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span>Delivery</span>
          <span>₦${shipping.toLocaleString()}</span>
        </div>
        <div class="summary-row summary-total">
          <span>Total</span>
          <span>₦${total.toLocaleString()}</span>
        </div>

        <!-- Payment Method Selection -->
    <div style="margin-top: 20px;">
      <label><input type="radio" name="paymentMethod" value="naira" checked> Pay in Naira (₦)</label><br>
      <label><input type="radio" name="paymentMethod" value="foreign"> Pay in Foreign Currency ($/£/€)</label>
    </div>

        <button class="checkout-btn" onclick="checkout()">
      <i class="fas fa-credit-card"></i> Proceed to Checkout
    </button>
    <a href="userproducts.html" class="continue-shopping">
      <i class="fas fa-arrow-left"></i> Continue Shopping
    </a>
  </div>
`;
    
    // Save totals for checkout
    localStorage.setItem("checkoutTotal", total);
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  
  // Update item quantity
  function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) newQuantity = 1;
    
    cart[index].quantity = parseInt(newQuantity);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
    showToast('Cart updated');
  }
  
  // Remove item from cart
  function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
    showToast('Item removed from cart');
  }
  
  // Enhanced checkout function with proper redirect flow
// Enhanced checkout function with proper redirect handling
async function checkout() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  const originalText = checkoutBtn.innerHTML;
  
  // Show loading
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  checkoutBtn.disabled = true;

  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  const totalAmount = cart.reduce((sum, item) => {
    const qty = item.quantity || 1;
    return sum + (item.price * qty) + ((item.shipping || 1600) * qty);
  }, 0);

  if (cart.length === 0) {
    showToast('Your cart is empty');
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
    return;
  }

  if (totalAmount <= 0) {
    showToast('Invalid total amount');
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
    return;
  }

  try {
    // Get current user
    const user = auth.currentUser;
    const customerEmail = user ? user.email : "customer@alawusa.com";
    const customerName = user ? user.displayName : document.getElementById("userName").innerText || "Customer";
    const customerPhone = user ? user.phoneNumber : "08012345678";

    if (method === "naira") {
      // Generate unique transaction reference
      const txRef = "ALW_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      
      // Save transaction to Firebase before payment
      await saveTransactionToFirebase({
        tx_ref: txRef,
        amount: totalAmount,
        currency: "NGN",
        status: "initiated",
        customer: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone
        },
        cart: cart,
        created_at: new Date().toISOString()
      });

      // Store cart data for confirmation page BEFORE payment
      const cartDataForConfirmation = JSON.parse(JSON.stringify(cart));
      
      // Schedule cart clearing after 5 seconds
      setTimeout(() => {
        console.log("Clearing cart after 5 seconds...");
        localStorage.removeItem("cart");
        cart = [];
        updateCartCount();
        
        // Also clear from Firebase if user is logged in
        if (user) {
          db.collection("userCarts").doc(user.uid).delete().catch(err => 
            console.error("Error clearing Firebase cart:", err)
          );
        }
      }, 5000); // 5 seconds delay

      // Flutterwave payment
      if (typeof FlutterwaveCheckout === 'undefined') {
        showToast('Payment system loading, please try again');
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
        return;
      }

      // Store redirect information in localStorage before opening payment
      const redirectData = {
        shouldRedirect: true,
        redirectUrl: "payment-confirmation.html",
        txRef: txRef,
        cartData: cartDataForConfirmation,
        totalAmount: totalAmount,
        customer: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone
        },
        timestamp: Date.now()
      };
      localStorage.setItem('paymentRedirect', JSON.stringify(redirectData));

      FlutterwaveCheckout({
        public_key: "FLWPUBK-12f39e50a0c4450e5c4cfb2a3151a57a-X",
        tx_ref: txRef,
        amount: totalAmount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: customerEmail,
          phonenumber: customerPhone,
          name: customerName,
        },
        customizations: {
          title: "Alawusa Heritage",
          description: "Payment for items in cart",
          logo: "Alawusa heritage icon - Icon.png",
        },
        callback: async function (data) {
          console.log("Payment callback:", data);
          
          if (data.status === "successful") {
            try {
              // Update transaction in Firebase
              await updateTransactionStatus(txRef, "successful", data);
              
              showToast("Payment successful! Transaction ID: " + data.transaction_id);
              
              // Save order to Firebase
              const orderId = await saveOrderToFirebase({
                transaction_id: data.transaction_id,
                tx_ref: txRef,
                amount: totalAmount,
                currency: "NGN",
                status: "completed",
                customer: {
                  email: customerEmail,
                  name: customerName,
                  phone: customerPhone
                },
                items: cartDataForConfirmation,
                payment_details: data,
                created_at: new Date().toISOString()
              });
              
              // Save order details for confirmation page
              const lastOrder = {
                id: orderId,
                amount: totalAmount,
                items: cartDataForConfirmation,
                transactionId: data.transaction_id,
                txRef: txRef,
                customer: {
                  email: customerEmail,
                  name: customerName,
                  phone: customerPhone
                },
                timestamp: new Date().toISOString()
              };
              
              // Store in localStorage for confirmation page
              localStorage.setItem('lastOrder', JSON.stringify(lastOrder));
              
              // Force redirect with a small delay to ensure everything is saved
              setTimeout(() => {
                window.location.href = "payment-confirmation.html";
              }, 1000);
              
            } catch (firebaseError) {
              console.error("Firebase operations error:", firebaseError);
              // Even if Firebase fails, still redirect to confirmation with basic data
              const fallbackOrder = {
                id: "temp_" + Date.now(),
                amount: totalAmount,
                items: cartDataForConfirmation,
                transactionId: data.transaction_id,
                txRef: txRef,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem('lastOrder', JSON.stringify(fallbackOrder));
              
              setTimeout(() => {
                window.location.href = "payment-confirmation.html";
              }, 1000);
            }
            
          } else {
            // Update transaction status to failed
            await updateTransactionStatus(txRef, "failed", data);
            showToast("Payment was not successful. Please try again.");
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
            
            // Remove redirect data on failure
            localStorage.removeItem('paymentRedirect');
          }
        },
        onclose: async function() {
          showToast("Payment window closed.");
          // Update transaction status to cancelled
          await updateTransactionStatus(txRef, "cancelled");
          checkoutBtn.innerHTML = originalText;
          checkoutBtn.disabled = false;
          
          // Check if we should redirect (payment might have been successful but callback didn't fire)
          checkForPendingRedirect();
        },
      });

    } else {
      // For foreign currency payment - also implement the 5-second delay
      setTimeout(() => {
        console.log("Clearing cart for foreign currency payment after 5 seconds...");
        localStorage.removeItem("cart");
        cart = [];
        updateCartCount();
        
        const user = auth.currentUser;
        if (user) {
          db.collection("userCarts").doc(user.uid).delete().catch(err => 
            console.error("Error clearing Firebase cart:", err)
          );
        }
      }, 5000);
      
      // Redirect for foreign currency payment
      window.location.href = "usercheckout.html?amount=" + totalAmount;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    showToast("An error occurred during checkout. Please try again.");
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
  }
}

// Function to check for pending redirects when page loads
function checkForPendingRedirect() {
  const redirectData = JSON.parse(localStorage.getItem('paymentRedirect') || '{}');
  
  if (redirectData.shouldRedirect && redirectData.timestamp) {
    const timeSincePayment = Date.now() - redirectData.timestamp;
    
    // If payment was initiated less than 10 minutes ago, check transaction status
    if (timeSincePayment < 10 * 60 * 1000) {
      console.log("Found pending payment redirect, checking status...");
      
      // Check Firebase for transaction status
      db.collection("transactions").doc(redirectData.txRef).get()
        .then((doc) => {
          if (doc.exists) {
            const transaction = doc.data();
            if (transaction.status === "successful") {
              // Payment was successful, redirect to confirmation
              console.log("Payment was successful, redirecting...");
              localStorage.removeItem('paymentRedirect');
              window.location.href = redirectData.redirectUrl;
            }
          }
        })
        .catch((error) => {
          console.error("Error checking transaction status:", error);
        });
    } else {
      // Remove old redirect data
      localStorage.removeItem('paymentRedirect');
    }
  }
}

// Check for redirects when page loads
document.addEventListener('DOMContentLoaded', function() {
  checkForPendingRedirect();
});

// Improved Firebase helper functions with error handling
async function saveTransactionToFirebase(transactionData) {
  try {
    await db.collection("transactions").doc(transactionData.tx_ref).set(transactionData);
    console.log("Transaction saved to Firebase:", transactionData.tx_ref);
    return true;
  } catch (error) {
    console.error("Error saving transaction to Firebase:", error);
    // Don't throw error - allow payment to continue
    return false;
  }
}

async function updateTransactionStatus(txRef, status, paymentData = null) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (paymentData) {
      updateData.payment_response = paymentData;
    }
    
    await db.collection("transactions").doc(txRef).update(updateData);
    console.log("Transaction status updated:", txRef, status);
    return true;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return false;
  }
}

async function saveOrderToFirebase(orderData) {
  try {
    // Generate order ID
    const orderId = "ORD_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    
    await db.collection("orders").doc(orderId).set({
      ...orderData,
      order_id: orderId
    });
    
    console.log("Order saved to Firebase:", orderId);
    
    // Update user's orders if logged in (don't wait for this to complete)
    const user = auth.currentUser;
    if (user) {
      db.collection("users").doc(user.uid).collection("orders").doc(orderId).set({
        order_id: orderId,
        amount: orderData.amount,
        status: "completed",
        created_at: orderData.created_at
      }).catch(err => console.error("Error saving user order:", err));
    }
    
    return orderId;
  } catch (error) {
    console.error("Error saving order to Firebase:", error);
    throw error;
  }
}
async function updateTransactionStatus(txRef, status, paymentData = null) {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (paymentData) {
      updateData.payment_response = paymentData;
    }
    
    await db.collection("transactions").doc(txRef).update(updateData);
    console.log("Transaction status updated:", txRef, status);
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
}

async function saveOrderToFirebase(orderData) {
  try {
    // Generate order ID
    const orderId = "ORD_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    
    await db.collection("orders").doc(orderId).set({
      ...orderData,
      order_id: orderId
    });
    
    console.log("Order saved to Firebase:", orderId);
    
    // Update user's orders if logged in
    const user = auth.currentUser;
    if (user) {
      await db.collection("users").doc(user.uid).collection("orders").doc(orderId).set({
        order_id: orderId,
        amount: orderData.amount,
        status: "completed",
        created_at: orderData.created_at
      });
    }
    
    return orderId;
  } catch (error) {
    console.error("Error saving order to Firebase:", error);
    throw error;
  }
}

// Firebase Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log("User signed in:", user);
    document.getElementById("userName").textContent = user.displayName || user.email || "Customer";
    
    // Load user-specific cart if needed
    loadUserCart(user.uid);
  } else {
    // User is signed out
    console.log("User signed out");
    document.getElementById("userName").textContent = "Customer";
    
    // Use local cart
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    renderCart();
    updateCartCount();
  }
});

// Function to load user-specific cart from Firebase
async function loadUserCart(userId) {
  try {
    const userCartDoc = await db.collection("userCarts").doc(userId).get();
    if (userCartDoc.exists) {
      const userCart = userCartDoc.data().cart;
      if (userCart && userCart.length > 0) {
        cart = userCart;
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
        updateCartCount();
      }
    }
  } catch (error) {
    console.error("Error loading user cart:", error);
  }
}

// Function to save cart to Firebase
async function saveCartToFirebase(userId) {
  try {
    await db.collection("userCarts").doc(userId).set({
      cart: cart,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving cart to Firebase:", error);
  }
}

// Update cart functions to sync with Firebase
function updateCartFunctions() {
  const originalUpdateQuantity = updateQuantity;
  const originalRemoveItem = removeItem;
  
  updateQuantity = async function(index, newQuantity) {
    if (newQuantity < 1) newQuantity = 1;
    
    cart[index].quantity = parseInt(newQuantity);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Save to Firebase if user is logged in
    const user = auth.currentUser;
    if (user) {
      await saveCartToFirebase(user.uid);
    }
    
    renderCart();
    updateCartCount();
    showToast('Cart updated');
  };
  
  removeItem = async function(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Save to Firebase if user is logged in
    const user = auth.currentUser;
    if (user) {
      await saveCartToFirebase(user.uid);
    }
    
    renderCart();
    updateCartCount();
    showToast('Item removed from cart');
  };
}

// Initialize enhanced cart functions
updateCartFunctions();
  
  // Show toast notification
  function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Mobile Menu Functionality
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const closeMenu = document.getElementById('closeMenu');

  function openMobileMenu() {
    mobileSidebar.classList.add('active');
    mobileOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileSidebar.classList.remove('active');
    mobileOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  mobileMenu.addEventListener('click', openMobileMenu);
  closeMenu.addEventListener('click', closeMobileMenu);
  mobileOverlay.addEventListener('click', closeMobileMenu);

  // User Dropdown Functionality
  const userDropdownToggle = document.getElementById('userDropdownToggle');
  const userDropdown = document.getElementById('userDropdown');

  function toggleUserDropdown() {
    userDropdown.classList.toggle('active');
  }

  userDropdownToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleUserDropdown();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!userDropdown.contains(e.target) && !userDropdownToggle.contains(e.target)) {
      userDropdown.classList.remove('active');
    }
  });

  // Search functionality
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      const searchInput = document.getElementById('searchInput');
      if (searchInput.value.trim()) {
        // Trigger search
        const event = new Event('input');
        searchInput.dispatchEvent(event);
      }
    });
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'homepage.html';
      }
    });
  }

  // Close mobile menu when clicking on links
  const mobileLinks = document.querySelectorAll('.mobile-nav a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  
  // Initialize page
  document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    updateCartCount();
  });




    

