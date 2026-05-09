import { Star } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Review } from '../data/reviews';
import { appendJsonArrayItem, readJson } from '../utils/storage';

interface ReviewSectionProps {
    reviews: Review[];
}

type StoredReview = Review & { createdAt: string };

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
    const [storedReviews, setStoredReviews] = useState<StoredReview[]>([]);
    const [form, setForm] = useState({ author: '', title: '', rating: '5', text: '' });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setStoredReviews(readJson<StoredReview[]>('reviews', []));
    }, []);

    const allReviews = useMemo(() => {
        const seededReviews = reviews.map((review) => ({ ...review, createdAt: '' }));
        return [...storedReviews, ...seededReviews];
    }, [reviews, storedReviews]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const rating = Math.max(1, Math.min(5, Number(form.rating) || 5));
        const newReview: StoredReview = {
            id: Date.now(),
            author: form.author.trim(),
            title: form.title.trim(),
            rating,
            text: form.text.trim(),
            createdAt: new Date().toISOString(),
        };

        const nextReviews = appendJsonArrayItem<StoredReview>('reviews', newReview);
        setStoredReviews(nextReviews);
        setSubmitted(true);

        setTimeout(() => {
            setSubmitted(false);
            setForm({ author: '', title: '', rating: '5', text: '' });
        }, 800);
    };

    return (
        <section className="ykb-section border-y border-border bg-surface/50">
            <div className="ykb-container">
                <div className="ykb-section-heading">
                    <h2 className="ykb-section-title">What Our Clients Say</h2>
                    <p className="ykb-section-subtitle">Join hundreds of satisfied clients who trust Your Kigali Bestie.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {allReviews.map((review) => (
                        <article key={review.id} className="ykb-card ykb-card-hover flex h-full flex-col">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10 text-sm font-semibold text-primary">
                                        {getInitials(review.author)}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-primary">{review.author}</h4>
                                        <p className="text-sm text-textSecondary">{review.title}</p>
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {review.rating}/5
                                </div>
                            </div>

                            <div className="mb-4 flex items-center gap-1">
                                {[...Array(5)].map((_, index) => (
                                    <Star
                                        key={index}
                                        className={`h-4 w-4 ${
                                            index < review.rating ? 'fill-secondary text-secondary' : 'text-border'
                                        }`}
                                    />
                                ))}
                            </div>

                            <p className="flex-grow text-sm leading-relaxed text-textSecondary">{review.text}</p>
                        </article>
                    ))}
                </div>

                <div className="mx-auto mt-12 max-w-2xl">
                    <div className="ykb-card">
                        <div className="mb-6">
                            <h3 className="text-2xl font-semibold text-primary">Leave a Review</h3>
                            <p className="mt-2 text-sm text-textSecondary">This is a mocked form and is saved in your browser for now.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary" htmlFor="review-author">
                                    Your name
                                </label>
                                <input
                                    id="review-author"
                                    required
                                    className="ykb-field"
                                    value={form.author}
                                    onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
                                    placeholder="e.g., Patrick"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary" htmlFor="review-title">
                                    Title
                                </label>
                                <input
                                    id="review-title"
                                    required
                                    className="ykb-field"
                                    value={form.title}
                                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="e.g., Very helpful"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary" htmlFor="review-rating">
                                    Rating
                                </label>
                                <select
                                    id="review-rating"
                                    className="ykb-field"
                                    value={form.rating}
                                    onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
                                >
                                    {[5, 4, 3, 2, 1].map((ratingOption) => (
                                        <option key={ratingOption} value={String(ratingOption)}>
                                            {ratingOption}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-primary" htmlFor="review-text">
                                    Review
                                </label>
                                <textarea
                                    id="review-text"
                                    required
                                    className="ykb-field min-h-[140px]"
                                    value={form.text}
                                    onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
                                    placeholder="Write your experience..."
                                />
                            </div>

                            <button
                                type="submit"
                                className={`w-full ykb-button-solid px-6 py-3 ${submitted ? 'cursor-not-allowed opacity-70 hover:bg-secondary' : ''}`}
                                disabled={submitted}
                            >
                                {submitted ? 'Saved!' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
