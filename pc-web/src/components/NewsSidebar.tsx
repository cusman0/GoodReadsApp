import React from 'react';
import { Trophy, MessageCircle } from 'lucide-react';
import { NEWS_ITEMS } from '../data/mockData';

export const NewsSidebar: React.FC = () => {
  return (
    <aside className="space-y-4">
      {/* Goodreads Choice Awards Banner */}
      <div className="bg-[#382110] rounded-lg p-4 text-[#F4F1EA] shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-[#ED9220] rounded-full text-[#382110]">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#ED9220]">
            Announcing the Winners
          </span>
        </div>
        <h3 className="font-serif text-base font-bold leading-tight">
          Goodreads Choice Awards 2026
        </h3>
        <p className="text-xs text-[#D8D5CD] mt-1.5 leading-relaxed">
          Millions of votes cast. Discover the best books of the year across 17 categories.
        </p>
        <button className="mt-3 inline-block bg-[#409D69] hover:bg-[#358257] text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors">
          View all 17 winners →
        </button>
      </div>

      {/* News & Interviews */}
      <div className="bg-white rounded-lg border border-[#E0DDD5] p-4">
        <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110] mb-3">
          NEWS & INTERVIEWS
        </h3>

        <div className="space-y-3">
          {NEWS_ITEMS.map(item => (
            <article key={item.id} className="flex gap-3 group cursor-pointer">
              <img
                src={item.image}
                alt={item.title}
                className="w-14 h-14 object-cover rounded-md border border-gray-100 shrink-0 group-hover:opacity-90"
              />
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-xs text-gray-900 group-hover:text-[#00635D] line-clamp-2 leading-tight">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                  <span>{item.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MessageCircle className="w-3 h-3" /> {item.comments}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 text-right">
          <a href="#news" className="text-[11px] font-semibold text-[#00635D] hover:underline">
            More news & interviews →
          </a>
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="bg-[#FAF9F6] rounded-lg border border-[#E0DDD5] p-4">
        <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110] mb-2">
          QUOTE OF THE DAY
        </h3>
        <blockquote className="font-serif italic text-xs text-gray-700 leading-relaxed">
          “To allow yourself to play with another person is no small risk. It means allowing
          yourself to be open, to be exposed, to be hurt.”
        </blockquote>
        <p className="text-right text-[11px] font-medium text-gray-600 mt-2">
          ― Gabrielle Zevin, <span className="italic">Tomorrow, and Tomorrow, and Tomorrow</span>
        </p>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-gray-400 space-y-2 pt-2 px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#about" className="hover:underline">About us</a>
          <a href="#careers" className="hover:underline">Careers</a>
          <a href="#terms" className="hover:underline">Terms</a>
          <a href="#privacy" className="hover:underline">Privacy</a>
          <a href="#help" className="hover:underline">Help</a>
        </div>
        <p>© 2026 Goodreads, Inc. Recreated UI Experience.</p>
      </div>
    </aside>
  );
};

