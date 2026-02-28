import React, { useEffect, useState } from 'react'
import { Sparkles, Star, Play, X } from 'lucide-react'
import { tmdbService } from '../services/tmdb'

const DailyRecommendation = ({ onWatch, onClose }) => {
    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch a trending movie as the daily recommendation
        tmdbService.getMovies(1, { sort_by: 'vote_average.desc', 'vote_count.gte': 1000 })
            .then(movies => {
                if (movies && movies.length > 0) {
                    // Pick a random one from the top 10
                    const randomMovie = movies[Math.floor(Math.random() * Math.min(movies.length, 10))]
                    setMovie(randomMovie)
                }
                setLoading(false)
            })
    }, [])

    if (loading || !movie) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-pop">
            <div className="relative w-full max-w-md bg-dark-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all z-20"
                >
                    <X size={20} />
                </button>

                <div className="relative h-[400px]">
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />

                    <div className="absolute top-8 left-8">
                        <div className="flex items-center gap-2 px-4 py-2 bg-tinder-gradient rounded-full shadow-lg shadow-primary-start/40">
                            <Sparkles size={16} fill="white" className="text-white" />
                            <span className="text-xs font-black uppercase tracking-widest text-white">Movie of the Day</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 -mt-16 relative z-10">
                    <h2 className="text-3xl font-black mb-2 leading-tight">
                        {movie.title}
                    </h2>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-1.5 text-accent-gold font-bold">
                            <Star size={18} fill="currentColor" />
                            <span>{movie.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-500 font-medium">{movie.year}</span>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3">
                        {movie.description}
                    </p>

                    <button
                        onClick={() => onWatch(movie)}
                        className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <Play size={24} fill="black" /> Watch Details
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DailyRecommendation
