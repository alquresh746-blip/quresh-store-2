import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const productId = product._id || product.id;
      const existingItem = prevCart.find((item) => item.id === productId);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [
        ...prevCart,
        {
          id: product._id || product.id,
          name: product.name,
          category: product.category,
          price: typeof product.price === 'string'
            ? parseInt(product.price.replace(/,/g, ''))
            : Number(product.price),
          wholesalePrice: product.wholesalePrice || null,
          minWholesaleQty: product.minWholesaleQty || 5,
          isWholesaleAvailable: product.isWholesaleAvailable || false,
          image: product.images?.[0] || product.image,
          quantity,
          specs: product.specs || []
        }
      ];
    });
    setIsOpen(true);
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Get effective price per item (wholesale if eligible)
  const getEffectivePrice = (item) => {
    if (
      item.isWholesaleAvailable &&
      item.wholesalePrice &&
      item.quantity >= item.minWholesaleQty
    ) {
      return item.wholesalePrice;
    }
    return item.price;
  };

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + (getEffectivePrice(item) * item.quantity), 0);
  const deliveryFee = 0; // Free delivery
  const total = subtotal + deliveryFee;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getEffectivePrice,
    subtotal,
    deliveryFee,
    total,
    itemCount,
    isOpen,
    setIsOpen
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
