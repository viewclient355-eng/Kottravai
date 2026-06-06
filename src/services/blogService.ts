import postsData from '@/data/posts.json';
import { BlogPost } from '@/types/blog';

// In the future, this can be swapped out for a fetch call to Supabase or a Headless CMS
class BlogService {
    private posts: BlogPost[];

    constructor() {
        this.posts = postsData as BlogPost[];
    }

    async getAllPosts(): Promise<BlogPost[]> {
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => resolve(this.posts), 100);
        });
    }

    async getPostBySlug(slug: string): Promise<BlogPost | null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const post = this.posts.find(p => p.slug === slug);
                resolve(post || null);
            }, 100);
        });
    }

    async getFeaturedPost(): Promise<BlogPost | null> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const post = this.posts.find(p => p.featured);
                resolve(post || null);
            }, 50);
        });
    }

    async getRelatedPosts(category: string, currentSlug: string, limit = 3): Promise<BlogPost[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const related = this.posts
                    .filter(p => p.category === category && p.slug !== currentSlug)
                    .slice(0, limit);
                
                // If not enough in category, fill with others
                if (related.length < limit) {
                    const others = this.posts
                        .filter(p => p.slug !== currentSlug && !related.find(r => r.id === p.id))
                        .slice(0, limit - related.length);
                    related.push(...others);
                }
                
                resolve(related);
            }, 50);
        });
    }

    getAllCategories(): string[] {
        const categories = new Set(this.posts.map(p => p.category));
        return Array.from(categories);
    }
}

export const blogService = new BlogService();
