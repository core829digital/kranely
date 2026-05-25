import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
// import { base44 } from '@/api/base44Client';
import SEO from '../components/seo/SEO';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const post = useQuery(api.blog_posts.getBySlug, { slug: slug || "" });

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center">
        <div className="text-center text-white">
<p className="text-xl mb-4">Article not found</p>
          <Link to={createPageUrl('Blog')}>
            <button className="px-6 py-3 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] rounded-full">
              Back to Blog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featured_image,
    "datePublished": post.published_date,
    "author": {
      "@type": "Person",
      "name": post.author_name
    },
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
        title={post.title}
        description={post.excerpt}
        keywords={post.tags?.join(', ') || ''}
        image={post.featured_image}
        structuredData={structuredData}
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-[#1C1A18] overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute inset-0"
        >
          <img
            src={post.featured_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#141210]/80 to-[#141210]" />

        <div className="relative max-w-4xl mx-auto px-6">
          <Link to={createPageUrl('Blog')}>
            <motion.button
              whileHover={{ x: -5 }}
              className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
<ArrowLeft size={20} />
              Back to Blog
            </motion.button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] rounded-full text-sm font-medium inline-block mb-6">
              {post.category}
            </span>
            <h1 className="text-3xl lg:text-5xl font-light text-white mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {post.published_date && format(new Date(post.published_date), 'd MMMM yyyy', { locale: it })}
              </span>
              {post.read_time && (
                <span className="flex items-center gap-2">
<Clock size={16} />
                    {post.read_time} min read
                  </span>
              )}
              <span>By {post.author_name}</span>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#535252]/ hover:bg-[#535252] rounded-full transition-colors"
              >
<Share2 size={16} />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#141210] via-[#1C1A18] to-[#535252]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-3xl font-medium text-white mt-12 mb-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-2xl font-medium text-white mt-8 mb-4">{children}</h3>,
                p: ({ children }) => <p className="text-white/70 leading-relaxed mb-6">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside text-white/70 mb-6 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-white/70 mb-6 space-y-2">{children}</ol>,
                a: ({ children, href }) => <a href={href} className="text-white hover:text-white/60 underline">{children}</a>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-white/ pl-6 py-2 my-6 italic text-white/70">
                    {children}
                  </blockquote>
                ),
                img: ({ src, alt }) => (
                  <img src={src} alt={alt} className="rounded-2xl w-full my-8" />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </motion.article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/">
              <h3 className="text-lg font-medium text-white mb-4">Tag</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-[#535252]/ text-white/70 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

