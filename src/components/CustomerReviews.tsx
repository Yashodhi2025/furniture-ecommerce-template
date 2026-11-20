'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { addProductReview, readProductReviews, REVIEW_CHANGE_EVENT, type ProductReview } from '@/lib/reviewStorage';
import './CustomerReviews.css';

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="lr-review-stars" role="img" aria-label={`${label}: ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= Math.round(rating) ? 'is-filled' : ''} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export function ProductRatingSummary({ productId, countOnly = false, onOpenReviews }: { productId: string; countOnly?: boolean; onOpenReviews?: () => void }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    const load = () => setReviews(readProductReviews(productId));
    load();
    window.addEventListener(REVIEW_CHANGE_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(REVIEW_CHANGE_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [productId]);

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const scrollToReviews = () => {
    onOpenReviews?.();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`reviews-${productId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  if (countOnly) return null;
  return (
    <button type="button" className="lr-rating-summary" onClick={scrollToReviews} aria-label={`${average.toFixed(1)} out of 5 from ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`}>
      <Stars rating={average} label="Average rating" />
      <strong>{reviews.length ? average.toFixed(1) : '0.0'}</strong>
      <span>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
    </button>
  );
}

export default function CustomerReviews({ productId, productName }: { productId: string; productName: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = () => setReviews(readProductReviews(productId));
    load();
    window.addEventListener(REVIEW_CHANGE_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(REVIEW_CHANGE_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [productId]);

  const average = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    [reviews],
  );
  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(review => review.rating === stars).length,
  }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    if (!rating) { setError('Please choose a star rating.'); return; }
    if (name.trim().length < 2) { setError('Please enter your name.'); return; }
    if (comment.trim().length < 10) { setError('Please write at least 10 characters.'); return; }
    try {
      addProductReview({ productId, rating, name: name.trim(), comment: comment.trim() });
      setName('');
      setComment('');
      setRating(0);
      setError('');
      setSaved(true);
      setFormOpen(false);
    } catch {
      setError('Your review could not be saved. Please allow browser storage and try again.');
    }
  };

  return (
    <section id={`reviews-${productId}`} className="lr-customer-reviews" aria-labelledby={`reviews-title-${productId}`}>
      <div className="lr-reviews-heading">
        <div>
          <span className="lr-reviews-eyebrow">Customer feedback</span>
          <h2 id={`reviews-title-${productId}`}>Customer Reviews</h2>
        </div>
        <button type="button" className="lr-write-review" onClick={() => setFormOpen(value => !value)} aria-expanded={formOpen} aria-controls={`review-form-${productId}`}>
          {formOpen ? 'Close review form' : 'Write a Review'}
        </button>
      </div>

      <div className="lr-reviews-summary">
        <div className="lr-reviews-score">
          <strong>{reviews.length ? average.toFixed(1) : '0.0'}</strong>
          <Stars rating={average} label="Product average" />
          <span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
        </div>
        <div className="lr-rating-distribution" aria-label="Rating distribution">
          {distribution.map(item => {
            const percentage = reviews.length ? (item.count / reviews.length) * 100 : 0;
            return (
              <div className="lr-rating-row" key={item.stars}>
                <span>{item.stars} star</span>
                <div className="lr-rating-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
                <span>{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {formOpen && (
        <form id={`review-form-${productId}`} className="lr-review-form" onSubmit={submit} noValidate>
          <div>
            <label id={`rating-label-${productId}`}>Your rating</label>
            <div className="lr-rating-input" role="radiogroup" aria-labelledby={`rating-label-${productId}`}>
              {[1, 2, 3, 4, 5].map(star => (
                <label key={star}>
                  <input type="radio" name={`rating-${productId}`} value={star} checked={rating === star} onChange={() => setRating(star)} />
                  <span className={star <= rating ? 'is-filled' : ''} aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}>★</span>
                </label>
              ))}
            </div>
          </div>
          <label>
            Your name
            <input type="text" value={name} onChange={event => setName(event.target.value)} maxLength={60} autoComplete="name" placeholder="Name" />
          </label>
          <label>
            Written review
            <textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={1000} rows={4} placeholder={`Share your experience with ${productName}.`} />
          </label>
          {error && <p className="lr-review-error" role="alert">{error}</p>}
          {saved && <p className="lr-review-success" role="status">Your review was saved.</p>}
          <button type="submit" className="lr-review-submit">Submit Review</button>
        </form>
      )}

      {reviews.length ? (
        <div className="lr-review-list" aria-live="polite">
          {reviews.map(review => (
            <article className="lr-review-card" key={review.id}>
              <div className="lr-review-card-top">
                <div><strong>{review.name}</strong><Stars rating={review.rating} label={`${review.rating} star rating`} /></div>
                <time dateTime={review.createdAt}>{new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(review.createdAt))}</time>
              </div>
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="lr-review-empty">
          <strong>Be the first to review</strong>
          <p>Share how this piece fits your space and everyday living.</p>
        </div>
      )}
    </section>
  );
}
