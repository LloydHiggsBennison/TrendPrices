import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchForm({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: Adidas Samba, iPhone 15, PlayStation 5..."
          disabled={isLoading}
          className="w-full h-14 pl-5 pr-36 bg-darkCard/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg transition-all shadow-premium"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 px-6 h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl font-medium transition-all shadow-md active:scale-95 disabled:pointer-events-none"
        >
          <Search size={18} />
          <span>{isLoading ? 'Analizando...' : 'Analizar'}</span>
        </button>
      </div>
    </form>
  );
}
