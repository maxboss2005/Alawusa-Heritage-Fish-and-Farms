// Cart Management Module
// Handles cart operations: add, remove, update, checkout

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Render cart items
function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  let subtotal = 0;
  let shippingTotal = 0;

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <h3>Your cart is empty</h3>
        <p>Add some products to your cart</p>
        <a href="products.html" class="continue-shopping">Browse Products</a>
      </div>
    `;
    updateCartSummary(0, 0, 0);
    updateCartCount();
    return;
  }

  cartContainer.innerHTML = '';

  cart.forEach((item, index) => {
    const itemSubtotal = item.price * item.quantity;
    const itemShipping = (item.shipping || 1600) * item.quantity;

    subtotal += itemSubtotal;
    shippingTotal += itemShipping;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="item-image">
        <img src="${item.image}" alt="${item.name}" class="item-image">
      </div>
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>Fresh and healthy</p>
      </div>
      <div class="item-price">₦${item.price.toLocaleString()}</div>
      <div class="item-qty">
        <div class="quantity-controls">
          <button class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
          <input type="text" class="qty-input" value="${item.quantity}" readonly>
          <button class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
        </div>
      </div>
      <div class="item-subtotal">₦${itemSubtotal.toLocaleString()}</div>
      <div class="item-action">
        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
      </div>
    `;
    cartContainer.appendChild(cartItem);
  });

  const total = subtotal + shippingTotal;
  updateCartSummary(subtotal, shippingTotal, total);
  updateCartCount();
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart summary
function updateCartSummary(subtotal, shipping, total) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalText = document.getElementById('subtotal-text');
  const subtotalAmount = document.getElementById('subtotal-amount');
  const shippingAmount = document.getElementById('shipping-amount');
  const totalAmount = document.getElementById('total-amount');

  if (subtotalText) subtotalText.textContent = `Subtotal (${totalItems} items)`;
  if (subtotalAmount) subtotalAmount.textContent = `₦${subtotal.toLocaleString()}`;
  if (shippingAmount) shippingAmount.textContent = `₦${shipping.toLocaleString()}`;
  if (totalAmount) totalAmount.textContent = `₦${total.toLocaleString()}`;

  updateCartCount();
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update item quantity
function updateQuantity(index, newQuantity) {
  if (newQuantity < 1) {
    removeItem(index);
    return;
  }

  cart[index].quantity = newQuantity;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// Remove item from cart
function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// Update cart count in header
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = totalItems;
  }
}

// Checkout function
async function checkout() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  const originalText = checkoutBtn.innerHTML;

  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  checkoutBtn.disabled = true;

  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethodInput) {
    showToast('Please select a payment method');
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
    return;
  }

  const method = paymentMethodInput.value;
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
    if (method === 'naira') {
      processNairaPayment(totalAmount, checkoutBtn, originalText);
    } else {
      processInternationalPayment(totalAmount, checkoutBtn, originalText);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showToast('An error occurred during checkout. Please try again.');
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
  }
}

