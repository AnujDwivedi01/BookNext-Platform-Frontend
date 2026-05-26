import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import BookCard from '../components/BookCard';
import BookFormModal from '../components/BookFormModal';
import './Books.css';

export default function Books() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy]     = useState('newest');
  const [editBook, setEditBook] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { isAdmin, isLoggedIn } = useAuth();
  const { addItem }             = useCart();
  const toast                   = useToast();
  const navigate                = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await booksAPI.getAll();
      setBooks(res.data || []);
    } catch {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  // Derived categories from actual data
  const categories = useMemo(() => {
    const cats = [...new Set(books.map(b => b.category).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [books]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...books];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') {
      list = list.filter(b => b.category === category);
    }
    switch (sortBy) {
      case 'price-asc':  list.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-desc': list.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'title':      list.sort((a, b) => a.title?.localeCompare(b.title));  break;
      case 'newest':     list.sort((a, b) => (b.id || 0) - (a.id || 0));       break;
      default: break;
    }
    return list;
  }, [books, search, category, sortBy]);

  // ── Admin: delete book ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await booksAPI.delete(id);
      toast.success('Book deleted');
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Admin: open edit / add modal ────────────────────────────────────────────
  const handleEdit = (book) => { setEditBook(book); setShowForm(true); };
  const handleAdd  = ()     => { setEditBook(null);  setShowForm(true); };

  // ── Admin: save book form ───────────────────────────────────────────────────
  const handleFormSave = async (data) => {
    try {
      if (editBook) {
        await booksAPI.update(editBook.id, data);
        toast.success('Book updated');
      } else {
        await booksAPI.add(data);
        toast.success('Book added');
      }
      setShowForm(false);
      fetchBooks();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Save failed');
    }
  };

  // ── User: add to cart ───────────────────────────────────────────────────────
  const handleAddToCart = async (book) => {
    if (!isLoggedIn()) {
      toast.error('Please login to add books to cart');
      navigate('/login');
      return;
    }
    try {
      await addItem(book, 1);
      toast.success(`"${book.title}" added to cart!`);
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Could not add to cart');
    }
  };

  return (
    <div className="books-page">
      <div className="container">
        {/* Page header */}
        <div className="books-header fade-up">
          <div>
            <h1>Book Catalog</h1>
            <p className="text-dim">
              {loading ? 'Loading...' : `${filtered.length} book${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          {isAdmin() && (
            <button className="btn btn-gold" onClick={handleAdd}>
              + Add Book
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="books-toolbar fade-up">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search by title, author, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="filters">
            <select
              className="filter-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="title">A–Z Title</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="category-pills fade-up">
          {categories.map(c => (
            <button
              key={c}
              className={`pill ${category === c ? 'pill-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>No books found</h3>
            <p>{search || category !== 'All' ? 'Try adjusting your search or filters' : 'No books in catalog yet'}</p>
            {isAdmin() && (
              <button className="btn btn-gold" style={{ marginTop: 'var(--gap-lg)' }} onClick={handleAdd}>
                Add First Book
              </button>
            )}
          </div>
        ) : (
          <div className="books-grid">
            {filtered.map(book => (
              <BookCard
                key={book.id}
                book={book}
                isAdmin={isAdmin()}
                isLoggedIn={isLoggedIn()}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Book form modal */}
      {showForm && (
        <BookFormModal
          book={editBook}
          onSave={handleFormSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}