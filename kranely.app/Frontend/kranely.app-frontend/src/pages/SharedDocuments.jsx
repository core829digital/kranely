/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';


import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import { FileText, Eye, Share2, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SharedDocuments() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewPdfUrl, setViewPdfUrl] = useState(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Fetch documents shared with this user from Convex
  const sharedDocuments = useQuery(api.documents.getSharedWith, { email: userEmail }) || [];
  const chatFiles = useQuery(api.documents.getChatSharedFiles, userEmail ? { email: userEmail } : "skip") || [];

  const allFiles = [...sharedDocuments, ...chatFiles];

  const filteredDocuments = allFiles.filter((doc) =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#141210] via-[#1C1A18] to-[#535252] relative overflow-hidden">


      <UniversalPdfViewer
        isOpen={!!viewPdfUrl}
        onClose={() => setViewPdfUrl(null)}
        url={viewPdfUrl}
        title="Shared Document View"
      />

      <div className="pt-0 relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white mb-1 sm:mb-2">Shared with Me</h1>
              <p className="text-xs sm:text-sm text-white/70">Shared documents</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1C1A18]/30 backdrop-blur-sm border-white/10 text-white focus:bg-[#1C1A18]/50 transition-all"
              />
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Share2 size={64} className="text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg">No shared documents</p>
              <p className="text-white/40 text-sm mt-2">Shared documents will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-[#1C1A18]/30 backdrop-blur-xl border border-white/10 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl hover:bg-[#1C1A18]/50 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/8 backdrop-blur-sm flex items-center justify-center">
                      <FileText size={24} className="text-white" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${doc.category === 'chat' ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'bg-white/8 text-white'}`}>
                      {doc.category === 'chat' ? 'Chat' : doc.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-sm text-white/70 mb-4 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="text-xs text-white/40 mb-4">
                    Shared by: {doc.created_by}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (doc.file_url) {
                        setViewPdfUrl(doc.file_url);
                      }
                    }}
                    className="w-full bg-[#535252]/50 backdrop-blur-sm border border-white/10 text-white hover:bg-white/8"
                  >
                    <Eye size={14} className="mr-2" />
                    View
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



