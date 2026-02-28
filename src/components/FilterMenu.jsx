import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { tmdbService } from '../services/tmdb'
import { useMovieStore } from '../store/useMovieStore'

const FilterMenu = ({ onClose }) => {
    const { filters, updateFilters } = useMovieStore()
    const [genres, setGenres] = useState([])
    const [localFilters, setLocalFilters] = useState(filters)

    useEffect(() => {
        tmdbService.getGenres().then(setGenres)
    }, [])

    const handleApply = () => {
        updateFilters(localFilters)
        onClose()
    }

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-dark-card shadow-2xl flex flex-col p-8 border-l border-white/10 transform transition-transform animate-slide-in">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black">Filters</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-10 pr-2 custom-scrollbar">
                {/* Genre Selection */}
                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Genre</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setLocalFilters({ ...localFilters, genreId: '' })}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${localFilters.genreId === '' ? 'bg-primary-start text-white shadow-lg shadow-primary-start/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            All Genres
                        </button>
                        {genres.map(genre => (
                            <button
                                key={genre.id}
                                onClick={() => setLocalFilters({ ...localFilters, genreId: genre.id })}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${localFilters.genreId === genre.id ? 'bg-primary-start text-white shadow-lg shadow-primary-start/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                {genre.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Rating Selection */}
                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Min Rating: {localFilters.minRating}</h3>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={localFilters.minRating}
                        onChange={(e) => setLocalFilters({ ...localFilters, minRating: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-start"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-600">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                    </div>
                </section>

                {/* Year Input */}
                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Release Year</h3>
                    <input
                        type="number"
                        placeholder="e.g. 2024"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-start transition-colors"
                        value={localFilters.year}
                        onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value })}
                    />
                </section>
            </div>

            <div className="pt-8 border-t border-white/10 mt-auto">
                <button
                    onClick={handleApply}
                    className="w-full py-4 bg-tinder-gradient rounded-2xl font-bold shadow-xl shadow-primary-start/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Apply Filters <Check size={20} />
                </button>
            </div>
        </div>
    )
}

export default FilterMenu
