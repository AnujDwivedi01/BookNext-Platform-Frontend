// ── Book Cover Service ──────────────────────────────────────────────────────
// Uses Open Library API to fetch real book covers

/**
 * Get book cover URL from Open Library API
 * Priority: Direct URL > ISBN > Title+Author fallback
 */
export const getOpenLibraryCoverUrl = (book) => {
  // If manual cover URL provided, use it
  if (book.coverUrl) {
    return book.coverUrl;
  }

  // Try ISBN first (most reliable)
  if (book.isbn) {
    // Clean ISBN (remove dashes)
    const cleanIsbn = book.isbn.replace(/-/g, '');
    return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
  }

  // Fallback: search by title + author
  if (book.title && book.author) {
    const query = new URLSearchParams({
      title: book.title,
      author: book.author,
      limit: 1,
    });
    return `https://openlibrary.org/search.json?${query.toString()}`;
  }

  // Last fallback: search by title only
  if (book.title) {
    const query = new URLSearchParams({
      title: book.title,
      limit: 1,
    });
    return `https://openlibrary.org/search.json?${query.toString()}`;
  }

  return null;
};
