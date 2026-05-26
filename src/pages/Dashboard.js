import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksAPI, authAPI, notificationAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookFormModal from '../components/BookFormModal';
import './Dashboard.css';

export default function Dashboard() {
  const { user, isAdmin, getRole } = useAuth();
  const role = getRole();

  // ── State ──
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBook, setEditBook] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [supportTickets, setSupportTickets] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');

  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'books', 'users', 'orders', 'support'
  const toast = useToast();

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

  const fetchUsers = async () => {
    if (!isAdmin()) return;
    setUsersLoading(true);
    try {
      const res = await authAPI.getAllUsers();
      setUsers(res.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSupportTickets = async () => {
    setSupportLoading(true);
    try {
      const res = isAdmin() 
        ? await notificationAPI.getAllSupportTickets() 
        : await notificationAPI.getMySupportTickets(user.id);
      setSupportTickets(res.data || []);
    } catch (err) {
      console.error('Support fetch error:', err);
      toast.error('Failed to load support messages');
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => { 
    fetchBooks(); 
    if (isAdmin()) {
      fetchUsers();
      fetchOrders();
    }
    if (user?.id) fetchSupportTickets();
  }, [user]);


  const fetchOrders = async () => {
    if (!isAdmin()) return;
    setOrdersLoading(true);
    try {
      const res = await orderAPI.getAllOrders();
      setAllOrders(res.data || []);
    } catch {
      toast.error('Failed to load system orders');
    } finally {
      setOrdersLoading(false);
    }
  };

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
      toast.error(typeof msg === 'string' ? msg : 'Operation failed. Check you are logged in as Admin.');
    }
  };

  const handleUserDelete = async (userId, targetRole) => {
    if (targetRole?.toUpperCase() === 'ADMIN') {
      toast.error('You cannot delete an Administrator');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    try {
      await authAPI.deleteUser(userId);
      toast.success('User removed successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    setSupportLoading(true);
    try {
      await notificationAPI.sendSupportTicket({
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        message: supportMsg
      });
      toast.success('Message sent! Our support team will review it.');
      setSupportMsg('');
      fetchSupportTickets();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await notificationAPI.resolveSupportTicket(ticketId);
      toast.success('Ticket marked as resolved');
      fetchSupportTickets();
    } catch {
      toast.error('Failed to resolve ticket');
    }
  };


  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };


  // Stats for admin
  const stats = {
    total:    books.length,
    inStock:  books.filter(b => b.stock > 0).length,
    outStock: books.filter(b => b.stock === 0).length,
    avgPrice: books.length ? (books.reduce((s, b) => s + (b.price || 0), 0) / books.length).toFixed(2) : '0.00',
  };

  const categories = [...new Set(books.map(b => b.category).filter(Boolean))];

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dash-header fade-up">
          <div>
            <h1>
              {isAdmin() ? 'Admin Panel' : 'My Dashboard'}
            </h1>
            <p className="text-dim">
              Welcome back, <strong style={{ color: 'var(--gold)' }}>
                {user?.fullName || user?.email?.split('@')[0] || 'User'}
              </strong>
              <span className="badge badge-gold" style={{ marginLeft: 8 }}>{role}</span>
            </p>
          </div>
          {isAdmin() && (
            <button className="btn btn-gold" onClick={() => { setEditBook(null); setShowForm(true); }}>
              + Add Book
            </button>
          )}
        </div>

        {/* ── ADMIN VIEW ── */}
        {isAdmin() && (
          <>
            {/* Tab Navigation */}
            <div className="dash-tabs fade-up">
              <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={`tab-btn ${activeTab === 'books'    ? 'active' : ''}`} onClick={() => setActiveTab('books')}>Books</button>
              <button className={`tab-btn ${activeTab === 'users'    ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
              <button className={`tab-btn ${activeTab === 'orders'   ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
              <button className={`tab-btn ${activeTab === 'support'  ? 'active' : ''}`} onClick={() => setActiveTab('support')}>Support</button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tab-content fade-up">
                {/* Stats cards */}
                <div className="stats-grid">
                  {[ 
                    {
                      label: 'Total Books',    
                      value: stats.total,    
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      ), 
                      color: 'var(--accent)' 
                    },
                    { 
                      label: 'In Stock',       
                      value: stats.inStock,  
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ), 
                      color: 'var(--green)' 
                    },
                    { 
                      label: 'Out of Stock',   
                      value: stats.outStock, 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      ), 
                      color: 'var(--red)' 
                    },
                    { 
                      label: 'Avg Price (₹)',  
                      value: stats.avgPrice, 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      ), 
                      color: 'var(--accent-light)' 
                    },
                  ].map((s, i) => (
                    <div key={i} className="stat-card card">
                      <div className="stat-card-icon">{s.icon}</div>
                      <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                      <div className="stat-card-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Category breakdown */}
                {categories.length > 0 && (
                  <div className="card dash-section">
                    <h3 style={{ marginBottom: 'var(--gap-md)' }}>Category Breakdown</h3>
                    <div className="category-breakdown">
                      {categories.map(cat => {
                        const count = books.filter(b => b.category === cat).length;
                        const pct   = Math.round((count / books.length) * 100);
                        return (
                          <div key={cat} className="cat-row">
                            <span className="cat-name">{cat}</span>
                            <div className="cat-bar-wrap">
                              <div className="cat-bar" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="cat-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Books Tab */}
            {activeTab === 'books' && (
              <div className="tab-content fade-up">
                <div className="card dash-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap-lg)' }}>
                    <h3>Manage Books</h3>
                    <span className="text-dim text-sm">{books.length} total</span>
                  </div>
                  {loading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                  ) : books.length === 0 ? (
                    <div className="empty-state"><h3>No books found</h3></div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {books.map(book => (
                            <tr key={book.id}>
                              <td className="text-dim text-sm">#{book.id}</td>
                              <td><Link to={`/books/${book.id}`} style={{ fontWeight: 600 }}>{book.title}</Link></td>
                              <td className="text-dim">{book.author}</td>
                              <td><span className="badge badge-gold">{book.category || '—'}</span></td>
                              <td className="text-gold" style={{ fontWeight: 600 }}>₹{book.price?.toFixed(2)}</td>
                              <td><span style={{ color: book.stock > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{book.stock}</span></td>
                              <td>
                                <button className="btn btn-ghost btn-xs" onClick={() => { setEditBook(book); setShowForm(true); }}>Edit</button>
                                <button className="btn btn-danger btn-xs" onClick={() => handleDelete(book.id)}>Del</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="tab-content fade-up">
                <div className="card dash-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap-lg)' }}>
                    <h3>User Management</h3>
                    <span className="text-dim text-sm">{users.length} total</span>
                  </div>
                  {usersLoading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(u => (
                            <tr key={u.userId}>
                              <td className="text-dim text-sm">#{u.userId}</td>
                              <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                              <td className="text-dim">{u.email}</td>
                              <td><span className={`badge ${u.role?.toUpperCase() === 'ADMIN' ? 'badge-gold' : 'badge-outline'}`}>{u.role}</span></td>
                              <td>
                                {u.role?.toUpperCase() === 'ADMIN' ? (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 11, color: 'var(--gold)', fontWeight: 600,
                                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                                    borderRadius: 6, padding: '3px 10px'
                                  }}>
                                    🔒 Protected
                                  </span>
                                ) : u.userId === user?.id ? (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 11, color: 'var(--text-dim)', fontWeight: 500,
                                    background: 'var(--bg-soft)', border: '1px solid var(--border)',
                                    borderRadius: 6, padding: '3px 10px'
                                  }}>
                                    You
                                  </span>
                                ) : (
                                  <button
                                    className="btn btn-danger btn-xs"
                                    onClick={() => handleUserDelete(u.userId, u.role)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="tab-content fade-up">
                <div className="card dash-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap-lg)' }}>
                    <h3>System Orders</h3>
                    <span className="text-dim text-sm">{allOrders.length} total</span>
                  </div>
                  {ordersLoading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allOrders.map(o => (
                            <tr key={o.orderId}>
                              <td>#{o.orderId}</td>
                              <td className="text-gold" style={{ fontWeight: 600 }}>₹{o.totalAmount?.toFixed(2)}</td>
                              <td><span className="badge badge-outline">{o.paymentMethod || 'WALLET'}</span></td>
                              <td><span className={`badge ${o.status === 'DELIVERED' ? 'badge-green' : 'badge-gold'}`}>{o.status}</span></td>
                              <td><button className="btn btn-ghost btn-xs" onClick={() => handleViewReceipt(o)}>Receipt</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="tab-content fade-up">
                <div className="card dash-section">
                  <h3>Support Inbox</h3>
                  {supportLoading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supportTickets.map(t => (
                            <tr key={t.id}>
                              <td><div style={{ fontWeight: 600 }}>{t.userName}</div></td>
                              <td style={{ fontSize: 13 }}>{t.message}</td>
                              <td><span className={`badge ${t.status === 'OPEN' ? 'badge-red' : 'badge-green'}`}>{t.status}</span></td>
                              <td>{t.status === 'OPEN' && <button className="btn btn-ghost btn-xs" onClick={() => handleResolveTicket(t.id)}>Resolve</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── USER VIEW ── */}
        {!isAdmin() && (
          <div className="user-dashboard fade-up">
            {/* Profile card */}
            <div className="card user-profile-card">
              <div className="profile-avatar">
                {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="profile-details">
                <h2>{user?.fullName || 'BookNest User'}</h2>
                <p className="text-dim">{user?.email}</p>
                <span className="badge badge-gold" style={{ marginTop: 8 }}>
                  {role} Account
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="quick-actions">
              <h3 style={{ marginBottom: 'var(--gap-lg)' }}>Quick Actions</h3>
              <div className="action-cards">
                {[
                  { 
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    ), 
                    title: 'Browse Catalog',  
                    desc: 'Explore all available books',  
                    to: '/books' 
                  },
                  { 
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    ), 
                    title: 'Search Books',    
                    desc: 'Find books by title or author', 
                    to: '/books' 
                  },
                ].map((a, i) => (
                  <Link key={i} to={a.to} className="action-card card">
                    <div className="action-icon">{a.icon}</div>
                    <div>
                      <div className="action-title">{a.title}</div>
                      <div className="action-desc text-dim text-sm">{a.desc}</div>
                    </div>
                    <span className="action-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent books */}
            <div className="card dash-section">
              <h3 style={{ marginBottom: 'var(--gap-lg)' }}>Recently Added Books</h3>
              {loading ? (
                <div className="loading-wrap"><div className="spinner" /></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.slice(0, 8).map(book => (
                        <tr key={book.id}>
                          <td>
                            <Link to={`/books/${book.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                              {book.title}
                            </Link>
                          </td>
                          <td className="text-dim">{book.author}</td>
                          <td><span className="badge badge-gold">{book.category || '—'}</span></td>
                          <td className="text-gold" style={{ fontWeight: 600 }}>₹{book.price?.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${book.stock > 0 ? 'badge-green' : 'badge-red'}`}>
                              {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 'var(--gap-lg)', textAlign: 'center' }}>
                <Link to="/books" className="btn btn-outline">View All Books →</Link>
              </div>
            </div>

            {/* Help & Support for User */}
            <div className="card dash-section fade-up" style={{ marginTop: 'var(--gap-lg)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-xl)' }}>
                {/* Contact Info */}
                <div>
                  <h3 style={{ marginBottom: 'var(--gap-md)' }}>Help & Support</h3>
                  <p className="text-dim" style={{ marginBottom: 'var(--gap-lg)' }}>
                    Having trouble? Contact our support team directly or send us a message.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--accent-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Anuj Dwivedi</div>
                        <div className="text-dim text-sm">Support Head</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--accent-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>6306972759</div>
                        <div className="text-dim text-sm">Mobile</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--accent-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>booknext.platform@gmail.com</div>
                        <div className="text-dim text-sm">Email</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Form */}
                <form onSubmit={handleSendSupport} style={{ background: 'var(--bg-soft)', padding: 'var(--gap-lg)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ marginBottom: 'var(--gap-md)' }}>Send a Message</h4>
                  <div className="form-group">
                    <textarea 
                      placeholder="Describe your issue or question..." 
                      style={{ height: 100, resize: 'none' }}
                      value={supportMsg}
                      onChange={(e) => setSupportMsg(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-gold" 
                    style={{ width: '100%', marginTop: 12 }}
                    disabled={supportLoading}
                  >
                    {supportLoading ? 'Sending...' : 'Send Message'}
                  </button>
                  
                  {/* Recent tickets for user */}
                  {supportTickets.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div className="text-xs text-dim uppercase font-bold" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Your Recent Tickets</div>
                      <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {supportTickets.slice(0, 3).map(t => (
                          <div key={t.id} style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                            <span className="text-truncate" style={{ maxWidth: '70%' }}>{t.message}</span>
                            <span className={`badge ${t.status === 'OPEN' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 9, padding: '2px 6px' }}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <BookFormModal
          book={editBook}
          onSave={handleFormSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {showReceipt && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal receipt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ marginBottom: 4 }}>Order Receipt</h2>
              <p className="text-dim text-sm">Order #{selectedOrder.orderId}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24, padding: 16, background: 'var(--bg-soft)', borderRadius: 12 }}>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Customer</label>
                <div style={{ fontWeight: 600 }}>{selectedOrder.fullName}</div>
                <div className="text-sm text-dim">{selectedOrder.city}, {selectedOrder.state}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Date</label>
                <div style={{ fontWeight: 600 }}>{new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
                <div className="text-sm text-dim">{selectedOrder.modeOfPayment}</div>
              </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 24 }}>
              <table style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.bookTitle}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '2px dashed var(--border)', paddingTop: 16, textAlign: 'right' }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>Total Amount Paid</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>₹{selectedOrder.totalAmount?.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>Print Receipt</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => setShowReceipt(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
