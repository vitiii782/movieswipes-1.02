import { useState, useEffect, useCallback, useRef } from 'react';
import { tmdbService } from '../services/tmdb';
import { useMovieStore } from '../store/useMovieStore';

export const useMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { filters, mediaType, currentUser } = useMovieStore();

    // Refs for tracking state without causing re-renders
    const nextPageRef = useRef(1);
    const totalPagesRef = useRef(null);
    const isFetchingRef = useRef(false);
    // Tracks ALL IDs shown this session to prevent duplicates
    const sessionSeenRef = useRef(new Set());

    const fetchMore = useCallback(async (currentFilters, currentType) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            // Wrap around if we've finished all pages
            if (totalPagesRef.current !== null && nextPageRef.current > totalPagesRef.current) {
                nextPageRef.current = 1;
            }

            const page = nextPageRef.current;
            const response = await tmdbService.getMovies(page, currentFilters, currentType);
            const results = response.results || [];
            const totalPages = response.totalPages || 1;

            totalPagesRef.current = totalPages;
            nextPageRef.current = page + 1;

            const persistedSeen = currentUser?.seenIds?.[currentType] || [];

            // Filter: skip anything already shown this session or previously swiped
            const newMovies = results.filter(movie => {
                if (sessionSeenRef.current.has(movie.id)) return false;
                if (persistedSeen.includes(movie.id)) return false;
                sessionSeenRef.current.add(movie.id);
                return true;
            });

            // Sort highest-rated first. Stack renders top-last so reverse for correct display order.
            const sorted = [...newMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            setMovies(prev => [...sorted.reverse(), ...prev]);

            // Preload poster images in background (no await, pure perf boost)
            sorted.forEach(movie => {
                if (movie.poster) { const img = new Image(); img.src = movie.poster; }
            });

            // If this page yielded nothing new, skip to next page immediately
            if (newMovies.length === 0 && totalPages > 1) {
                isFetchingRef.current = false;
                await fetchMore(currentFilters, currentType);
                return;
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            isFetchingRef.current = false;
        }
    }, [currentUser]);

    // When entering a category, pick a random starting page for variety,
    // then immediately pre-fill the stack with 2 pages for lag-free swiping.
    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            setMovies([]);
            nextPageRef.current = 1;
            totalPagesRef.current = null;
            sessionSeenRef.current = new Set();
            isFetchingRef.current = false;
            setLoading(true);

            // 1. Fetch metadata (page 1) to learn exactly how many pages exist
            // This prevents requesting a page that doesn't exist (e.g. page 15 of 3)
            const first = await tmdbService.getMovies(1, filters, mediaType);
            if (cancelled) return;

            const totalPages = first.totalPages || 1;
            totalPagesRef.current = totalPages;

            // 2. Pick a random starting page based on REAL totalPages
            const randomStartPage = totalPages > 1
                ? Math.floor(Math.random() * Math.min(totalPages, 20)) + 1
                : 1;

            let mainResults = [];
            let actualStartPage = 1;

            if (randomStartPage === 1) {
                mainResults = first.results || [];
                actualStartPage = 1;
            } else {
                const randomBatch = await tmdbService.getMovies(randomStartPage, filters, mediaType);
                if (cancelled) return;
                mainResults = randomBatch.results || [];
                actualStartPage = randomStartPage;

                // If the random page happened to be empty (rare with real totalPages), fallback to page 1
                if (mainResults.length === 0) {
                    mainResults = first.results || [];
                    actualStartPage = 1;
                }
            }

            const persistedSeen = currentUser?.seenIds?.[mediaType] || [];
            const filterBatch = (batch) => batch.filter(m => {
                if (persistedSeen.includes(m.id)) return false;
                if (sessionSeenRef.current.has(m.id)) return false;
                sessionSeenRef.current.add(m.id);
                return true;
            });

            const filteredMain = filterBatch(mainResults);

            // Sort and set as initial stack
            const sorted = [...filteredMain].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            setMovies(sorted.reverse());
            sorted.forEach(m => { if (m.poster) { const img = new Image(); img.src = m.poster; } });

            // 3. If stack is still very small, try one more random page to fill up
            if (filteredMain.length < 10 && totalPages > 1 && !cancelled) {
                let secondPage = Math.floor(Math.random() * Math.min(totalPages, 40)) + 1;
                if (secondPage === actualStartPage) secondPage = (secondPage % totalPages) + 1;

                const second = await tmdbService.getMovies(secondPage, filters, mediaType);
                if (cancelled) return;
                const filteredSecond = filterBatch(second.results || []);
                const sorted2 = [...filteredSecond].sort((a, b) => (b.rating || 0) - (a.rating || 0));
                setMovies(prev => [...sorted2.reverse(), ...prev]);
                sorted2.forEach(m => { if (m.poster) { const img = new Image(); img.src = m.poster; } });
                nextPageRef.current = secondPage + 1;
            } else {
                nextPageRef.current = actualStartPage + 1;
            }

            setLoading(false);
        };

        initialize();
        return () => { cancelled = true; };
    }, [filters, mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

    const popMovie = useCallback(() => {
        let popped = null;
        setMovies(prev => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            popped = next.pop();
            // Pre-fetch when stack is getting low — threshold of 15 for buffer
            if (next.length < 15 && !isFetchingRef.current) {
                setTimeout(() => fetchMore(filters, mediaType), 0);
            }
            return next;
        });
        return popped;
    }, [fetchMore, filters, mediaType]);

    const pushMovie = useCallback((movie) => {
        setMovies(prev => [...prev, movie]);
        sessionSeenRef.current.delete(movie.id);
    }, []);

    return { movies, loading, popMovie, pushMovie };
};
