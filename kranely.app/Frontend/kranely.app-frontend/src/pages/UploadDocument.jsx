/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


import { Upload, FileText, Check, X, Loader2 } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function UploadDocument() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'altro',
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userName = user?.fullName || userEmail;

  // Convex mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadData({ ...uploadData, file: e.dataTransfer.files[0] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title || !userEmail) return;

    setIsUploading(true);

    try {
      // 1. Get upload URL from Convex
      const postUrl = await generateUploadUrl();

      // 2. Upload file to Convex storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": uploadData.file.type },
        body: uploadData.file,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      // 3. Create document record in Convex
      await createDocument({
        title: uploadData.title,
        description: uploadData.description || undefined,
        category: uploadData.category,
        file_url: storageId, // Store the storageId, backend can resolve it
        file_name: uploadData.file.name,
        file_type: uploadData.file.type,
        file_size: uploadData.file.size,
        email: userEmail,
        uploaded_by: userName,
      });

      setIsUploading(false);
      navigate(createPageUrl('Documents'));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error during upload. Please try again.");
      setIsUploading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#141210] via-[#1C1A18] to-[#535252] relative overflow-hidden">
      
      

      <div className="pt-0 relative z-10 min-h-screen pb-safe">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white mb-1 sm:mb-2">Upload Document</h1>
            <p className="text-xs sm:text-sm text-white/70">Add a new file</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1C1A18]/30 backdrop-blur-xl border border-white/10 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden hover:bg-[#1C1A18]/40 transition-all duration-300"
          >
            <form onSubmit={handleUpload} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive
                  ? 'border-white/10 bg-white/'
                  : 'border-white/ hover:border-white/ hover:bg-white/'
                  }`}
              >
                <input
                  type="file"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload size={48} className="text-white mx-auto mb-4" />
                {uploadData.file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-white">
                      <FileText size={20} />
                      <span className="font-medium">{uploadData.file.name}</span>
                    </div>
                    <div className="text-sm text-white/40">
                      {(uploadData.file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-white mb-2">Drag file here or click to select</p>
                    <p className="text-sm text-white/40">All formats are supported</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Title *</Label>
                  <Input
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    required
                    placeholder="Document name"
                    className="bg-[#535252]/ backdrop-blur-sm border-white/ text-white placeholder:text-white/40 focus:bg-[#535252]/ transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Category</Label>
                  <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                    <SelectTrigger className="bg-[#535252]/ backdrop-blur-sm border-white/ text-white hover:bg-[#535252]/ transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#535252] border-white/ backdrop-blur-xl">
                      <SelectItem value="preventivo">Quote</SelectItem>
                      <SelectItem value="contratto">Contratto</SelectItem>
                      <SelectItem value="fattura">Fattura</SelectItem>
                      <SelectItem value="progetto">Progetto</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Add document details..."
                  className="bg-[#535252]/ backdrop-blur-sm border-white/ text-white placeholder:text-white/40 focus:bg-[#535252]/ transition-all min-h-[100px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Documents'))}
                  className="flex-1 border-white/ text-white hover:bg-white/ backdrop-blur-sm"
                >
                  <X size={18} className="mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !uploadData.file || !uploadData.title}
                  className="flex-1 bg-gradient-to-r from-[#F0EBE8] to-[#f0ebe8] text-[#141210] hover:shadow-xl disabled:opacity-50"
                >
                  {isUploading ? (
                    'Loading...'
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
