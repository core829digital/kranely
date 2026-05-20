import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { useTranslation } from 'react-i18next';
// import { base44 } from '@/api/base44Client';
import SEO from '../components/seo/SEO';
import { Calendar, Clock, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'ristrutturazioni', name: 'Restructuring' },
  { id: 'finestre', name: 'Windows' },
  { id: 'materiali', name: 'Materials' },
  { id: 'design', name: 'Design' },
  { id: 'guide', name: 'Guides' },
  { id: 'novita', name: 'News' }];

const categoryFallbackImages = {
  ristrutturazioni: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
  finestre: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  materiali: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  design: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
  guide: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  novita: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
};

const getFallbackImage = (category, index) => {
  const indexFallbacks = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'];
  return categoryFallbackImages[category] || indexFallbacks[index % indexFallbacks.length] || categoryFallbackImages.default;
};

export default function Blog() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const posts = useQuery(api.blog_posts.get) || [];
  const isLoading = posts === undefined; // simplified check
  // const { data: posts = [], isLoading } = useQuery({
  //   queryKey: ['blog-posts'],
  //   queryFn: () => base44.entities.BlogPost.filter({ published: true }, '-published_date'),
  // });

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
"name": "Kranely Blog",
    "description": "Tips, guides and news on restructuring, windows and design for the home",
    "url": window.location.href,
    "publisher": {
      "@type": "Organization",
      "name": "Kranely",
      "logo": {
        "@type": "ImageObject",
        "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/95bae648d_logo.png"
      }
    }
  };

  return (
    <div>
      <SEO
title="Kranely Blog | Guides, Tips and News on Restructuring and Windows"
        description="Discover practical guides, professional tips and the latest news on restructuring, windows and design for the home from the Kranely expert team."
        keywords="blog restructuring, window guides, home design tips, building materials news, practical restructuring guides"
        structuredData={structuredData}
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-[#1C1A18] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#F0EBE8]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
<span className="text-white text-sm tracking-widest uppercase">Blog & News</span>
            <h1 className="text-4xl lg:text-6xl font-light text-white mt-4 mb-6">
              Guides and <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8]">tips</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Discover our articles on restructuring, materials, design and more
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="relative py-8 bg-gradient-to-b from-[#535252] to-[#535252] border-b border-white/">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210]'
                    : 'bg-[#1C1A18]/ text-white/70 hover:bg-[#535252]'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="pl-10 rounded-full bg-[#1C1A18]/ border-white/ text-white placeholder:text-white/40"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#535252] via-[#535252] to-[#1C1A18]">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
<div className="text-center text-white/70 py-20">Loading...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-white/70 py-20">
              <p className="text-xl mb-4">No articles found</p>
              <p className="text-sm text-white/40">Try changing the search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-gradient-to-br from-[#535252]/50 to-[#535252]/50 backdrop-blur-sm border border-white/ rounded-3xl overflow-hidden shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.featured_image || getFallbackImage(post.category, index)}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.src = categoryFallbackImages.default; }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] rounded-full text-xs font-medium">
                        {categories.find(c => c.id === post.category)?.name || post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {post.published_date && format(new Date(post.published_date), 'd MMMM yyyy', { locale: it })}
                      </span>
                      {post.read_time && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {post.read_time} min
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-medium text-white mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-white/70 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
<Link to={createPageUrl(`BlogPost?slug=${post.slug}`)}>
                      <button className="flex items-center gap-2 text-white hover:text-white/60 transition-colors text-sm font-medium">
                        Read more
                        <ArrowRight size={16} />
                      </button>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

