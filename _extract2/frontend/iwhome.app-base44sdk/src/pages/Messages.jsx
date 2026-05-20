/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { convertToWebP } from '../utils/imageConverter';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


import PollMessage from '../components/chat/PollMessage';
import CreatePollModal from '../components/chat/CreatePollModal';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';


import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  BarChart,
  ThumbsUp,
  Plus,
  X,
  UserPlus,
  Clock,
  ShieldCheck,
  Search,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function Messages() {
  const { user } = useUser();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageText, setMessageText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false); // New state for poll modal
  const [documentModalOpen, setDocumentModalOpen] = useState(false); // New state for doc modal
  const [viewPdfUrl, setViewPdfUrl] = useState(null); // PDF Viewer state

  // Verification states
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [contactFilter, setContactFilter] = useState('clienti');
  const [conversationFilter, setConversationFilter] = useState('all'); // 'all', 'client', 'company'
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // Auto-open conversation when navigated from Preventivi with ?clientEmail=xxx
  const clientEmailParam = searchParams.get('clientEmail');

  /* Data Fetching */
  const conversations = useQuery(api.chat.listChannels, {
    email: user?.primaryEmailAddress?.emailAddress || "",
    filter: conversationFilter
  }) || [];

  const allUsers = useQuery(api.users.list) || [];

  const messages = useQuery(api.chat.listMessages,
    selectedConversation ? {
      channel_id: selectedConversation._id,
      is_admin_chat: !!selectedConversation?.is_admin_chat 
    } : "skip"
  ) || [];

  /* Mutations */
  const sendMessageMutation = useMutation(api.chat.sendMessage);
  const likeMutation = useMutation(api.chat.likeMessage);
  const createChannelMutation = useMutation(api.chat.createChannel);
  const verifyAccountMutation = useMutation(api.users.verifyAccount);
  // Duplicates removed
  const deleteConversationMutation = useMutation(api.conversations.deleteConversation);
  const deleteMessageMutation = useMutation(api.conversations.deleteMessage);
  const deleteChannelMutation = useMutation(api.chat.deleteChannel);
  const deleteChannelMessageMutation = useMutation(api.chat.deleteChannelMessage);
  const markAsReadMutation = useMutation(api.conversations.markAsRead);

  const handleVerifyAccount = async () => {
    try {
      const result = await verifyAccountMutation({ accessCode });
      if (result.success) {
        alert(result.message);
        setVerifyModalOpen(false);
        setAccessCode('');
        // Refresh logic if needed, but react query should handle it
        window.location.reload();
      }
    } catch (e) {
      alert("Codice non valido o errore del server");
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    if (!confirm(`Sei sicuro di voler eliminare la conversazione con ${selectedConversation.name}? Questa azione è irreversibile.`)) {
      return;
    }

    try {
      if (selectedConversation.is_admin_chat) {
        await deleteConversationMutation({ conversation_id: selectedConversation._id });
      } else {
        await deleteChannelMutation({ channel_id: selectedConversation._id });
      }
      setSelectedConversation(null);
      alert("Conversazione eliminata con successo.");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert(`Errore durante l'eliminazione della conversazione: ${error.message || "Errore sconosciuto"}`);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedConversation) return;

    if (!confirm("Eliminare definitivamente questo messaggio?")) return;

    try {
      if (selectedConversation.is_admin_chat) {
        await deleteMessageMutation({ message_id: messageId });
      } else {
        await deleteChannelMessageMutation({ message_id: messageId });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Errore durante l'eliminazione del messaggio");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When navigated with ?clientEmail=xxx, find and auto-select that conversation
  useEffect(() => {
    if (!clientEmailParam || !conversations.length || selectedConversation) return;
    const target = conversations.find(c =>
      c.members?.includes(clientEmailParam) ||
      c.client_email === clientEmailParam
    );
    if (target) {
      onSelectConversation(target);
      setSearchParams({}, { replace: true }); // clean URL
    } else if (user?.primaryEmailAddress?.emailAddress) {
      // Conversation doesn't exist yet — create it
      startNewConversation(clientEmailParam);
      setSearchParams({}, { replace: true });
    }
  }, [clientEmailParam, conversations]);

  const startNewConversation = async (otherUserEmail) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    const myEmail = user.primaryEmailAddress.emailAddress;

    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.members?.length === 2 &&
      c.members.includes(otherUserEmail) &&
      c.members.includes(myEmail)
    );

    if (existing) {
      onSelectConversation(existing);
      setShowContactsList(false);
      return;
    }

    // Create new conversation
    const newConvId = await createChannelMutation({
      name: allUsers.find(u => u.email === otherUserEmail)?.fullName || otherUserEmail,
      type: 'direct',
      members: [myEmail, otherUserEmail],
      company_email: /** @type {string | undefined} */ (user.unsafeMetadata?.company_code) || undefined // Optional
    });

    const newConv = {
      _id: newConvId,
      name: allUsers.find(u => u.email === otherUserEmail)?.fullName || otherUserEmail,
      members: [myEmail, otherUserEmail],
      type: 'direct',
      last_message: '',
      is_admin_chat: false
    };
    onSelectConversation(newConv);
    setShowContactsList(false);
  };

  const onSelectConversation = (conv) => {
    setSelectedConversation(conv);
    if (user?.primaryEmailAddress?.emailAddress && conv.is_admin_chat) {
      markAsReadMutation({
        conversation_id: conv._id,
        reader_email: user.primaryEmailAddress.emailAddress
      }).catch(err => console.error("Mark as read failed:", err));
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const myEmail = user?.primaryEmailAddress?.emailAddress;
    const myName = user?.fullName || myEmail;

    const ephemeralExpiresAt = isEphemeral
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    await sendMessageMutation({
      channel_id: selectedConversation._id,
      sender_email: myEmail,
      sender_name: myName,
      content: messageText,
      is_admin_chat: selectedConversation.is_admin_chat ,
      is_ephemeral: isEphemeral,
      ephemeral_expires_at: ephemeralExpiresAt,
      message_type: 'text'
    });

    setMessageText('');
    setIsEphemeral(false);
    scrollToBottom();
  };


  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileUpload = async (file, type = 'file') => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    // 1. Get Upload URL
    try {
      let fileToUpload = file;

      // Task 14: Universal WEBP Transcoder for JPG/PNG
      if (file.type.startsWith('image/') && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        try {
          const webpBlob = await convertToWebP(file, 0.85);
          fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
        } catch (err) {
          console.error("WebP conversion failed, uploading original:", err);
        }
      }

      const postUrl = await generateUploadUrl();

      // 2. Upload File
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      const myEmail = user.primaryEmailAddress.emailAddress;
      const myName = user.fullName || myEmail;

      const storageUrl = `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;

      await sendMessageMutation({
        channel_id: selectedConversation._id,
        sender_email: myEmail,
        sender_name: myName,
        content: '', // Empty content for file message
        message_type: type,
        file_url: storageUrl, // Storing queryable URL
        file_name: file.name
      });

      setUploadModalOpen(false);

    } catch (error) {
      console.error("Upload failed", error);
      alert("Errore nel caricamento del file");
    }
  };

  const handleLike = (message) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    const myEmail = user.primaryEmailAddress.emailAddress;

    const likes = message.likes || [];
    const hasLiked = likes.includes(myEmail);

    const newLikes = hasLiked
      ? likes.filter(email => email !== myEmail)
      : [...likes, myEmail];

    likeMutation({ messageId: message._id, likes: newLikes });
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '👏', '🙌', '💯'];

  // if (!user) check removed for better UX

  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });

  // if (convexUser === undefined) check handling inline

  // Access control - only Admin, CEO, and Client can access Messages
  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
  const isClient = convexUser?.role === 'client';
  const isSupplier = convexUser?.role === 'supplier';
  const isWorker = ['collaborator', 'collaborator_internal', 'collaborator_external', 'worker', 'operaio'].includes(convexUser?.role);

  // Access check handled inline

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">


      <UniversalPdfViewer
        isOpen={!!viewPdfUrl}
        onClose={() => setViewPdfUrl(null)}
        url={viewPdfUrl}
        title="Visualizzazione Documento"
      />



      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        {convexUser === undefined ? (
          <div className="h-[calc(100vh-76px)] flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : convexUser === null ? (
          <div className="h-[calc(100vh-76px)] flex items-center justify-center text-[#6c757d]">Utente non trovato nel database.</div>
        ) : (!isAdmin && !isClient && !isSupplier && !isWorker) ? (
          <div className="h-[calc(100vh-76px)] flex items-center justify-center text-center px-4">
            <div>
              <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Limitato</h2>
              <p className="text-[#adb5bd]">Prenota un appuntamento per sbloccare la chat con l'amministrazione.</p>
              <Link to="/MyAppointments" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Prenota Appuntamento
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-3 lg:py-4 xl:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6" style={{ height: 'calc(100vh - 100px)' }}>
                {/* Conversations List */}
                <div className="lg:col-span-1 bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-[#f8f9fa]/20 overflow-hidden flex flex-col max-h-full">
                  <div className="p-3 sm:p-4 lg:p-6 border-b border-[#f8f9fa]/10 flex flex-col gap-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg lg:text-xl font-medium text-[#f8f9fa]">Conversazioni</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setVerifyModalOpen(true)}
                          className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all text-[#adb5bd] hover:text-[#f8f9fa]"
                          title="Verifica Account"
                        >
                          <ShieldCheck size={20} />
                        </button>
                        <button
                          onClick={() => setShowContactsList(true)}
                          className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
                        >
                          <UserPlus size={20} className="text-[#f8f9fa]" />
                        </button>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex bg-[#212529]/50 p-1 rounded-lg">
                        <button
                          onClick={() => setConversationFilter('all')}
                          className={`flex-1 py-1.5 text-xs sm:text-sm rounded-md transition-all ${conversationFilter === 'all' ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-[#f8f9fa]'}`}
                        >
                          Tutti
                        </button>
                        <button
                          onClick={() => setConversationFilter('client')}
                          className={`flex-1 py-1.5 text-xs sm:text-sm rounded-md transition-all ${conversationFilter === 'client' ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-[#f8f9fa]'}`}
                        >
                          Clienti
                        </button>
                        <button
                          onClick={() => setConversationFilter('supplier')}
                          className={`flex-1 py-1.5 text-xs sm:text-sm rounded-md transition-all ${conversationFilter === 'supplier' ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-[#f8f9fa]'}`}
                        >
                          Fornitori
                        </button>
                        <button
                          onClick={() => setConversationFilter('collaborator')}
                          className={`flex-1 py-1.5 text-xs sm:text-sm rounded-md transition-all ${conversationFilter === 'collaborator' ? 'bg-[#495057] text-white shadow-sm' : 'text-[#adb5bd] hover:text-[#f8f9fa]'}`}
                        >
                          Collaboratori
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {conversations.length === 0 ? (
                      <div className="p-4 sm:p-6 text-center text-[#adb5bd]">
                        <MessageSquare size={32} className="mx-auto mb-2 sm:mb-4 opacity-50 sm:w-12 sm:h-12" />
                        <p className="text-sm sm:text-base">Nessuna conversazione</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <motion.div
                          key={conv._id}
                          whileHover={{ x: 4 }}
                          onClick={() => onSelectConversation(conv)}
                          className={`p-3 sm:p-4 border-b border-[#f8f9fa]/5 cursor-pointer transition-colors ${selectedConversation?._id === conv._id
                            ? 'bg-[#f8f9fa]/10'
                            : 'hover:bg-[#f8f9fa]/5'
                            }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm sm:text-base flex-shrink-0">
                              {conv.name?.[0] || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-[#f8f9fa] truncate text-sm sm:text-base">
                                {!isAdmin && conv?.is_admin_chat ? 'IWHome' : (conv?.name || 'Conversazione')}
                              </div>
                              <div className="text-xs sm:text-sm text-[#adb5bd] truncate">
                                {conv.last_message || 'Inizia una conversazione'}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-[#343a40]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-[#f8f9fa]/20 flex flex-col overflow-hidden max-h-full">
                  {!selectedConversation ? (
                    <div className="flex-1 flex items-center justify-center text-[#adb5bd] p-4">
                      <div className="text-center">
                        <MessageSquare size={40} className="mx-auto mb-2 sm:mb-4 opacity-50 sm:w-16 sm:h-16" />
                        <p className="text-sm sm:text-base lg:text-lg">Seleziona una conversazione</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-3 sm:p-4 lg:p-6 border-b border-[#f8f9fa]/10 flex-shrink-0 flex justify-between items-center">
                        <h3 className="text-base sm:text-lg lg:text-xl font-medium text-[#f8f9fa] truncate">
                          {selectedConversation.name || 'Conversazione'}
                        </h3>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleDeleteConversation}
                          >
                            <Trash2 size={20} />
                          </Button>
                        )}
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                        {messages.map((msg) => {
                          const isOwn = msg.sender_email === user?.primaryEmailAddress?.emailAddress;
                          const hasLiked = msg.likes?.includes(user?.primaryEmailAddress?.emailAddress);
                          const isSystemMsg = msg.message_type === 'system';

                          if (isSystemMsg) {
                            return (
                              <motion.div
                                key={msg._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-center my-4"
                              >
                                <div className="bg-[#495057]/50 border border-[#f8f9fa]/10 rounded-full px-4 py-2 text-xs text-[#adb5bd]">
                                  {msg.content}
                                </div>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.div
                              key={msg._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                                {msg.sender_email[0].toUpperCase()}
                              </div>
                              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                <div className={`rounded-2xl px-4 py-2 ${isOwn
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                  : 'bg-[#343a40] text-[#f8f9fa]'
                                  } ${msg.is_ephemeral ? 'opacity-75 border border-yellow-500/30' : ''} relative group`}>

                                  {isAdmin && !isSystemMsg && (
                                    <button
                                      onClick={() => handleDeleteMessage(msg._id)}
                                      className="absolute -top-2 -right-2 p-1 bg-[#212529] rounded-full border border-[#495057] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/20 z-10"
                                      title="Elimina messaggio"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}

                                  {msg.content && <p className="text-sm border-r pr-2 mr-2 border-white/10">{msg.content}</p>}

                                  {/* Poll Display */}
                                  {msg.poll_id && (
                                    <PollMessage
                                      pollId={msg.poll_id}
                                      userEmail={user?.primaryEmailAddress?.emailAddress}
                                      isAdmin={isAdmin}
                                      onViewPdf={setViewPdfUrl}
                                    />
                                  )}

                                  {msg.file_url && (
                                    <div className="mt-2">
                                      {msg.message_type === 'image' && (
                                        <img src={msg.file_url} alt="Image" className="rounded-lg max-w-full" />
                                      )}
                                      {msg.message_type === 'video' && (
                                        <video src={msg.file_url} controls className="rounded-lg max-w-full" />
                                      )}
                                      {msg.message_type === 'file' && (
                                        <div className="mt-2 p-3 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between gap-4 min-w-[200px] group/file">
                                          <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                              <FileText size={20} className="text-blue-400" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-white truncate">{msg.file_name}</p>
                                              <p className="text-[10px] text-white/50 uppercase tracking-wider">Documento PDF</p>
                                            </div>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-8 w-8 rounded-full hover:bg-blue-500/20 hover:text-blue-400 text-white/70"
                                              onClick={() => setViewPdfUrl(msg.file_url)}
                                              title="Visualizza"
                                            >
                                              <Eye size={16} />
                                            </Button>
                                            <a
                                              href={msg.file_url}
                                              target="_blank"
                                              download
                                              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-green-500/20 hover:text-green-400 text-white/70 transition-colors"
                                              title="Scarica"
                                            >
                                              <Paperclip size={16} />
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    onClick={() => handleLike(msg)}
                                    className={`flex items-center gap-1 text-xs ${hasLiked ? 'text-red-400' : 'text-[#adb5bd]'
                                      } hover:text-red-400 transition-colors`}
                                  >
                                    <ThumbsUp size={12} fill={hasLiked ? 'currentColor' : 'none'} />
                                    {msg.likes?.length > 0 && msg.likes.length}
                                  </button>
                                  {msg.is_ephemeral && (
                                    <span className="text-xs text-yellow-500" title="Messaggio effimero - sparirà dopo 7 giorni">
                                      ⏱️
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[#adb5bd] ml-auto">
                                    {new Date(msg._creationTime).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}, {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input Area - KEPT AS IS (but make sure it's closed properly in file) */}
                      <div className="p-2 sm:p-3 lg:p-4 border-t border-[#f8f9fa]/10 flex-shrink-0">
                        {/* ... (rest of input area seems fine in previous block, just careful with closing) ... */}
                        {isEphemeral && (
                          <div className="mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-500 flex items-center gap-2">
                            ⏱️ Messaggio effimero - sparirà dopo 7 giorni
                            <button
                              onClick={() => setIsEphemeral(false)}
                              className="ml-auto hover:text-yellow-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setShowAttachMenu(!showAttachMenu)}
                              className="text-[#dee2e6] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                            >
                              <Plus size={20} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="text-[#dee2e6] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                            >
                              <Smile size={20} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setIsEphemeral(!isEphemeral)}
                              className={`${isEphemeral ? 'text-yellow-500' : 'text-[#dee2e6]'} hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10`}
                              title="Messaggio effimero (7 giorni)"
                            >
                              <Clock size={20} />
                            </Button>
                          </div>

                          <div className="flex-1 relative">
                            <Input
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                              placeholder="Scrivi un messaggio..."
                              className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa] pr-12"
                            />

                            {/* Emoji Picker */}
                            <AnimatePresence>
                              {showEmojiPicker && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute bottom-full right-0 mb-2 bg-[#495057] border border-[#f8f9fa]/20 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-xl"
                                >
                                  {emojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        setMessageText(messageText + emoji);
                                        setShowEmojiPicker(false);
                                      }}
                                      className="text-2xl hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Attach Menu */}
                            <AnimatePresence>
                              {showAttachMenu && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute bottom-full left-0 mb-2 bg-[#495057] border border-[#f8f9fa]/20 rounded-xl overflow-hidden shadow-xl"
                                >
                                  {/* Buttons same as before */}
                                  <button
                                    onClick={() => {
                                      setUploadType('file');
                                      setUploadModalOpen(true);
                                      setShowAttachMenu(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                                  >
                                    <Paperclip size={18} />
                                    File
                                  </button>

                                  <button
                                    onClick={() => {
                                      setDocumentModalOpen(true);
                                      setShowAttachMenu(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                                  >
                                    <FileText size={18} />
                                    Collega Documento
                                  </button>

                                  {/* Poll Button - Only for Admin */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        setPollModalOpen(true);
                                        setShowAttachMenu(false);
                                      }}
                                      className="flex items-center gap-3 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 w-full transition-colors"
                                    >
                                      <BarChart size={18} />
                                      Crea Sondaggio
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <Button
                            onClick={handleSend}
                            disabled={!messageText.trim()}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          >
                            <Send size={18} />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Create Poll Modal */}
            {selectedConversation && (
              <CreatePollModal
                isOpen={pollModalOpen}
                onClose={() => setPollModalOpen(false)}
                conversationId={selectedConversation._id}
                clientEmail={selectedConversation.client_email || selectedConversation.members?.find(m => m !== user?.primaryEmailAddress?.emailAddress)}
              />
            )}

            {/* Document Selector Modal */}
            <DocumentSelectorModal
              isOpen={documentModalOpen}
              onClose={() => setDocumentModalOpen(false)}
              onSelect={async (doc) => {
                if (!user?.primaryEmailAddress?.emailAddress || !selectedConversation) return;

                const myEmail = user.primaryEmailAddress.emailAddress;
                const myName = user.fullName || myEmail;

                await sendMessageMutation({
                  channel_id: selectedConversation._id,
                  sender_email: myEmail,
                  sender_name: myName,
                  content: '', // Or maybe `Ho condiviso: ${doc.title}`
                  message_type: 'file',
                  file_url: doc.file_url,
                  file_name: doc.title,
                  is_admin_chat: selectedConversation.is_admin_chat 
                });

                setDocumentModalOpen(false);
                scrollToBottom();
              }}
            />

            {/* Contacts List Modal */}
            <AnimatePresence>
              {showContactsList && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                  onClick={() => setShowContactsList(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#343a40]/95 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-3xl p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-medium text-[#f8f9fa]">Seleziona Contatto</h3>
                      <button
                        onClick={() => setShowContactsList(false)}
                        className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
                      >
                        <X size={20} className="text-[#f8f9fa]" />
                      </button>
                    </div>

                    {/* Contact Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#adb5bd]" />
                      <Input
                        placeholder="Cerca contatto..."
                        value={contactSearchTerm}
                        onChange={(e) => setContactSearchTerm(e.target.value)}
                        className="pl-9 bg-[#212529] border-[#495057] text-[#f8f9fa] placeholder:text-[#6c757d]"
                      />
                    </div>

                    {!isAdmin ? (
                      <Button
                        className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          const adminUser = allUsers.find(u => u.role === 'admin' || u.role === 'superadmin');
                          if (adminUser) startNewConversation(adminUser.email);
                        }}
                      >
                        Scrivi a IWHome
                      </Button>
                    ) : (
                      <div className="flex flex-wrap gap-1 mb-4 bg-[#212529]/50 p-1 rounded-xl">
                        {['Tutti', 'Clienti', 'Fornitori', 'Collaboratori', 'Utenti Base', 'Admin'].map((tab) => (
                          <Button
                            key={tab}
                            variant="ghost"
                            size="sm"
                            onClick={() => setContactFilter(tab.toLowerCase().replace(' ', '_'))}
                            className={`flex-1 text-[10px] sm:text-xs rounded-lg transition-all ${contactFilter === tab.toLowerCase().replace(' ', '_')
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                              : 'text-[#adb5bd] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/5'
                              }`}
                          >
                            {tab}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      {!isSupplier && allUsers
                        .filter(u => u.email !== user?.primaryEmailAddress?.emailAddress) // Prevent self-chat
                        .filter(u => {
                          const tab = contactFilter;
                          const matchesSearch = (u.fullName?.toLowerCase() || '').includes(contactSearchTerm.toLowerCase()) ||
                            u.email.toLowerCase().includes(contactSearchTerm.toLowerCase());

                          if (!matchesSearch) return false;

                          const role = u.role?.toLowerCase();
                          if (tab === 'tutti') return true;
                          if (tab === 'admin') return role === 'admin' || role === 'superadmin';
                          if (tab === 'clienti') return role === 'client';
                          if (tab === 'fornitori') return role === 'supplier';
                          if (tab === 'collaboratori') return role === 'collaborator';
                          if (tab === 'utenti_base') return role === 'user' || !role;
                          return true;
                        })
                        .map((contact) => (
                          <button
                            key={contact._id}
                            onClick={() => startNewConversation(contact.email)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#495057]/50 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                              {contact.fullName?.[0] || contact.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#f8f9fa] truncate">
                                {contact.fullName || contact.email}
                              </div>
                              <div className="text-xs text-[#adb5bd] truncate">{contact.email}</div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Modal */}
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
              <DialogContent className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20 text-[#f8f9fa]">
                <DialogHeader>
                  <DialogTitle className="text-[#f8f9fa]">
                    Carica {uploadType === 'camera' ? 'dalla Camera' : uploadType === 'image' ? 'Foto' : uploadType === 'video' ? 'Video' : 'File'}
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : '*'}
                    capture={uploadType === 'camera' ? 'environment' : undefined}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFileUpload(file, uploadType === 'camera' ? 'image' : uploadType);
                      }
                    }}
                    className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] file:bg-[#f8f9fa]/10 file:text-[#f8f9fa]"
                  />
                </div>
              </DialogContent>
            </Dialog>
            {/* Verify Account Modal */}
            <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
              <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                <DialogHeader>
                  <DialogTitle>Verifica Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-[#adb5bd]">Inserisci il codice di accesso per verificare il tuo account o attivare le funzionalità aziendali.</p>
                  <Input
                    placeholder="Inserisci codice..."
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="bg-[#212529] border-[#495057] text-[#f8f9fa]"
                  />
                  <Button
                    onClick={handleVerifyAccount}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Verifica Codice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

function DocumentSelectorModal({ isOpen, onClose, onSelect }) {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch documents - using getAll for admins to see everything, or get for users
  // We'll use a safe approach: list documents accessible to the user
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const convexUser = useQuery(api.users.getByEmail, { email: userEmail });
  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';

  // If admin, getAll. If user, getSharedWith or get (own).
  // For simplicity, let's use listResources methodology or just 'documents.get' (own) + 'documents.getSharedWith'?
  // Let's use `api.documents.get` (Own) for now, as usually you link YOUR documents.
  // Or `api.documents.getAll` if admin to link any doc.
  const ownDocs = useQuery(api.documents.get) || [];
  const allDocs = useQuery(api.documents.getAll) || [];

  const documents = isAdmin ? allDocs : ownDocs;

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            Seleziona Documento
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#adb5bd]" />
          <Input
            placeholder="Cerca documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#212529] border-[#495057] text-[#f8f9fa]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredDocs.length === 0 ? (
            <p className="text-center text-[#adb5bd] py-8">Nessun documento trovato</p>
          ) : (
            filteredDocs.map(doc => (
              <button
                key={doc._id}
                onClick={() => onSelect(doc)}
                className="w-full text-left p-3 rounded-xl bg-[#495057]/30 hover:bg-[#495057]/70 border border-[#f8f9fa]/5 hover:border-[#f8f9fa]/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-[#f8f9fa] truncate">{doc.title}</span>
                  <span className="text-[10px] text-[#adb5bd] bg-[#212529] px-1.5 py-0.5 rounded uppercase">{doc.file_type?.split('/')[1] || 'FILE'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#adb5bd]">
                  <span className="truncate max-w-[70%] opacity-70 group-hover:opacity-100">{doc.file_name}</span>
                  <span>{new Date(doc.created_date).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}