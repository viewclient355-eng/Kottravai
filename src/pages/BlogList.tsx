import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { blogService } from '@/services/blogService';
import { BlogPost } from '@/types/blog';
import BlogSEO from '@/components/blog/BlogSEO';
import { Search, Tag, Clock } from 'lucide-react';
import analytics from '@/utils/analyticsService';

const BlogList = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlogData = async () => {
            setIsLoading(true);
            try {
                const allPosts = await blogService.getAllPosts();
                const featured = await blogService.getFeaturedPost();
                const cats = blogService.getAllCategories();
                
                setPosts(allPosts);
                setFeaturedPost(featured || allPosts[0]);
                setCategories(['All', ...cats]);
                
                analytics.trackEvent('blog_list_view');
            } catch (error) {
                console.error("Failed to fetch blog data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogData();
    }, []);

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              post.metaDescription.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
        
        // Don't show the featured post in the regular grid if no filters are active
        const isNotFeatured = (searchQuery === '' && activeCategory === 'All') 
                              ? post.id !== featuredPost?.id 
                              : true;

        return matchesSearch && matchesCategory && isNotFeatured;
    });

    return (
        <MainLayout>
            <BlogSEO isList={true} />

            <div className="bg-white min-h-screen">
                {/* Header Section */}
                <div className="bg-[#FFF5F3] py-10 md:py-16 border-b border-[#FFE4DE]">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-black text-[#2D1B4E] mb-6">
                            Kottravai Journal
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10">
                            Discover stories about artisan craftsmanship, sustainable living, women entrepreneurship, and eco-friendly home decor.
                        </p>
                        
                        {/* Search and Filter */}
                        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 justify-center items-center">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-full border border-gray-200 focus:outline-none focus:border-[#b5128f] focus:ring-1 focus:ring-[#b5128f] transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        
                        {/* Category Pills */}
                        <div className="flex flex-wrap justify-center gap-2 mt-8">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                                        activeCategory === category 
                                        ? 'bg-[#2D1B4E] text-white' 
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#b5128f] hover:text-[#b5128f]'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#b5128f] rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Featured Article */}
                            {featuredPost && searchQuery === '' && activeCategory === 'All' && (
                                <div className="mb-20">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-2 h-6 bg-[#b5128f] rounded-sm"></div>
                                        <h2 className="text-2xl font-black text-[#2D1B4E] uppercase tracking-widest">Featured Story</h2>
                                    </div>
                                    <Link to={`/blog/${featuredPost.slug}`} className="group block">
                                        <div className="grid md:grid-cols-2 gap-8 items-center bg-gray-50 rounded-3xl p-4 md:p-8 border border-gray-100 hover:shadow-xl transition-all">
                                            <div className="overflow-hidden rounded-2xl h-64 md:h-96">
                                                <img 
                                                    src={featuredPost.featuredImage} 
                                                    alt={featuredPost.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center px-4 md:px-8">
                                                <span className="inline-block px-3 py-1 bg-[#FFE4DE] text-[#9F1239] text-xs font-bold rounded-full mb-4 w-max uppercase tracking-wider">
                                                    {featuredPost.category}
                                                </span>
                                                <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 group-hover:text-[#b5128f] transition-colors leading-tight">
                                                    {featuredPost.title}
                                                </h3>
                                                <p className="text-gray-600 mb-6 text-lg line-clamp-3">
                                                    {featuredPost.metaDescription}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                                    <span>{new Date(featuredPost.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Clock size={14} /> {featuredPost.readingTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* Feed Grid */}
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-2 h-6 bg-gray-300 rounded-sm"></div>
                                <h2 className="text-2xl font-black text-[#2D1B4E] uppercase tracking-widest">
                                    {searchQuery ? 'Search Results' : 'Latest Articles'}
                                </h2>
                            </div>

                            {filteredPosts.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                                    <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
                                    <button 
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                        className="mt-4 text-[#b5128f] font-bold hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredPosts.map((post) => (
                                        <Link key={post.id} to={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden h-full">
                                            <div className="relative h-56 overflow-hidden">
                                                <img
                                                    src={post.featuredImage}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                                                    {post.category}
                                                </div>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-medium">
                                                    <span>{new Date(post.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readingTime}</span>
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#b5128f] transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                <p className="text-gray-600 mb-6 text-sm line-clamp-3 flex-1">
                                                    {post.metaDescription}
                                                </p>
                                                
                                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                                                    {post.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                            <Tag size={10} /> {tag}
                                                        </span>
                                                    ))}
                                                    {post.tags.length > 2 && (
                                                        <span className="text-[10px] font-bold text-gray-400 py-1">+{post.tags.length - 2} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default BlogList;
