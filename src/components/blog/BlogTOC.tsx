import React, { useState, useEffect } from 'react';
import { List, X, ChevronRight } from 'lucide-react';

export interface Heading {
    id: string;
    text: string;
    level: number;
}

interface Props {
    headings: Heading[];
}

const BlogTOC: React.FC<Props> = ({ headings }) => {
    const [activeId, setActiveId] = useState<string>('');
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -60% 0px' }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            // Offset for sticky header if any
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        setIsMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden mb-8">
                <button 
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between font-bold text-gray-800 shadow-sm"
                >
                    <span className="flex items-center gap-2">
                        <List size={20} className="text-[#b5128f]" />
                        Table of Contents
                    </span>
                    {isMobileOpen ? <X size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {isMobileOpen && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4 shadow-md animate-in slide-in-from-top-2">
                        <ul className="space-y-3">
                            {headings.map((heading) => (
                                <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
                                    <a
                                        href={`#${heading.id}`}
                                        onClick={(e) => handleClick(e, heading.id)}
                                        className={`block text-sm transition-colors ${
                                            activeId === heading.id
                                                ? 'text-[#b5128f] font-bold'
                                                : 'text-gray-600 hover:text-[#b5128f]'
                                        }`}
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Desktop Sticky TOC */}
            <div className="hidden lg:block sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 scrollbar-hide">
                <div className="flex items-center gap-2 mb-6 text-[#2D1B4E]">
                    <List size={20} className="text-[#b5128f]" />
                    <h3 className="font-black font-comfortaa uppercase tracking-widest text-xs">In This Article</h3>
                </div>
                
                <nav className="border-l-2 border-gray-100 relative">
                    {/* Active highlight indicator line */}
                    <div 
                        className="absolute left-[-2px] top-0 w-[2px] bg-[#b5128f] transition-all duration-300"
                        style={{
                            height: activeId ? '24px' : '0',
                            transform: `translateY(${
                                headings.findIndex(h => h.id === activeId) * 36 + (headings.find(h => h.id === activeId)?.level === 3 ? 4 : 0)
                            }px)`,
                            opacity: activeId ? 1 : 0
                        }}
                    />
                    
                    <ul className="space-y-4">
                        {headings.map((heading) => (
                            <li key={heading.id} className={heading.level === 3 ? 'pl-6' : 'pl-4'}>
                                <a
                                    href={`#${heading.id}`}
                                    onClick={(e) => handleClick(e, heading.id)}
                                    className={`block text-sm leading-tight transition-colors ${
                                        activeId === heading.id
                                            ? 'text-[#b5128f] font-bold'
                                            : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {heading.text}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default BlogTOC;
