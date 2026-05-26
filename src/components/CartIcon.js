import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartIcon.css';

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link to="/cart" className="cart-icon-link" title="View Cart">
      <span className="cart-icon-emoji">🛒</span>
      {totalItems > 0 && (
        <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
      )}
    </Link>
  );
}