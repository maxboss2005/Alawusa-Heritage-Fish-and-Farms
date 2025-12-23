// shared.js
const ORDER_STATUS = {
    AWAITING_PAYMENT: 'awaiting_payment',
    ORDERED: 'ordered',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDuxTHLfwiETTMO6Dx7YMehngZqWLgUlH0",
    authDomain: "alawusa-heritage-website.firebaseapp.com",
    projectId: "alawusa-heritage-website",
    storageBucket: "alawusa-heritage-website.firebasestorage.app",
    messagingSenderId: "857988164081",
    appId: "1:857988164081:web:ccac1200d344a8bd82bc50",
    measurementId: "G-TJQJMVVMZG"
};

// Common utility functions
function formatCurrency(amount, currency = 'NGN') {
    const symbols = { 'NGN': '₦', 'USD': '$', 'GBP': '£', 'EUR': '€' };
    return `${symbols[currency] || '₦'}${parseFloat(amount || 0).toLocaleString()}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function saveRecentOrder(orderId, phone, name) {
    const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
    recentOrders.unshift({
        orderId,
        phone,
        name,
        date: new Date().toISOString()
    });
    // Keep only last 5 orders
    localStorage.setItem('recentOrders', JSON.stringify(recentOrders.slice(0, 5)));
}