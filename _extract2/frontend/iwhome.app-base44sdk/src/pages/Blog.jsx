import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
// import { base44 } from '@/api/base44Client';
import SEO from '../components/seo/SEO';
import { Calendar, Clock, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const categories = [
  { id: 'all', name: 'Tutti' },
  { id: 'ristrutturazioni', name: 'Ristrutturazioni' },
  { id: 'finestre', name: 'Finestre' },
  { id: 'materiali', name: 'Materiali' },
  { id: 'design', name: 'Design' },
  { id: 'guide', name: 'Guide' },
  { id: 'novita', name: 'Novità' }];

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
    "name": "IwHome Blog",
    "description": "Consigli, guide e novità su ristrutturazioni, infissi e design per la casa",
    "url": window.location.href,
    "publisher": {
      "@type": "Organization",
      "name": "IwHome",
      "logo": {
        "@type": "ImageObject",
        "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/95bae648d_logo.png"
      }
    }
  };

  return (
    <div>
      <SEO
        title="Blog IwHome | Guide, Consigli e Novità su Ristrutturazioni e Infissi"
        description="Scopri guide pratiche, consigli professionali e le ultime novità su ristrutturazioni, infissi e design per la casa dal team di esperti IwHome."
        keywords="blog ristrutturazioni, guide infissi, consigli design casa, novità materiali edili, guide pratiche ristrutturazione"
        structuredData={structuredData}
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Blog & News</span>
            <h1 className="text-4xl lg:text-6xl font-light text-[#f8f9fa] mt-4 mb-6">
              Guide e <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">consigli</span>
            </h1>
            <p className="text-[#dee2e6] max-w-2xl mx-auto text-lg">
              Scopri i nostri articoli su ristrutturazioni, materiali, design e molto altro
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="relative py-8 bg-gradient-to-b from-[#495057] to-[#6c757d] border-b border-[#f8f9fa]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]'
                    : 'bg-[#343a40]/50 text-[#dee2e6] hover:bg-[#495057]'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca articoli..."
                className="pl-10 rounded-full bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#6c757d] via-[#495057] to-[#343a40]">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="text-center text-[#dee2e6] py-20">Caricamento...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-[#dee2e6] py-20">
              <p className="text-xl mb-4">Nessun articolo trovato</p>
              <p className="text-sm text-[#adb5bd]">Prova a cambiare i filtri di ricerca</p>
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
                  className="bg-gradient-to-br from-[#495057]/50 to-[#6c757d]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-3xl overflow-hidden shadow-xl"
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
                      <span className="px-3 py-1 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full text-xs font-medium">
                        {categories.find(c => c.id === post.category)?.name || post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-[#adb5bd] mb-3">
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
                    <h3 className="text-xl font-medium text-[#f8f9fa] mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[#dee2e6] mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <Link to={createPageUrl(`BlogPost?slug=${post.slug}`)}>
                      <button className="flex items-center gap-2 text-[#f8f9fa] hover:text-[#e9ecef] transition-colors text-sm font-medium">
                        Leggi di più
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