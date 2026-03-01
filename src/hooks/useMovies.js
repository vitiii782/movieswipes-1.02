import { useState, useEffect, useCallback, useRef } from 'react';
import { tmdbService } from '../services/tmdb';
import { useMovieStore } from '../store/useMovieStore';

export const useMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { filters, mediaType, currentUser } = useMovieStore();

    // Track which pages we've already fetched this session so we don't repeat pages
    const nextPageRef = useRef(1);
    const totalPagesRef = useRef(null); // null = not yet known
    const isFetchingRef = useRef(false);
    // Track ALL IDs shown this session (in-stack + already swiped) to prevent duplicates
    const sessionSeenRef = useRef(new Set());

    const fetchMore = useCallback(async (currentFilters, currentType) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setLoading(true);

        try {
            // If we've exhausted all pages, wrap around but keep sessionSeen so no repeats
            if (totalPagesRef.current !== null && nextPageRef.current > totalPagesRef.current) {
                nextPageRef.current = 1;
            }

            const page = nextPageRef.current;
            const response = await tmdbService.getMovies(page, currentFilters, currentType);
            const results = response.results || [];
            const totalPages = response.totalPages || 1;

            // Store total pages after first fetch
            totalPagesRef.current = totalPages;
            nextPageRef.current = page + 1;

            // Also grab the persistent seenIds from the logged-in user
            const persistedSeen = currentUser?.seenIds?.[currentType] || [];

            // Filter out anything we've shown this session OR the user already swiped before
            const newMovies = results.filter(movie => {
                if (sessionSeenRef.current.has(movie.id)) return false;
                if (persistedSeen.includes(movie.id)) return false;
                sessionSeenRef.current.add(movie.id);
                return true;
            });

            // Sort highest-rated first. Cards are rendered bottom-to-top so we reverse for the stack.
            const sorted = [...newMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0));

            setMovies(prev => [...sorted.reverse(), ...prev]);

            // Preload posters
            sorted.forEach(movie => {
                if (movie.poster) { const img = new Image(); img.src = movie.poster; }
            });

            // If this page had nothing new for the user, try the next page immediately
            if (newMovies.length === 0 && totalPages > 1) {
                isFetchingRef.current = false;
                await fetchMore(currentFilters, currentType);
                return;
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [currentUser]);

    // Reset everything when filters or mediaType change, then start fresh from page 1
    useEffect(() => {
        setMovies([]);
        nextPageRef.current = 1;
        totalPagesRef.current = null;
        sessionSeenRef.current = new Set();
        fetchMore(filters, mediaType);
    }, [filters, mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

    const popMovie = useCallback(() => {
        let popped = null;
        setMovies(prev => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            popped = next.pop();
            // Pre-fetch next batch when stack is running low
            if (next.length < 8 && !isFetchingRef.current) {
                setTimeout(() => fetchMore(filters, mediaType), 10);
            }
            return next;
        });
        return popped;
    }, [fetchMore, filters, mediaType]);

    const pushMovie = useCallback((movie) => {
        setMovies(prev => [...prev, movie]);
        // Remove from session seen so the undo doesn't "lose" the movie
        sessionSeenRef.current.delete(movie.id);
    }, []);

    return { movies, loading, popMovie, pushMovie };
};