// Process Naira payment
function processNairaPayment(totalAmount, checkoutBtn, originalText) {
  const txRef = 'ALW_GUEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const lastOrder = {
    id: txRef,
    amount: totalAmount,
    items: [...cart],
    timestamp: new Date().toISOString(),
    customer_type: 'guest'
  };
  localStorage.setItem('lastOrder', JSON.stringify(lastOrder));

  const transactionData = {
    tx_ref: txRef,
    amount: totalAmount,
    currency: 'NGN',
    status: 'initiated',
    customer: {
      email: 'guest@alawusa.com',
      name: 'Guest Customer',
      phone: '08000000000'
    },
    cart,
    created_at: new Date().toISOString(),
    user_type: 'guest'
  };
  localStorage.setItem('currentTransaction', JSON.stringify(transactionData));

  if (typeof FlutterwaveCheckout === 'undefined') {
    showToast('Payment system loading. Please try again.');
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
    return;
  }

  FlutterwaveCheckout({
    public_key: 'FLWPUBK-12f39e50a0c4450e5c4cfb2a3151a57a-X',
    tx_ref: txRef,
    amount: totalAmount,
    currency: 'NGN',
    payment_options: 'card, banktransfer, ussd, mobilemoney',
    customer: {
      email: 'guest@alawusa.com',
      phonenumber: '08000000000',
      name: 'Guest Customer'
    },
    customizations: {
      title: 'Alawusa Heritage',
      description: 'Payment for items in cart',
      logo: 'Alawusa heritage icon - Icon.png'
    },
    callback: function (data) {
      if (data.status === 'successful') {
        updateGuestTransactionStatus(txRef, 'successful', data);
        showToast('Payment successful! Transaction ID: ' + data.transaction_id);

        saveGuestOrder({
          transaction_id: data.transaction_id,
          tx_ref: txRef,
          amount: totalAmount,
          currency: 'NGN',
          status: 'completed',
          customer: {
            email: 'guest@alawusa.com',
            name: 'Guest Customer',
            phone: '08000000000'
          },
          items: cart,
          payment_details: data,
          created_at: new Date().toISOString(),
          user_type: 'guest'
        });

        localStorage.removeItem('cart');
        cart = [];
        updateCartCount();

        setTimeout(() => {
          window.location.href = 'guest-payment-confirmation.html';
        }, 2000);
      } else {
        updateGuestTransactionStatus(txRef, 'failed', data);
        showToast('Payment failed. Please try again.');
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
      }
    },
    onclose: function () {
      showToast('Payment window closed.');
      updateGuestTransactionStatus(txRef, 'cancelled');
      checkoutBtn.innerHTML = originalText;
      checkoutBtn.disabled = false;
    }
  });
}

// Process international payment
function processInternationalPayment(totalAmount, checkoutBtn, originalText) {
  localStorage.setItem('checkoutTotal', totalAmount);
  localStorage.setItem('paymentMethod', 'international');
  localStorage.setItem('currency', 'USD');

  const lastOrder = {
    id: 'FOREIGN_' + Date.now(),
    amount: totalAmount,
    items: [...cart],
    timestamp: new Date().toISOString(),
    customer_type: 'guest'
  };
  localStorage.setItem('lastOrder', JSON.stringify(lastOrder));

  setTimeout(() => {
    window.location.href = 'checkout.html';
  }, 1000);
}

// Update guest transaction status
function updateGuestTransactionStatus(txRef, status, paymentData = null) {
  try {
    const transactions = JSON.parse(localStorage.getItem('guestTransactions')) || [];
    const transactionIndex = transactions.findIndex(t => t.tx_ref === txRef);

    if (transactionIndex !== -1) {
      transactions[transactionIndex].status = status;
      transactions[transactionIndex].updated_at = new Date().toISOString();
      if (paymentData) {
        transactions[transactionIndex].payment_response = paymentData;
      }
    } else {
      const currentTransaction = JSON.parse(localStorage.getItem('currentTransaction'));
      if (currentTransaction) {
        currentTransaction.status = status;
        currentTransaction.updated_at = new Date().toISOString();
        if (paymentData) {
          currentTransaction.payment_response = paymentData;
        }
        transactions.push(currentTransaction);
      }
    }

    localStorage.setItem('guestTransactions', JSON.stringify(transactions));
  } catch (error) {
    console.error('Error updating transaction status:', error);
  }
}

// Save guest order
function saveGuestOrder(orderData) {
  try {
    const orderId = 'ORD_GUEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const guestOrders = JSON.parse(localStorage.getItem('guestOrders')) || [];
    const orderWithId = { ...orderData, order_id: orderId };

    guestOrders.push(orderWithId);
    localStorage.setItem('guestOrders', JSON.stringify(guestOrders));

    return orderId;
  } catch (error) {
    console.error('Error saving guest order:', error);
    throw error;
  }
}

// Show toast notification
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', renderCart);

// Export functions for use in HTML
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.checkout = checkout;
