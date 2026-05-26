import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { booksAPI, wishlistAPI } from '../services/api';   // ✅ added wishlistAPI
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookFormModal from '../components/BookFormModal';
import { useCart } from '../context/CartContext';
import ReviewSection from '../components/ReviewSection';
import { getOpenLibraryCoverUrl } from '../services/bookCovers';
import './BookDetail.css';

// ── Category themes (mirrors BookCard) ────────────────────────────────────────
const CATEGORY_THEMES = {
  Fiction:       { colors: ['#1a0a2e','#4a1d96','#7c3aed'], accent: '#c4b5fd', pattern: 'fiction'      },
  'Non-Fiction': { colors: ['#0c1445','#1e3a8a','#2563eb'], accent: '#93c5fd', pattern: 'nonfiction'   },
  Science:       { colors: ['#022c22','#065f46','#059669'], accent: '#6ee7b7', pattern: 'science'       },
  History:       { colors: ['#1c0a00','#7c2d12','#c2410c'], accent: '#fdba74', pattern: 'history'       },
  Technology:    { colors: ['#0f0c29','#302b63','#24243e'], accent: '#a5b4fc', pattern: 'technology'    },
  Romance:       { colors: ['#4a0020','#9d174d','#db2777'], accent: '#fbcfe8', pattern: 'romance'       },
  Mystery:       { colors: ['#050510','#0f0f2e','#1e1b4b'], accent: '#94a3b8', pattern: 'mystery'       },
  Programming:   { colors: ['#001420','#002a40','#003d5c'], accent: '#38bdf8', pattern: 'programming'   },
  Biography:     { colors: ['#1c1006','#78350f','#b45309'], accent: '#fde68a', pattern: 'biography'     },
  'Self-Help':   { colors: ['#1a0800','#9a3412','#ea580c'], accent: '#fed7aa', pattern: 'selfhelp'      },
};
const DEFAULT_THEME = { colors: ['#1e1b4b','#312e81','#4338ca'], accent: '#818cf8', pattern: 'fiction' };

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ── Full SVG book cover (same as BookCard) ────────────────────────────────────
function BookCoverSVG({ title, author, category, accent, colors, pattern }) {
  const initial  = (title || 'B')[0].toUpperCase();
  const short    = truncate(title, 40);
  const authorSh = truncate(author, 24);
  const uid      = `detail_${initial}${(category||'').replace(/\s/g,'')}`;

  const words    = (short || '').split(' ');
  const mid      = Math.ceil(words.length / 2);
  const line1    = words.slice(0, mid).join(' ');
  const line2    = words.slice(mid).join(' ');
  const isSingle = words.length <= 2 && short.length <= 13;
  const isLong   = short.length > 20;

  const [c0, c1, c2] = colors;

  return (
    <svg viewBox="0 0 260 340" xmlns="http://www.w3.org/2000/svg"
      width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id={`g1_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c0}/>
          <stop offset="50%"  stopColor={c1}/>
          <stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <linearGradient id={`g2_${uid}`} x1="0%" y1="60%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.88)"/>
        </linearGradient>
        <linearGradient id={`g3_${uid}`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.07)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        <linearGradient id={`spine_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.5)"/>
          <stop offset="30%"  stopColor="rgba(0,0,0,0.15)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        <clipPath id={`clip_${uid}`}>
          <rect width="260" height="340" rx="0"/>
        </clipPath>
        <filter id={`glow_${uid}`}>
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <g clipPath={`url(#clip_${uid})`}>
        <rect width="260" height="340" fill={`url(#g1_${uid})`}/>

        {pattern === 'fiction' && (
          <g>
            <circle cx="200" cy="80" r="120" fill={accent} opacity="0.04" filter={`url(#glow_${uid})`}/>
            <circle cx="200" cy="80" r="80"  fill={accent} opacity="0.06"/>
            <circle cx="200" cy="80" r="50"  fill={accent} opacity="0.08"/>
            <circle cx="200" cy="80" r="25"  fill={accent} opacity="0.15"/>
            <circle cx="200" cy="80" r="6"   fill={accent} opacity="0.7"/>
            <ellipse cx="200" cy="80" rx="100" ry="38" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.3"/>
            <ellipse cx="200" cy="80" rx="70"  ry="27" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.4" transform="rotate(25 200 80)"/>
            {[[20,20],[45,55],[70,15],[100,40],[130,25],[160,50],[230,30],[250,70],[30,120],[80,140],[110,100],[150,130],[190,150],[220,110],[245,140],[40,200],[90,220],[140,190],[200,210],[240,180],[20,260],[60,280],[110,250],[170,270],[220,240],[250,270],[130,310],[80,300]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={i%3===0?1.5:0.8} fill="white" opacity={i%4===0?0.7:0.35}/>
            ))}
            <path d="M0 200 Q130 120 260 180" stroke={accent} strokeWidth="40" fill="none" opacity="0.04"/>
          </g>
        )}
        {pattern === 'nonfiction' && (
          <g>
            {Array.from({length:10}).map((_,row)=>Array.from({length:8}).map((_,col)=>(<circle key={`${row}-${col}`} cx={15+col*34} cy={15+row*34} r="2.5" fill={accent} opacity={0.12+((row+col)%3)*0.06}/>)))}
            {[[0,0,7,9],[2,1,5,8],[4,0,7,6],[1,3,6,7],[3,2,7,9]].map(([r1,c1,r2,c2],i)=>(<line key={i} x1={15+c1*34} y1={15+r1*34} x2={15+c2*34} y2={15+r2*34} stroke={accent} strokeWidth="0.6" opacity="0.2"/>))}
            <polygon points="130,60 200,110 180,190 80,190 60,110" fill="none" stroke={accent} strokeWidth="1" opacity="0.2"/>
            <polygon points="130,80 185,120 168,180 92,180 75,120" fill={accent} opacity="0.05"/>
          </g>
        )}
        {pattern === 'science' && (
          <g>
            <circle cx="130" cy="150" r="12" fill={accent} opacity="0.5"/>
            <circle cx="130" cy="150" r="5"  fill={accent} opacity="0.9"/>
            <ellipse cx="130" cy="150" rx="110" ry="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35"/>
            <ellipse cx="130" cy="150" rx="110" ry="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35" transform="rotate(60 130 150)"/>
            <ellipse cx="130" cy="150" rx="110" ry="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35" transform="rotate(120 130 150)"/>
            {[0,60,120,180,240,300].map((deg,i)=>{const a=deg*Math.PI/180;return <circle key={i} cx={130+Math.cos(a)*110} cy={150+Math.sin(a)*40} r="4" fill={accent} opacity="0.6"/>;}) }
            <circle cx="130" cy="150" r="80" fill={accent} opacity="0.04" filter={`url(#glow_${uid})`}/>
          </g>
        )}
        {pattern === 'history' && (
          <g>
            <rect x="0" y="260" width="260" height="5" fill={accent} opacity="0.25" rx="1"/>
            {[20,65,110,155,200].map((x,i)=>(<g key={i}><rect x={x} y="90" width="18" height="170" fill={accent} opacity="0.15" rx="1"/><rect x={x-5} y="82" width="28" height="10" fill={accent} opacity="0.3" rx="1"/><rect x={x-5} y="258" width="28" height="6" fill={accent} opacity="0.3" rx="1"/></g>))}
            <polygon points="5,82 130,20 255,82" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
            <polygon points="5,82 130,20 255,82" fill={accent} opacity="0.06"/>
            <rect x="0" y="80" width="260" height="12" fill={accent} opacity="0.2" rx="1"/>
            <circle cx="130" cy="18" r="10" fill={accent} opacity="0.35"/>
          </g>
        )}
        {pattern === 'technology' && (
          <g>
            {[40,80,120,160,200,240,280].map((y,i)=>(<line key={`h${i}`} x1="0" y1={y} x2="260" y2={y} stroke={accent} strokeWidth="0.6" opacity="0.15"/>))}
            {[30,65,100,135,170,205,240].map((x,i)=>(<line key={`v${i}`} x1={x} y1="0" x2={x} y2="340" stroke={accent} strokeWidth="0.6" opacity="0.15"/>))}
            <path d="M0 60 H80 V120 H160 V60 H220 V180 H130 V240 H260" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.5"/>
            <path d="M0 200 H50 V140 H120 V200 H190 V140 H260" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.45"/>
            {[[80,120],[160,60],[220,180],[130,240],[50,140],[120,200],[190,140],[50,80],[120,80],[180,260],[100,300]].map(([cx,cy],i)=>(<g key={i}><circle cx={cx} cy={cy} r="6" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.6"/><circle cx={cx} cy={cy} r="2.5" fill={accent} opacity="0.7"/></g>))}
          </g>
        )}
        {pattern === 'romance' && (
          <g>
            {[0,45,90,135,180,225,270,315].map((deg,i)=>{const a=deg*Math.PI/180;return(<g key={i}><ellipse cx={130+Math.cos(a)*55} cy={140+Math.sin(a)*55} rx="35" ry="20" fill={accent} opacity="0.1" transform={`rotate(${deg} ${130+Math.cos(a)*55} ${140+Math.sin(a)*55})`}/></g>);})}
            <circle cx="130" cy="140" r="18" fill={accent} opacity="0.3"/>
            <circle cx="130" cy="140" r="8"  fill={accent} opacity="0.6"/>
          </g>
        )}
        {pattern === 'mystery' && (
          <g>
            <ellipse cx="130" cy="140" rx="120" ry="70" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.2"/>
            <ellipse cx="130" cy="140" rx="90"  ry="52" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.25"/>
            <ellipse cx="130" cy="140" rx="60"  ry="35" fill="none" stroke={accent} strokeWidth="1"   opacity="0.3"/>
            <ellipse cx="130" cy="140" rx="35"  ry="20" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4"/>
            <circle cx="130" cy="140" r="14" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5"/>
            <circle cx="130" cy="140" r="6"  fill={accent} opacity="0.6"/>
            <circle cx="130" cy="140" r="2"  fill={accent} opacity="1"/>
            {Array.from({length:16}).map((_,i)=>{const a=(i*22.5)*Math.PI/180;return <line key={i} x1={130+Math.cos(a)*7} y1={140+Math.sin(a)*7} x2={130+Math.cos(a)*14} y2={140+Math.sin(a)*14} stroke={accent} strokeWidth="0.8" opacity="0.6"/>;}) }
          </g>
        )}
        {pattern === 'programming' && (
          <g>
            <circle cx="130" cy="30" r="10" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7"/>
            <circle cx="130" cy="30" r="4"  fill={accent} opacity="0.8"/>
            <line x1="130" y1="40" x2="65"  y2="85" stroke={accent} strokeWidth="1" opacity="0.5"/>
            <line x1="130" y1="40" x2="195" y2="85" stroke={accent} strokeWidth="1" opacity="0.5"/>
            {[65,195].map((cx,i)=>(<g key={i}><circle cx={cx} cy="92" r="9" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.65"/><circle cx={cx} cy="92" r="3.5" fill={accent} opacity="0.7"/></g>))}
            {[[65,92,32,147],[65,92,98,147],[195,92,162,147],[195,92,228,147]].map(([x1,y1,x2,y2],i)=>(<line key={i} x1={x1} y1={y1+9} x2={x2} y2={y2-9} stroke={accent} strokeWidth="0.9" opacity="0.45"/>))}
            {[32,98,162,228].map((cx,i)=>(<g key={i}><circle cx={cx} cy="147" r="8" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.6"/><circle cx={cx} cy="147" r="3" fill={accent} opacity="0.6"/></g>))}
          </g>
        )}
        {pattern === 'biography' && (
          <g>
            <circle cx="130" cy="120" r="75" fill={accent} opacity="0.06"/>
            <circle cx="130" cy="120" r="72" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
            <circle cx="130" cy="95"  r="30" fill={accent} opacity="0.2"/>
            <path d="M75 190 C75 145 185 145 185 190" fill={accent} opacity="0.18"/>
          </g>
        )}
        {pattern === 'selfhelp' && (
          <g>
            {Array.from({length:18}).map((_,i)=>{const a=(i*20-90)*Math.PI/180;return <line key={i} x1={130+Math.cos(a)*40} y1={160+Math.sin(a)*40} x2={130+Math.cos(a)*200} y2={160+Math.sin(a)*200} stroke={accent} strokeWidth="1" opacity="0.08"/>;}) }
            <circle cx="130" cy="130" r="50" fill={accent} opacity="0.08" filter={`url(#glow_${uid})`}/>
            <circle cx="130" cy="130" r="35" fill={accent} opacity="0.12"/>
            <circle cx="130" cy="130" r="22" fill={accent} opacity="0.25"/>
            <circle cx="130" cy="130" r="12" fill={accent} opacity="0.5"/>
            <polygon points="0,280 80,160 130,210 180,140 260,280" fill={accent} opacity="0.12"/>
          </g>
        )}

        <rect width="260" height="340" fill={`url(#g3_${uid})`}/>
        <rect width="260" height="340" fill={`url(#g2_${uid})`}/>
        <rect width="260" height="340" fill={`url(#spine_${uid})`}/>
        <rect x="0" y="0" width="5" height="340" fill={accent} opacity="0.55" rx="1"/>

        <rect x="14" y="15" width={Math.min((category||'').length * 6.8 + 20, 140)} height="20" rx="10" fill={accent} opacity="0.2"/>
        <rect x="14" y="15" width={Math.min((category||'').length * 6.8 + 20, 140)} height="20" rx="10" fill="none" stroke={accent} strokeWidth="0.7" opacity="0.6"/>
        <text x="24" y="29" fontFamily="system-ui, -apple-system, sans-serif" fontSize="9" fontWeight="800" fill={accent} letterSpacing="0.12em">
          {(category || 'BOOK').toUpperCase()}
        </text>

        {isSingle ? (
          <text x="16" y="283" fontFamily="Georgia, 'Times New Roman', serif" fontSize="20" fontWeight="700" fill="#ffffff" letterSpacing="-0.3">{short}</text>
        ) : (
          <>
            <text x="16" y="275"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={isLong ? "16" : "19"} fontWeight="700" fill="#ffffff" letterSpacing="-0.3">
              {line1}
            </text>
            <text x="16" y={isLong ? "293" : "298"}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={isLong ? "16" : "19"} fontWeight="700" fill="#ffffff" letterSpacing="-0.3">
              {line2}
            </text>
          </>
        )}
        <rect x="16" y="308" width="60" height="1.5" rx="1" fill={accent} opacity="0.8"/>
        <text x="16" y="328" fontFamily="system-ui, sans-serif" fontSize="11" fontStyle="italic" fill="rgba(255,255,255,0.55)">{authorSh}</text>
      </g>
    </svg>
  );
}

// ── BookCover with real image support ─────────────────────────────────────────
function DetailBookCover({ book }) {
  const [imageError, setImageError] = React.useState(false);
  const theme = CATEGORY_THEMES[book.category] || DEFAULT_THEME;

  let bookData = { ...book };
  if (!bookData.isbn && typeof window !== 'undefined') {
    const s = localStorage.getItem(`book_isbn_${book.id}`);
    if (s) bookData.isbn = s;
  }
  if (!bookData.coverUrl && typeof window !== 'undefined') {
    const s = localStorage.getItem(`book_cover_${book.id}`);
    if (s) bookData.coverUrl = s;
  }

  const coverUrl = getOpenLibraryCoverUrl(bookData);

  if (coverUrl && !imageError) {
    return (
      <img
        src={coverUrl}
        alt={book.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)' }}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <BookCoverSVG
      title={book.title}
      author={book.author}
      category={book.category || 'Book'}
      accent={theme.accent}
      colors={theme.colors}
      pattern={theme.pattern}
    />
  );
}

export default function BookDetail() {
  const { id }     = useParams();
  const [book, setBook]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showEdit, setShowEdit]   = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [inWishlist, setInWishlist]     = useState(false);       
  const [wishlistLoading, setWishlistLoading] = useState(false); 
  const { isAdmin, isLoggedIn } = useAuth();                     
  const toast       = useToast();
  const navigate    = useNavigate();
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await booksAPI.getById(id);
        setBook(res.data);

        //  Check if this book is already in the wishlist
        if (isLoggedIn() && !isAdmin()) {
          try {
            const wRes = await wishlistAPI.getMyWishlist();
            const items = wRes.data?.items || [];
            setInWishlist(items.some(i => i.bookId === parseInt(id)));
          } catch {
            // Silently ignore — wishlist check is non-critical
          }
        }
      } catch {
        toast.error('Book not found');
        navigate('/books');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this book permanently?')) return;
    try {
      await booksAPI.delete(id);
      toast.success('Book deleted');
      navigate('/books');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleEditSave = async (data) => {
    try {
      const res = await booksAPI.update(id, data);
      setBook(res.data);
      toast.success('Book updated');
      setShowEdit(false);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      toast.error('Please login to add books to cart');
      navigate('/login');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(book, 1);
      toast.success(`"${book.title}" added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  //  NEW — Toggle wishlist
  const handleWishlist = async () => {
    if (!isLoggedIn()) {
      toast.error('Please login to use wishlist');
      navigate('/login');
      return;
    }
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistAPI.removeBook(book.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.addBook({
          bookId:        book.id,
          bookTitle:     book.title,
          bookPrice:     book.price,
          author:        book.author,
          coverImageUrl: book.coverImageUrl || null,
        });
        setInWishlist(true);
        toast.success('Added to wishlist!');
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!book)   return null;

  return (
    <div className="book-detail-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="breadcrumb fade-up">
          <Link to="/books">← Back to Catalog</Link>
        </div>

        <div className="book-detail-layout fade-up">
          {/* Cover */}
          <div className="detail-cover">
            <DetailBookCover book={book} />
          </div>

          {/* Info */}
          <div className="detail-info">
            <h1 className="detail-title">{book.title}</h1>
            <p className="detail-author">by <em>{book.author}</em></p>

            <div className="divider" />

            <div className="detail-stats">
              <div className="stat">
                <span className="stat-label">Price</span>
                <span className="stat-value text-gold">₹{book.price?.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Stock</span>
                <span
                  className="stat-value"
                  style={{ color: book.stock > 0 ? 'var(--green)' : 'var(--red)' }}
                >
                  {book.stock > 0 ? 'Available' : 'Out of stock'}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Category</span>
                <span className="stat-value">{book.category || '—'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Book ID</span>
                <span className="stat-value text-dim">#{book.id}</span>
              </div>
            </div>

            <div className="divider" />

            {/* Status badge */}
            <div style={{ marginBottom: 'var(--gap-lg)' }}>
              {book.stock > 0 ? (
                <span className="badge badge-green">In Stock</span>
              ) : (
                <span className="badge badge-red">Out of Stock</span>
              )}
            </div>

            {/* Admin actions */}
            {isAdmin() && (
              <div className="detail-actions">
                <button className="btn btn-outline" onClick={() => setShowEdit(true)}>
                  Edit Book
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete Book
                </button>
              </div>
            )}

            {/* Add to Cart + Wishlist */}
            {!isAdmin() && book.stock > 0 && (
              <div className="detail-actions">
                <button
                  className={`btn ${!isLoggedIn() ? 'btn-outline' : isInCart(book.id) ? 'btn-outline' : 'btn-gold'}`}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart
                    ? 'Adding…'
                    : !isLoggedIn()
                    ? 'Login to Buy'
                    : isInCart(book.id)
                    ? '✓ In Cart'
                    : 'Add to Cart'}
                </button>
                <Link to="/cart" className="btn btn-ghost">
                  View Cart →
                </Link>
                {/* ✅ NEW — Wishlist button */}
                <button
                  className={`btn ${inWishlist ? 'btn-outline' : 'btn-ghost'}`}
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                >
                  {wishlistLoading
                    ? '…'
                    : inWishlist
                    ? 'Wishlisted'
                    : 'Add to Wishlist'}
                </button>
              </div>
            )}

            {/* ✅ Out of stock — still show wishlist button so they can save it */}
            {!isAdmin() && book.stock === 0 && (
              <div className="detail-actions">
                <span className="badge badge-red" style={{ fontSize: 13, padding: '6px 14px' }}>
                  ✕ Out of Stock — Cannot add to cart
                </span>
                <button
                  className={`btn ${inWishlist ? 'btn-outline' : 'btn-ghost'}`}
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                >
                  {wishlistLoading
                    ? '…'
                    : inWishlist
                    ? 'Wishlisted'
                    : 'Add to Wishlist'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <ReviewSection bookId={book.id} />

      </div>

      {showEdit && (
        <BookFormModal
          book={book}
          onSave={handleEditSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}