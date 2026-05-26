import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Technology', 'Romance', 'Mystery', 'Biography', 'Self-Help', 'Other'];

export default function BookFormModal({ book, onSave, onClose }) {
  const [form, setForm]     = useState({
    title: '', author: '', category: 'Fiction', price: '', stock: '', isbn: '', coverUrl: '', id: undefined
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      // Load from localStorage if available
      const storedIsbn = localStorage.getItem(`book_isbn_${book.id}`);
      const storedCoverUrl = localStorage.getItem(`book_cover_${book.id}`);
      
      setForm({
        id:       book.id,
        title:    book.title    || '',
        author:   book.author   || '',
        category: book.category || 'Fiction',
        price:    book.price    !== undefined ? book.price : '',
        stock:    book.stock    !== undefined ? book.stock : '',
        isbn:     book.isbn || storedIsbn || '',
        coverUrl: book.coverUrl || storedCoverUrl || '',
      });
    }
  }, [book]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.price || form.stock === '') return;
    setLoading(true);
    
    // Prepare data - include isbn and coverUrl if provided
    const submitData = {
      title: form.title,
      author: form.author,
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    };
    
    // Add optional fields if they exist
    if (form.isbn) submitData.isbn = form.isbn;
    if (form.coverUrl) submitData.coverUrl = form.coverUrl;
    
    // Include id if editing
    if (form.id) submitData.id = form.id;
    
    // Store ISBN in localStorage as backup (in case backend doesn't support it)
    if (form.isbn || form.coverUrl) {
      if (form.id && form.isbn) {
        localStorage.setItem(`book_isbn_${form.id}`, form.isbn);
      }
      if (form.id && form.coverUrl) {
        localStorage.setItem(`book_cover_${form.id}`, form.coverUrl);
      }
    }
    
    await onSave(submitData);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap-lg)' }}>
          <h2 style={{ margin: 0 }}>{book ? 'Edit Book' : 'Add New Book'}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--cream-dim)', fontSize: 20, cursor: 'pointer' }}
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          <div className="form-group">
            <label>Book Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. The Great Gatsby"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Author *</label>
            <input
              type="text"
              name="author"
              placeholder="e.g. F. Scott Fitzgerald"
              value={form.author}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Stock Quantity *</label>
            <input
              type="number"
              name="stock"
              placeholder="Number of copies available"
              value={form.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>ISBN (Optional)</label>
            <input
              type="text"
              name="isbn"
              placeholder="e.g. 978-0743-27557-5"
              value={form.isbn}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Cover Image URL (Optional)</label>
            <input
              type="text"
              name="coverUrl"
              placeholder="e.g. https://..."
              value={form.coverUrl}
              onChange={handleChange}
            />
            {form.coverUrl && (
              <img src={form.coverUrl} alt="Cover preview" style={{ 
                marginTop: '8px', maxWidth: '100px', maxHeight: '150px', borderRadius: '4px' 
              }} onError={() => {}} />
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--gap-md)', marginTop: 'var(--gap-sm)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
