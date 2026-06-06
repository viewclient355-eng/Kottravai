export interface BlogPost {
    id: string | number;
    slug: string;
    title: string;
    seoTitle: string;
    metaDescription: string;
    category: string;
    tags: string[];
    featuredImage: string;
    publishDate: string;
    author: string;
    readingTime: string;
    featured: boolean;
    relatedProducts: string[];
    
    // For mid-article splitting
    contentPart1: string;
    contentPart2: string;
}

export interface BlogCategory {
    id: string;
    name: string;
}
