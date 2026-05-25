import React, { useState, useEffect } from 'react';
import { validateFiles } from '../lib/security';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import useRBAC from '../hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  FileText,
  Calendar,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  MessageSquare,
  Upload,
  Monitor,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  Bell,
  ArrowRight,
  UserPlus,
  Plus,
  Hammer,
  Trash2,
  Link2,
  Loader2,
  Truck,
  Package,
  MapPin,
  CreditCard,
  Send,
  X,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';

import OnboardingModal from '../components/dashboard/OnboardingModal';
import WelcomeModal from '../components/dashboard/WelcomeModal';

import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { convertToWebP } from '../utils/imageConverter';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [revenueDays, setRevenueDays] = useState(30);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeDevices, setActiveDevices] = useState(1);

  // PDF Viewer State
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  // Quote Request State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestFiles, setRequestFiles] = useState([]);
  const [requestData, setRequestData] = useState({
    title: '',
    notes: '',
    quote_type: 'infissi'
  });

  // Convex Queries
  const allQuotes = useQuery(api.quotes.get) || [];
  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });

  // Auto-link supplier: if this user's email matches an active supplier record but role is still "client",
  // syncSupplierRole will upgrade them automatically so they can access the supplier area.
  const syncSupplierRole = useMutation(api.suppliers.syncSupplierRole);
  useEffect(() => {
    const role = convexUser?.role;
    if (role && role !== 'supplier' && role !== 'admin' && role !== 'superadmin') {
      syncSupplierRole().catch(() => {});
    }
  }, [convexUser?.role]);

  // Mutations
  const logWorkHours = useMutation(api.collaborators.logHours);

  // Form State for Daily Log
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cantiere_id: '',
    hours: '',
    description: ''
  });
  const [logSubmitting, setLogSubmitting] = useState(false);

  const handleLogSubmit = async () => {
    if (!myCollaborator?._id || !logForm.hours || !logForm.cantiere_id) {
       // Ideally show a toast here
       return;
    }
    setLogSubmitting(true);
    try {
      await logWorkHours({
        collaborator_id: myCollaborator._id,
        // @ts-ignore
        cantiere_id: logForm.cantiere_id,
        date: logForm.date,
        hours_worked: parseFloat(logForm.hours),
        description: logForm.description
      });
      setLogForm({
        ...logForm,
        hours: '',
        description: ''
      });
      // Success toast would go here
    } catch (error) {
      console.error("Error logging hours:", error);
    } finally {
      setLogSubmitting(false);
    }
  };

  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';
  const isClient = convexUser?.role === 'client';
  const isSupplier = convexUser?.role === 'supplier';
  const isWorker = ['collaborator', 'collaborator_internal', 'collaborator_external', 'worker', 'operaio'].includes(convexUser?.role);
  const isUser = !isAdmin && !isClient && !isSupplier && !isWorker;

  // RBAC: Get linked records
  const { supplierRecord, supplierId } = useRBAC();
  const myCollaborator = useQuery(
    api.collaborators.getByEmail, 
    isWorker ? { email: user?.primaryEmailAddress?.emailAddress || "" } : "skip"
  );
  
  // Tasks for worker
  const myTasks = useQuery(
    api.adminStats.getStaffTasks, 
    isWorker ? { email: user?.primaryEmailAddress?.emailAddress || "" } : "skip"
  ) || [];

  // Hours for worker
  const myHours = useQuery(
    api.collaborators.listHours,
    isWorker && myCollaborator ? { collaborator_id: myCollaborator._id } : "skip"
  ) || [];

  // Cantieri assegnati al collaboratore (per dropdown log giornaliero)
  const myWorkerCantieri = useQuery(
    api.cantieri.getByWorker,
    isWorker ? {} : "skip"
  ) || [];

  // Admin-only comprehensive stats
  const adminStats = useQuery(api.adminStats.getAdminStats) || null;
  const recentActivity = useQuery(api.adminStats.getRecentActivity, { limit: 8 }) || [];
  const cantieriProgress = useQuery(api.adminStats.getCantieriProgress) || [];
  // TODO: Re-enable once Convex regenerates: const revenueTrend = useQuery(api.adminStats.getRevenueTrend, isAdmin ? { days: revenueDays } : "skip") || [];
  const revenueTrend = [];
  // Admin quote source: getAll returns ALL client quotes (admin-only endpoint).
  // quotes.get only returns quotes matching the logged-in user's email â€” useless for admin.
  const adminAllQuotes = useQuery(api.quotes.getAll, isAdmin ? {} : "skip") || [];

  // Task 2-3: Supplier operational data for Dashboard
  const dashboardSuppliers = useQuery(api.suppliers.list) || [];
  const dashboardOrders = useQuery(api.suppliers.listOrders, {}) || [];
  const dashboardDeliveries = useQuery(api.suppliers.listDeliveries, {}) || [];
  const paymentStats = useQuery(api.payments.getStats) || null;

  // Supplier self-view queries â€” when supplierId is null the backend falls back to
  // email-based lookup so we pass {} instead of "skip" to ensure data always loads.
  const mySupplierRequests = useQuery(
    api.suppliers.listRequests,
    isSupplier ? (supplierId ? { supplier_id: supplierId } : {}) : "skip"
  ) || [];
  const mySupplierOrders = useQuery(
    api.suppliers.listOrders,
    isSupplier ? (supplierId ? { supplier_id: supplierId } : {}) : "skip"
  ) || [];
  const mySupplierDeliveries = useQuery(
    api.suppliers.listDeliveries,
    isSupplier ? (supplierId ? { supplier_id: supplierId } : {}) : "skip"
  ) || [];
  const mySupplierPayments = useQuery(
    api.payments.list,
    isSupplier ? { type: 'supplier' } : "skip"
  ) || [];

  // Conditionally fetch data based on role
  const myAppointments = useQuery(api.appointments.get) || [];
  const allAppointments = useQuery(api.appointments.getAll) || [];

  // Filter out pending appointments if any still exist, or treat them as confirmed
  const appointmentsSource = isAdmin ? allAppointments : myAppointments;
  const appointments = appointmentsSource; // Show all appointments including legacy pending

  // Documents
  const myDocs = useQuery(api.documents.get) || [];
  const allDocs = useQuery(api.documents.getAll) || [];
  const documents = isAdmin ? allDocs : myDocs;

  // Mutations
  const updateQuoteStatusMutation = useMutation(api.quotes.updateStatus);
  const uploadPaymentProofMutation = useMutation(api.payments.uploadPaymentProof);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateAppointmentStatus = useMutation(api.appointments.updateStatus);
  const respondToQuoteMutation = useMutation(api.quotes.respondToQuote);

  // Client quote accept/reject state
  const [quoteToRespond, setQuoteToRespond] = useState(null);
  const [respondAction, setRespondAction] = useState(null); // 'accepted' | 'rejected'
  const [isRespondingQuote, setIsRespondingQuote] = useState(false);

  const handleRespondToQuote = async () => {
    if (!quoteToRespond || !respondAction) return;
    setIsRespondingQuote(true);
    try {
      await respondToQuoteMutation({ quote_id: quoteToRespond._id, response: respondAction });
      setQuoteToRespond(null);
      setRespondAction(null);
    } catch (err) {
      alert(t('common.error') + ': ' + (err.message || err));
    } finally {
      setIsRespondingQuote(false);
    }
  };

  const clientPayments = useQuery(
    api.payments.list,
    isClient ? { type: 'client' } : "skip"
  ) || [];

  const clientOrders = useQuery(
    api.suppliers.listClientOrders,
    isClient ? { client_email: user?.primaryEmailAddress?.emailAddress || "" } : "skip"
  ) || [];

  const clientCantieri = useQuery(
    api.cantieri.getByClient,
    isClient ? {} : "skip"
  ) || [];

  // Queries for stats
  const myConversations = useQuery(api.conversations.listClientConversations, { client_email: user?.primaryEmailAddress?.emailAddress || "" });
  const adminConversations = useQuery(api.conversations.listAdminConversations);

  // Determine conversations based on role
  const conversations = isAdmin ? (adminConversations || []) : (myConversations || []);

  useEffect(() => {
    const cleanup = trackDevice();
    return cleanup;
  }, []);



  const trackDevice = () => {
    const deviceId = localStorage.getItem('device_id') || `device_${Date.now()}_${Math.random()}`;
    localStorage.setItem('device_id', deviceId);
    localStorage.setItem('last_active', Date.now().toString());

    const id = setInterval(() => {
      localStorage.setItem('last_active', Date.now().toString());
      const allDevices = Object.keys(localStorage)
        .filter(key => key.startsWith('device_') && key !== 'device_id')
        .map(key => parseInt(localStorage.getItem(key)))
        .filter(time => Date.now() - time < 60000);
      setActiveDevices(allDevices.length + 1);
    }, 10000);
    return () => clearInterval(id);
  };

  // Filter Logic â€” admin uses getAll (all client quotes), others use their own
  const quotesSource = isAdmin ? adminAllQuotes : allQuotes;
  const quotes = quotesSource.filter(q => {
    let match = true;
    if (statusFilter !== 'all' && q.status !== statusFilter) match = false;
    if (typeFilter !== 'all' && q.quote_type !== typeFilter) match = false;

    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (!q.created_date || !q.created_date.startsWith(today)) match = false;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      if (!q.created_date || q.created_date < weekAgo) match = false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        q.full_name?.toLowerCase().includes(search) ||
        q.email?.toLowerCase().includes(search) ||
        // q.id.toLowerCase().includes(search); // ID might be different in Convex
        false;
      if (!matchesSearch) match = false;
    }

    return match;
  });

  const preventivi = documents.filter(doc => doc.category === 'preventivo');

  const updateQuoteStatus = async (quoteId, newStatus) => {
    await updateQuoteStatusMutation({ id: quoteId, status: newStatus });
  };

  const createRequestMutation = useMutation(api.quotes.createRequest);

  const handleCreateRequest = async () => {
    if (!requestData.title) {
      alert(t('common.please_enter_title'));
      return;
    }
    setRequestLoading(true);
    try {
      const storageIds = [];

      // 1. Process and upload files
      for (const file of requestFiles) {
        let fileToUpload = file;

        // Convert to WebP if image
        if (file.type.startsWith('image/') && (file.type === 'image/jpeg' || file.type === 'image/png')) {
          try {
            const webpBlob = await convertToWebP(file);
            fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
          } catch (err) {
            console.error("WebP conversion failed, uploading original:", err);
          }
        }

        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload,
        });
        if (!result.ok) throw new Error("File upload failed");
        const { storageId } = await result.json();
        storageIds.push(storageId);
      }

      // 2. Create Request
      await createRequestMutation({
        title: requestData.title,
        full_name: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Cliente",
        email: user?.primaryEmailAddress?.emailAddress || "",
        phone: String(user?.unsafeMetadata?.phone || ""),
        notes: requestData.notes,
        quote_type: requestData.quote_type,
        files: storageIds
      });

      alert(t('common.request_sent_success'));
      setIsRequestModalOpen(false);
      setRequestData({ title: '', notes: '', quote_type: 'infissi' });
      setRequestFiles([]);
    } catch (err) {
      console.error("Error creating request:", err);
      alert(t('common.error_sending_request'));
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUploadPaymentProof = async (paymentId, file) => {
    if (!file) return;
    try {
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await uploadPaymentProofMutation({ payment_id: paymentId, storage_id: storageId });
      alert(t('common.payment_proof_uploaded'));
    } catch (error) {
      console.error("Error uploading proof:", error);
      alert(t('common.error_uploading_proof'));
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      quote.full_name?.toLowerCase().includes(search) ||
      quote.email?.toLowerCase().includes(search) ||
      quote._id.toLowerCase().includes(search)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent': return <CheckCircle className="w-4 h-4 text-[#FFC703]" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const stats = {
    totalQuotes: quotes.length,
    pendingQuotes: quotes.filter(q => q.status === 'draft' || q.status === 'sent').length,
    totalAppointments: appointments.length,
    // pendingAppointments removed
    totalDocuments: documents.length,
    totalPreventivi: preventivi.length,
    totalMessages: conversations.length
  };





  return (
    <div className="min-h-screen relative overflow-hidden 2xl:text-base" style={{ background: 'linear-gradient(135deg, #1C1A18 0%, #232323 60%, #2a2826 100%)' }}>


      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      {showWelcome && user && (
        <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />
      )}

      {/* PDF Viewer for Documents */}
      {/* Universal PDF Viewer */}
      <UniversalPdfViewer
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
        url={pdfUrl}
        title={pdfTitle}
      />

      {/* Quote Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="bg-[#1C1A18] border-white/8 text-white w-full max-w-lg mx-2 sm:mx-4 scrollbar-hide overflow-y-auto max-h-[90vh]">
          <DialogHeader>
<DialogTitle>{t('common.new_quote_request')}</DialogTitle>
            <DialogDescription className="text-white/40">
              {t('common.send_photos_details')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t('common.request_subject')}</Label>
              <Input
                id="title"
                placeholder={t('common.placeholder_request_subject')}
                value={requestData.title}
                onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                className="bg-[#141210] border-white/10 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">{t('common.work_type')}</Label>
              <Select
                value={requestData.quote_type}
                onValueChange={(val) => setRequestData({ ...requestData, quote_type: val })}
              >
                <SelectTrigger className="bg-[#141210] border-white/10">
                  <SelectValue placeholder={t('common.select_type')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1A18] border-white/10">
                  <SelectItem value="infissi">{t('common.windows_doors')}</SelectItem>
                  <SelectItem value="porte">{t('common.interior_security_doors')}</SelectItem>
                  <SelectItem value="ristrutturazione">{t('common.renovation')}</SelectItem>
                  <SelectItem value="altro">{t('common.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t('common.detailed_description')}</Label>
              <Textarea
                id="notes"
                placeholder={t('common.describe_need')}
                rows={4}
                value={requestData.notes}
                onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                className="bg-[#141210] border-white/10 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('common.attachments')}</Label>
              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#FFC703]/40 transition-all cursor-pointer bg-black/10"
                onClick={() => document.getElementById('request-files').click()}
              >
                <Upload size={24} className="mx-auto mb-2 text-white/40" />
                <p className="text-sm text-white/40">{t('common.drag_files')}</p>
                <p className="text-[10px] text-white/30 mt-1">{t('common.autoconvert_jpg')}</p>
              </div>
              <Input
                id="request-files"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files);
                  const err = validateFiles(newFiles, 'any');
                  if (err) { alert(err); e.target.value = ''; return; }
                  setRequestFiles([...requestFiles, ...newFiles]);
                }}
              />

              {requestFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requestFiles.map((file, idx) => (
                    <div key={idx} className="bg-[#FFC703]/15 text-[#FFC703] text-[10px] px-2 py-1 rounded-md flex items-center gap-2 border border-[#FFC703]/30">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <X size={12} className="cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        setRequestFiles(requestFiles.filter((_, i) => i !== idx));
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4">
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setIsRequestModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreateRequest}
              className="w-full sm:w-auto font-semibold text-[#1C1A18]"
              style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}
              disabled={requestLoading}
            >
              {requestLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
              {t('common.send_request')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      <div className="pt-0 relative z-10 min-h-screen pb-safe px-0">
        {isWorker ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1C1A18]/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC703]/20 rounded-full -translate-y-32 translate-x-32" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-[#FFC703]/20 text-[#FFC703] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#FFC703]/30">
                    {t('common.staff_area')}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
                  {t('common.hello')}, <span className="font-bold">{myCollaborator?.full_name?.split(' ')[0] || user?.firstName}</span>!
                </h1>
                <p className="text-white/70 mt-2 text-lg">
                  {t('common.you_have')} <span className="text-[#FFC703] font-bold">{myTasks.filter(t => t.status !== 'completato').length} {t('common.tasks')}</span> {t('common.to_complete_today')}
                </p>
                <div className="flex gap-4 mt-6">
                   <Link to={createPageUrl('Projects')} className="px-4 py-2 bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#FFC703]/20 border border-[#FFC703]/30">
                     {t('common.view_my_projects')}
                   </Link>
                   <Link to={createPageUrl('Messages')} className="px-4 py-2 bg-white/8 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-md border border-white/10">
                     {t('common.contact_support')}
                   </Link>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#141210]/50 p-4 rounded-2xl border border-white/8 relative z-10 shadow-inner backdrop-blur-md">
                <div className="p-3 bg-[#FFC703]/20 rounded-xl shadow-sm border border-[#FFC703]/30">
                  <Monitor className="w-6 h-6 text-[#FFC703]" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-tighter">{t('common.id_access_code')}</p>
                  <p className="font-mono text-xl font-bold text-white flex items-center gap-2">
                    {myCollaborator?._id.toString().substring(0, 8).toUpperCase() || '---'}
                    <span className="text-white/40 text-sm font-normal">|</span>
                    <span className="text-[#FFC703] tracking-widest">{myCollaborator?.temporary_password || '******'}</span>
                  </p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to={createPageUrl('Projects')}>
                <Card className="bg-[#1C1A18]/60 backdrop-blur-xl border border-white/8 shadow-lg rounded-3xl p-6 relative overflow-hidden group hover:bg-[#1C1A18]/80 transition-all duration-300 h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 text-[#FFC703]">
                    <Building2 size={80} />
                  </div>
                  <p className="text-white/40 text-sm font-semibold mb-1">My Projects</p>
                  <h2 className="text-4xl font-black text-white leading-none">
                    {myCollaborator?.assigned_cantieri?.length || 0}
                  </h2>
                  <div className="mt-4 flex items-center gap-2 text-[#FFC703] font-bold text-xs group-hover:gap-3 transition-all">
                    Manage projects <ArrowRight size={14} />
                  </div>
                </Card>
              </Link>

              <Link to={createPageUrl('DailyLogs')}>
                <Card className="bg-[#1C1A18]/60 backdrop-blur-xl border border-white/8 shadow-lg rounded-3xl p-6 relative overflow-hidden group hover:bg-[#1C1A18]/80 transition-all duration-300 h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 text-[#FFC703]/70">
                    <Activity size={80} />
                  </div>
                  <p className="text-white/40 text-sm font-semibold mb-1">Weekly Hours</p>
                  <h2 className="text-4xl font-black text-white leading-none">
                    {myHours.filter(h => {
                      const date = new Date(h.date);
                      const now = new Date();
                      return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
                    }).reduce((acc, curr) => acc + curr.hours_worked, 0)}h
                  </h2>
                  <div className="mt-4 flex items-center gap-2 text-[#FFC703]/70 font-bold text-xs group-hover:gap-3 transition-all">
                    Time log <ArrowRight size={14} />
                  </div>
                </Card>
              </Link>

              <Link to={createPageUrl('Payments')}>
                <Card className="bg-[#FFC703]/20 backdrop-blur-xl border border-[#FFC703]/30 shadow-lg rounded-3xl p-6 relative overflow-hidden group hover:bg-[#FFC703]/20 transition-all duration-300 h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500 text-white">
                    <DollarSign size={80} />
                  </div>
                  <p className="text-[#FFC703] text-sm font-semibold mb-1">Payments</p>
                  <h2 className="text-4xl font-black text-white leading-none">
                    â‚¬ {myCollaborator?.salary || '---'}
                  </h2>
                  <div className="mt-4 flex items-center justify-between text-white font-bold text-xs transition-all">
                    <span>
                      {myCollaborator?.payment_frequency ? `Frequency: ${myCollaborator.payment_frequency.replace('_', ' ')}` : 'View compensation details'}
                    </span>
                    <div className="flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-[#1C1A18]/60 backdrop-blur-xl border border-white/8 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-white/8 flex flex-row items-center justify-between pb-6 p-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#FFC703]/20 rounded-2xl border border-[#FFC703]/30">
                      <Plus className="w-6 h-6 text-[#FFC703]" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Daily Log</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/40 font-bold uppercase text-[10px]">Date</Label>
                      <Input 
                        type="date" 
                        value={logForm.date}
                        onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                        className="rounded-xl bg-[#141210] border-white/10 text-white h-12" 
                      />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-white/40 font-bold uppercase text-[10px]">Project</Label>
                       <Select value={logForm.cantiere_id} onValueChange={(val) => setLogForm({...logForm, cantiere_id: val})}>
                        <SelectTrigger className="rounded-xl bg-[#141210] border-white/10 text-white h-12">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1A18] border-white/10 text-white rounded-xl shadow-2xl">
                          {myWorkerCantieri.length === 0 ? (
                            <SelectItem value="_none" disabled>No projects assigned</SelectItem>
                          ) : myWorkerCantieri.map(c => (
                            <SelectItem key={c._id} value={c._id}>{c.nome_cantiere}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/40 font-bold uppercase text-[10px]">Hours Worked</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        step="0.5" 
                        value={logForm.hours}
                        onChange={(e) => setLogForm({...logForm, hours: e.target.value})}
                        className="rounded-xl bg-[#141210] border-white/10 text-white pl-12 h-14 text-lg font-bold" 
                        placeholder="0.0" 
                      />
                      <Clock className="absolute left-4 top-4 text-[#FFC703]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/40 font-bold uppercase text-[10px]">Description</Label>
                    <Textarea 
                      value={logForm.description}
                      onChange={(e) => setLogForm({...logForm, description: e.target.value})}
                      className="rounded-xl bg-[#141210] border-white/10 text-white min-h-[120px] placeholder:text-white/30" 
                      placeholder="Details of work completed..." 
                    />
                  </div>
                  <Button 
                    onClick={handleLogSubmit}
                    disabled={logSubmitting || !logForm.hours || !logForm.cantiere_id}
                    className="w-full bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold h-14 rounded-2xl text-lg font-bold shadow-lg shadow-[#FFC703]/20 transition-all border border-[#FFC703]/30"
                  >
                    {logSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Log"}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-8">
                 <Card className="bg-[#1C1A18]/60 backdrop-blur-xl border border-white/8 shadow-xl rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">My Tasks</h3>
                      <Link to={createPageUrl('/Tasks')} className="text-xs font-bold text-[#FFC703] hover:text-[#FFC703] transition-colors">View all</Link>
                    </div>
                    <div className="space-y-4">
                      {myTasks.length > 0 ? myTasks.slice(0, 4).map(t => (
                        <div key={t._id} className="p-4 bg-[#141210]/50 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-[#141210]/80 transition-all cursor-pointer group">
                          <div className={`p-2 rounded-xl bg-[#1C1A18] shadow-sm border border-white/5 ${t.status === 'completato' ? 'text-[#FFC703]/70' : 'text-amber-400'}`}>
                            {t.status === 'completato' ? <CheckCircle size={20} /> : <Clock size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{t.title}</p>
                            <p className="text-[10px] text-white/40 uppercase font-black">{t.priority}</p>
                          </div>
                          <ArrowRight className="ml-auto text-white/30 group-hover:text-[#FFC703] group-hover:translate-x-1 transition-all" size={16} />
                        </div>
                      )) : (
                        <p className="text-center text-white/40 py-10 italic">No tasks assigned.</p>
                      )}
                    </div>
                 </Card>

                 <Card className="bg-[#FFC703]/20 backdrop-blur-xl border border-[#FFC703]/30 shadow-xl rounded-2xl p-8 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                     <MessageSquare size={120} />
                   </div>
                   <h3 className="text-2xl font-bold mb-4 relative z-10 text-white">Direct Chat</h3>
                   <p className="text-white/70 text-sm mb-8 relative z-10 leading-relaxed">
                     Need supplies or clarifications? Message the admin team directly.
                   </p>
                   <Link to={createPageUrl('/Messages')}>
                    <Button className="w-full bg-[#F0EBE8] text-[#1C1A18] hover:bg-white h-14 rounded-2xl font-bold text-lg relative z-10 shadow-lg shadow-[#FFC703]/20">
                      Open Messages
                    </Button>
                   </Link>
                 </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-white mb-1">
                  Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-white/70">
                  Welcome, {user?.fullName || 'User'}
                  <span className="ml-2 text-xs bg-white/8 px-2 py-0.5 rounded-full text-white/40">
                    {isAdmin ? 'Admin' : isClient ? 'Client' : isSupplier ? 'Supplier' : isWorker ? 'Staff' : 'User'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-[#1C1A18]/50 border-white/10 text-white hover:bg-[#1C1A18] hover:text-white transition-all">
                      <Filter size={16} className="mr-2 text-[#FFC703]" /> Customise
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1C1A18] border-white/8 text-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Dashboard Widgets</DialogTitle>
                      <DialogDescription className="text-white/40">Choose which widgets to show on your dashboard.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      {[
                        { id: 'clients', label: 'Active Clients' },
                        { id: 'cantieri', label: 'Projects' },
                        { id: 'revenue', label: 'Revenue' },
                        { id: 'today', label: "Today's Appointments" },
                        { id: 'messages', label: 'Unread Messages' },
                        { id: 'quotes', label: 'Pending Quotes' },
                        { id: 'kanban', label: 'Project Status (Kanban)' },
                        { id: 'activity', label: 'Recent Activity' }
                      ].map((widget) => {
                        const isHidden = (localStorage.getItem('admin_hidden_widgets') || '').includes(widget.id);
                        return (
                          <div key={widget.id} className="flex items-center space-x-2">
                            {/* ... Checkbox logic is same as before, simplified for brevity in this chunk if possible, or just copy it ... */}
                            <Checkbox
                              id={widget.id}
                              checked={!isHidden}
                              onCheckedChange={(checked) => {
                                let hidden = (localStorage.getItem('admin_hidden_widgets') || '').split(',').filter(Boolean);
                                if (!checked) {
                                  hidden.push(widget.id);
                                } else {
                                  hidden = hidden.filter(id => id !== widget.id);
                                }
                                localStorage.setItem('admin_hidden_widgets', hidden.join(','));
                                window.location.reload();
                              }}
                            />
                            <label htmlFor={widget.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                              {widget.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeDevices > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#FFC703]/20 border border-[#FFC703]/30 rounded-lg"
                >
                  <Monitor size={14} className="text-[#FFC703]" />
                  <span className="text-xs text-[#FFC703]">
                    {activeDevices} active
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats - Conditional Rendering */}
          {/* Stats - Conditional Rendering - Generic Row HIDDEN for Admin/Supplier to reduce clutter */}
          {!isAdmin && !isSupplier && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
              {/* Everyone sees Appointments */}
              <Link to={createPageUrl('Appointments')} className="block h-full">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
                  <Card className="bg-gradient-to-br from-[#1C1A18] to-[#141210] border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                      <CardTitle className="text-xs font-medium text-white/80">Appointments</CardTitle>
                      <Calendar className="h-4 w-4 text-white flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-light text-white">{stats.totalAppointments}</div>
                      <p className="text-xs text-white/60 mt-0.5 hidden sm:block">Scheduled</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>

              {/* Everyone sees Documents */}
              <Link to={createPageUrl('Documents')} className="block h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Card className="bg-gradient-to-br from-[#FFC703] to-[#FFC703] border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                      <CardTitle className="text-xs font-medium text-white/80">My Documents</CardTitle>
                      <Upload className="h-4 w-4 text-white flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-light text-white">{stats.totalDocuments}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>

              {/* Client see Messages & Request */}
              {isClient && (
                <>
                  <Link to={createPageUrl('Messages')} className="block h-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <Card className="bg-gradient-to-br from-[#535252] to-[#1C1A18] border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                          <CardTitle className="text-xs font-medium text-white/80">Messages</CardTitle>
                          <MessageSquare className="h-4 w-4 text-white flex-shrink-0" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-light text-white">{stats.totalMessages}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>

                  <div className="block h-full" onClick={() => setIsRequestModalOpen(true)}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <Card className="bg-gradient-to-br from-[#FFC703] to-[#FFC703] border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full border-2 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                          <CardTitle className="text-xs font-medium text-white/80">Request a Quote</CardTitle>
                          <Plus className="h-4 w-4 text-white flex-shrink-0" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-lg font-light text-white">{t('common.new_photo_request')}</div>
                          <p className="text-[10px] text-white/60">Contact the technical team</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* â•â•â• SUPPLIER PRIVATE AREA â•â•â• */}
          {isSupplier && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 lg:mb-8"
            >
              {/* Supplier Welcome Card */}
              <Card className="bg-gradient-to-br from-[#FFC703]/15 via-[#1C1A18]/20 to-[#141210]/25 border border-[#FFC703]/30 mb-6 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 rounded-full bg-[#FFC703]/15 flex items-center justify-center border border-[#FFC703]/25">
                          <Truck className="text-[#FFC703]/80" size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white leading-tight">
                            {supplierRecord?.name || convexUser?.fullName || "Supplier Area"}
                          </h2>
                          <p className="text-xs text-[#F0EBE8]/50">Certified Kranely Supplier</p>
                        </div>
                      </div>
                      {supplierRecord?.type && (
                        <span className="text-xs bg-[#FFC703]/10 text-[#FFC703]/70 px-2 py-0.5 rounded border border-[#FFC703]/20">
                          {supplierRecord.type}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {supplierRecord?.supplier_code && (
                        <span className="text-xs bg-[#FFC703]/15 text-[#FFC703]/80 px-2 py-1 rounded-md font-mono border border-[#FFC703]/25">
                          {supplierRecord.supplier_code}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-[#FFC703]/80">Connected</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Link to={createPageUrl('Suppliers')}>
                  <Button size="sm" className="bg-[#FFC703]/80 hover:bg-[#FFC703]/70 text-[#1C1A18] text-white border-0">
                    <FileText className="h-4 w-4 mr-1" /> My Orders
                  </Button>
                </Link>
                <Link to={createPageUrl('Payments')}>
                  <Button size="sm" className="bg-[#FFC703]/80 hover:bg-[#FFC703]/70 text-white border-0">
                    <DollarSign className="h-4 w-4 mr-1" /> Payments
                  </Button>
                </Link>
                <Link to={createPageUrl('Documents')}>
                  <Button size="sm" className="bg-white/10 hover:bg-white/15 text-white border-0">
                    <Upload className="h-4 w-4 mr-1" /> Documents
                  </Button>
                </Link>
              </div>

              {/* Supplier KPI Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <Link to={createPageUrl('Suppliers')}>
                  <Card className="bg-gradient-to-br from-[#FFC703]/60 to-[#FFC703]/50 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full shadow-lg shadow-orange-900/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <FileText className="h-5 w-5 text-white/80" />
                        <span className="text-2xl font-light text-white">{mySupplierRequests.filter(r => r.status === 'sent').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">{t('common.new_requests')}</p>
                      {mySupplierRequests.filter(r => r.status === 'sent').length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse mt-1" />
                      )}
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Suppliers')}>
                  <Card className="bg-gradient-to-br from-[#FFC703]/80 to-[#FFC703]/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full shadow-lg shadow-[#FFC703]/20">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Truck className="h-5 w-5 text-white/80" />
                        <span className="text-2xl font-light text-white">{mySupplierOrders.filter(o => o.status === 'confirmed' || o.status === 'in_production').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Active Orders</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Payments')}>
                  <Card className="bg-gradient-to-br from-[#1C1A18]/80 to-[#141210]/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <DollarSign className="h-5 w-5 text-white/80" />
                        <span className="text-2xl font-light text-white">{mySupplierPayments.filter(p => p.status === 'pagato').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Payments Received</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Payments')}>
                  <Card className="bg-gradient-to-br from-amber-600/80 to-amber-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full shadow-lg shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Clock className="h-5 w-5 text-white/80" />
                        <span className="text-2xl font-light text-white">{mySupplierPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Pending Payments</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Two-Column: Orders + Deliveries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* My Active Orders */}
                <Card className="bg-[#1C1A18]/50 backdrop-blur-xl border-white/8">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                        <FileText className="h-4 w-4" /> My Orders
                      </CardTitle>
                      <Link to={createPageUrl('Suppliers')} className="text-xs text-[#FFC703]/80 hover:underline flex items-center gap-1">
                        View all <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {mySupplierOrders.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-6">No orders</p>
                      ) : mySupplierOrders.slice(0, 5).map(order => (
                        <div key={order._id} className="bg-[#535252]/30 rounded-lg p-2.5 border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white font-medium truncate max-w-[180px]">{order.order_number || 'Order'}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'completed' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                              order.status === 'in_production' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                'bg-[#FFC703]/20 text-[#FFC703] border border-[#FFC703]/30'
                              }`}>{order.status?.replace('_', ' ')}</span>
                          </div>
                          {order.workflow_step !== undefined && (
                            <div className="flex gap-0.5 mt-1">
                              {Array.from({ length: 9 }, (_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${i < order.workflow_step ? 'bg-green-500' :
                                  i === order.workflow_step ? 'bg-orange-400' : 'bg-[#535252]'
                                  }`} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* My Deliveries */}
                <Card className="bg-[#1C1A18]/50 backdrop-blur-xl border-white/8">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Upcoming Deliveries
                      </CardTitle>
                      <Link to={createPageUrl('Suppliers')} className="text-xs text-[#FFC703]/80 hover:underline flex items-center gap-1">
                        Calendar <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {mySupplierDeliveries.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-6">No scheduled deliveries</p>
                      ) : mySupplierDeliveries.filter(d => d.status !== 'consegnato').slice(0, 5).map(delivery => {
                        const displayDate = delivery.confirmed_arrival || delivery.estimated_arrival;
                        return (
                          <div key={delivery._id} className="bg-[#535252]/30 rounded-lg p-2.5 border border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white font-medium">
                                {delivery.tracking_number || 'Delivery'}
                              </span>
                              {displayDate && (
                                <span className="text-[10px] text-white/40 flex items-center gap-1">
                                  <Calendar size={10} /> {new Date(displayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded ${delivery.confirmed_arrival ? 'bg-[#FFC703]/20 text-[#FFC703]' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                              {delivery.confirmed_arrival ? 'Confirmed' : 'Estimated'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* New Requests â€” pending requests list */}
              {mySupplierRequests.filter(r => r.status === 'sent').length > 0 && (
                <Card className="bg-[#1C1A18]/50 backdrop-blur-xl border-[#FFC703]/20 mt-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-[#FFC703] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#FFC703] animate-pulse" />
                        New Pending Requests
                      </CardTitle>
                      <Link to={createPageUrl('Suppliers')} className="text-xs text-[#FFC703]/70 hover:underline flex items-center gap-1">
                        Manage <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {mySupplierRequests.filter(r => r.status === 'sent').slice(0, 8).map(req => (
                        <div key={req._id} className="bg-[#FFC703]/10 rounded-lg p-3 border border-[#FFC703]/25 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">
                              {req.title || 'Request'}
                            </p>
                            {req._creationTime && (
                              <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                                <Clock size={9} />
                                {new Date(req._creationTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <Link to={createPageUrl('Suppliers')}>
                            <Button size="sm" className="bg-[#FFC703]/20 hover:bg-[#FFC703]/30 text-[#FFC703] border border-[#FFC703]/30 h-7 px-3 text-xs shrink-0">
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* ADMIN DASHBOARD (GoHighLevel Style) */}
          {isAdmin && adminStats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 lg:space-y-8 mb-8 mt-2">
              
              {/* Top Row: KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Total Revenue', value: `€${paymentStats?.totalPaid?.toLocaleString('it-IT') || '0'}`, icon: DollarSign, trend: '+12%', color: 'from-[#FFC703]/20 to-[#FFC703]/5', textColor: 'text-[#FFC703]' },
                  { title: 'Active Projects', value: adminStats.totalCantieri, icon: Building2, trend: '+3%', color: 'from-white/10 to-transparent', textColor: 'text-[#F0EBE8]' },
                  { title: 'Pending Quotes', value: adminStats.pendingQuotes, icon: FileText, trend: '-2%', color: 'from-white/10 to-transparent', textColor: 'text-[#F0EBE8]' },
                  { title: 'Overdue Payments', value: `€${paymentStats?.totalOverdue?.toLocaleString('it-IT') || '0'}`, icon: AlertCircle, trend: 'Action Req', color: 'from-red-500/20 to-transparent', textColor: 'text-red-400' },
                ].map((kpi, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:bg-white/8 hover:border-[#FFC703]/30 transition-colors`}>
                    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${kpi.color} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <kpi.icon size={20} className={kpi.textColor} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 border border-white/10 ${kpi.trend.startsWith('+') ? 'text-green-400 border-green-400/20 bg-green-400/10' : kpi.trend.startsWith('-') ? 'text-[#F0EBE8]/40' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>
                        {kpi.trend}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-3xl font-bold text-[#F0EBE8] mb-1 tracking-tight">{kpi.value}</h3>
                      <p className="text-sm font-medium text-[#F0EBE8]/50">{kpi.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Middle Row: Revenue Chart (Placeholder) & Project Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart Area */}
                <Card className="lg:col-span-2 bg-white/5 border-white/10 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <CardHeader className="border-b border-white/8 bg-[#1C1A18]/80 p-5">
                    <CardTitle className="text-base text-[#F0EBE8] flex items-center justify-between">
                      <span className="flex items-center gap-2"><TrendingUp size={16} className="text-[#FFC703]" /> Revenue Trend</span>
                      <Select value={revenueDays.toString()} onValueChange={(v) => setRevenueDays(parseInt(v))}>
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-white/5 border-white/10 text-[#F0EBE8]"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#1C1A18] border-white/10 text-[#F0EBE8]">
                          <SelectItem value="30">Last 30 Days</SelectItem>
                          <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 relative flex items-end">
                    {/* Real Data Chart UI */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="flex-1 flex items-end gap-1 w-full">
                          {(() => {
                            // Aggregate data into buckets for display
                            const maxAmount = Math.max(...revenueTrend.map(r => r.amount), 1);
                            const buckets = revenueDays === 30 
                              ? Array.from({length: 12}, (_, i) => {
                                  const dayStart = i * 2.5;
                                  const dayEnd = dayStart + 2.5;
                                  return revenueTrend
                                    .filter(r => {
                                      const day = new Date(r.date).getDate();
                                      return day >= dayStart && day < dayEnd;
                                    })
                                    .reduce((sum, r) => sum + r.amount, 0);
                                })
                              : revenueTrend.map(r => r.amount);
                            
                            return buckets.map((amount, i) => (
                              <div key={i} className="flex-1 bg-gradient-to-t from-[#FFC703]/20 to-[#FFC703] rounded-t-lg relative group cursor-pointer min-h-[4px]" style={{ height: `${Math.max(5, (amount / maxAmount) * 100)}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1C1A18] text-[#F0EBE8] border border-white/10 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl">€{(amount / 1000).toFixed(1)}k</div>
                              </div>
                            ));
                          })()}
                        </div>
                        <div className="flex justify-between w-full mt-4 text-[10px] text-[#F0EBE8]/40 border-t border-white/10 pt-2">
                           {revenueDays === 30 ? (
                             <>{(() => {
                               const now = new Date();
                               return Array.from({length: 6}, (_, i) => {
                                 const d = new Date(now);
                                 d.setDate(d.getDate() - 30 + i * 6);
                                 return d.toLocaleString('en-US', { month: 'short' });
                               });
                             })()}</>
                           ) : (
                             <>{(() => {
                               const now = new Date();
                               return Array.from({length: 6}, (_, i) => {
                                 const d = new Date(now);
                                 d.setDate(d.getDate() - 90 + i * 18);
                                 return d.toLocaleString('en-US', { month: 'short' });
                               });
                             })()}</>
                           )}
                        </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pipeline Funnel */}
                <Card className="bg-white/5 border-white/10 rounded-2xl flex flex-col h-[400px]">
                  <CardHeader className="border-b border-white/8 bg-[#1C1A18]/80 p-5">
                    <CardTitle className="text-base text-[#F0EBE8] flex items-center gap-2"><Hammer size={16} className="text-[#FFC703]" /> Project Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-6">
                    {[
                      { label: 'New Leads', count: 12, percent: 100, color: 'bg-white/20' },
                      { label: 'Quotes Sent', count: adminStats.pendingQuotes, percent: 80, color: 'bg-amber-600' },
                      { label: 'In Production', count: adminStats?.cantieriByStatus?.in_lavorazione || 0, percent: 50, color: 'bg-[#FFC703]' },
                      { label: 'Installation', count: adminStats?.cantieriByStatus?.posa_in_opera || 0, percent: 30, color: 'bg-orange-400' },
                      { label: 'Completed', count: adminStats?.cantieriByStatus?.completato || 0, percent: 15, color: 'bg-green-400' },
                    ].map((step, i) => (
                      <div key={i} className="relative">
                        <div className="flex justify-between text-sm text-[#F0EBE8]/70 mb-2 px-1">
                          <span className="font-medium">{step.label}</span>
                          <span className="font-bold text-[#F0EBE8]">{step.count}</span>
                        </div>
                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${step.percent}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }} className={`h-full ${step.color} rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row: Recent Activity & Upcoming */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Activity Feed */}
                <Card className="lg:col-span-2 bg-white/5 border-white/10 rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-white/8 bg-[#1C1A18]/80 p-5">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base text-[#F0EBE8] flex items-center gap-2"><Activity size={16} className="text-[#FFC703]" /> Recent Activity</CardTitle>
                      <Link to={createPageUrl('Admin')} className="text-xs font-semibold text-[#FFC703] hover:underline">View All Log</Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto w-full custom-scrollbar">
                      {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-[#F0EBE8]/40 text-sm">No recent activity found.</div>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="text-[10px] uppercase text-[#F0EBE8]/30 bg-white/5 sticky top-0 backdrop-blur-md">
                            <tr>
                              <th className="px-5 py-3 font-medium">User</th>
                              <th className="px-5 py-3 font-medium">Action</th>
                              <th className="px-5 py-3 font-medium text-right">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {recentActivity.slice(0, 6).map((act, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-5 py-3 font-medium text-[#F0EBE8] flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-[#FFC703] shrink-0">
                                    {(act.user_name || 'Sys').substring(0,2).toUpperCase()}
                                  </div>
                                  {act.user_name || 'System'}
                                </td>
                                <td className="px-5 py-3 text-[#F0EBE8]/70">
                                  <span className="text-[#FFC703] font-medium">{act.entity_name || act.entity_type}</span> — {act.action}
                                </td>
                                <td className="px-5 py-3 text-[#F0EBE8]/40 text-xs text-right">
                                  {new Date(act.created_date).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="bg-white/5 border-white/10 rounded-2xl flex flex-col">
                  <CardHeader className="border-b border-white/8 bg-[#1C1A18]/80 p-5">
                    <CardTitle className="text-base text-[#F0EBE8] flex items-center gap-2"><Calendar size={16} className="text-[#FFC703]" /> Upcoming Appointments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 flex-1">
                    <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar pr-2">
                       {appointments.length === 0 ? (
                         <div className="text-center text-[#F0EBE8]/40 text-sm py-4">No upcoming appointments</div>
                       ) : (
                         appointments.slice(0, 4).map(apt => (
                           <div key={apt._id} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/8 transition-colors">
                             <div className="w-11 h-11 rounded-lg bg-[#FFC703]/10 border border-[#FFC703]/20 flex flex-col items-center justify-center shrink-0">
                               <span className="text-[10px] text-[#FFC703] font-bold uppercase leading-none mb-0.5">{new Date(apt.date).toLocaleString('en-US', { month: 'short' })}</span>
                               <span className="text-base font-black text-[#F0EBE8] leading-none">{new Date(apt.date).getDate()}</span>
                             </div>
                             <div className="flex-1 min-w-0 flex flex-col justify-center">
                               <h4 className="text-sm font-bold text-[#F0EBE8] truncate">{apt.full_name}</h4>
                               <p className="text-xs text-[#F0EBE8]/50 truncate flex items-center gap-1 mt-0.5"><Clock size={11} /> {apt.time}</p>
                             </div>
                           </div>
                         ))
                       )}
                    </div>
                    <Button asChild variant="ghost" className="w-full mt-4 bg-white/5 hover:bg-white/10 text-[#F0EBE8] border border-white/10">
                      <Link to={createPageUrl('Appointments')}>View Calendar</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          )}

          {/* Tabs - Conditionally Rendered */}
          <Tabs defaultValue={isAdmin ? "quotes" : isSupplier ? "supplier-requests" : "appointments"} className="space-y-4 sm:space-y-6">
            <TabsList className={`bg-white/5 backdrop-blur-md border border-white/10 w-full overflow-x-auto flex sm:grid ${isAdmin ? 'sm:grid-cols-3' : isClient ? 'sm:grid-cols-4' : isSupplier ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} h-auto`}>

              {isAdmin && (
                <TabsTrigger value="quotes" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                  Quote Requests
                </TabsTrigger>
              )}

              {isSupplier && (
                <TabsTrigger value="supplier-requests" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                  Live Requests
                </TabsTrigger>
              )}

              {isClient && (
                <>
                  <TabsTrigger value="client-quotes" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60">
                    My Quotes
                  </TabsTrigger>
                  <TabsTrigger value="client-cantieri" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                    My Projects
                  </TabsTrigger>
                  <TabsTrigger value="client-payments" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                    Payments
                  </TabsTrigger>
                </>
              )}

              {isSupplier && (
                <TabsTrigger value="preventivi-docs" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                  Documents
                </TabsTrigger>
              )}

              <TabsTrigger value="appointments" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                My Appointments
              </TabsTrigger>

              {!isSupplier && (
                  <TabsTrigger value="preventivi-docs" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-xs sm:text-sm text-[#F0EBE8]/60 py-2">
                    Documents
                  </TabsTrigger>
              )}
            </TabsList>

            {/* Supplier Requests Tab - Supplier Only */}
            {isSupplier && (
              <TabsContent value="supplier-requests" className="space-y-4">
                <div className="grid gap-4">
                  {mySupplierRequests.length === 0 ? (
                    <div className="text-center py-12 bg-[#1C1A18]/30 rounded-xl border border-white/8">
                      <FileText size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/70">No live requests at the moment</p>
                    </div>
                  ) : (
                    mySupplierRequests.map(req => (
                      <Card key={req._id} className="bg-gradient-to-br from-[#1C1A18] to-[#141210] border-white/8">
                        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">{req.title}</h3>
                            <p className="text-sm text-white/40">{req.fixture_category || req.fixture_type || "Category not specified"}</p>
                            <p className="text-xs text-white/30 mt-1">Status: {req.status}</p>
                          </div>
                          <Button asChild className="bg-[#FFC703]/80 hover:bg-[#FFC703]/70 text-[#1C1A18]">
                            <Link to={createPageUrl('Suppliers')}>View in Suppliers</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}

            {/* Quotes Tab - Admin Only */}
            {isAdmin && (
              <TabsContent value="quotes" className="space-y-4 sm:space-y-6">
                {/* Filters */}
                <Card className="bg-gradient-to-br from-white/5 to-white/3 border-white/10">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                      <Filter size={18} className="sm:w-5 sm:h-5" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-white/70">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                          <Input
                            placeholder="Nome, email, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-[#1C1A18]/50 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white/70">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white/70">Type</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="finestre">Windows</SelectItem>
                            <SelectItem value="chiavi_in_mano">Turnkey</SelectItem>
                            <SelectItem value="completo">Complete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white/70">Date</Label>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger className="bg-[#1C1A18]/50 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quotes List */}
                <div className="space-y-4">
                  {filteredQuotes.map((quote) => (
                    <Card key={quote._id} className="bg-gradient-to-br from-white/5 to-white/3 border-white/10">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(quote.status)}
                              <h3 className="font-medium text-white">{quote.full_name || 'N/A'}</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-white/8 text-white/70">
                                {quote.quote_type}
                              </span>
                            </div>
                            <p className="text-sm text-white/70">{quote.email}</p>
                            <p className="text-sm text-white/40">
                              Price: â‚¬{quote.estimated_price?.toLocaleString() || 'N/A'}
                            </p>
                            {quote.files && quote.files.length > 0 && (
                              <p className="text-xs text-white/40 mt-1">
                                ðŸ“Ž {quote.files.length} attachments
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Select
                              value={quote.status}
                              onValueChange={(value) => updateQuoteStatus(quote._id, value)}
                            >
                              <SelectTrigger className="w-32 bg-[#1C1A18]/50 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredQuotes.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                      No quotes found
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Client Quotes Tab - Client Only */}
            {isClient && (
              <TabsContent value="client-quotes" className="space-y-4">
                <div className="grid gap-4">
                  {quotes.filter(q => q.email === user?.primaryEmailAddress?.emailAddress).length === 0 ? (
                    <div className="text-center py-12 bg-[#1C1A18]/30 rounded-xl border border-white/8">
                      <FileText size={48} className="text-white/25 mx-auto mb-4" />
                      <p className="text-white/70">You haven't requested any quotes yet</p>
                      <Button
                        variant="link"
                        className="text-[#FFC703] mt-2"
                        onClick={() => setIsRequestModalOpen(true)}
                      >
                        Send your first request
                      </Button>
                    </div>
                  ) : (
                    quotes
                      .filter(q => q.email === user?.primaryEmailAddress?.emailAddress)
                      .map((quote) => (
                        <Card key={quote._id} className="bg-gradient-to-br from-[#1C1A18] to-[#141210] border-white/8 overflow-hidden">
                          <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-[#FFC703]/20 rounded-lg">
                                    <FileText className="w-5 h-5 text-[#FFC703]" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white text-lg">
                                      {quote.request_title || quote.title || quote.full_name || 'Quote Request'}
                                    </h3>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">
                                      {quote.material_category ? `${quote.material_category} Â· ` : ''}{quote.quote_type}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                  <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Clock size={14} className="text-[#FFC703]/80" />
                                    <span>Requested: {new Date(quote._creationTime).toLocaleDateString('en-GB')}</span>
                                  </div>
                                  {quote.estimated_price && (
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                      <DollarSign size={14} className="text-[#FFC703]/80" />
                                      <span className="font-bold">Estimated Price: â‚¬{quote.estimated_price.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {quote.notes && (
                                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{quote.notes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col justify-between items-end gap-3">
                                {(() => {
                                  const s = quote.status;
                                  const cfg = s === 'accepted' ? { bg: 'bg-[#FFC703]/15', text: 'text-[#FFC703]/80', border: 'border-[#FFC703]/30', label: 'Accepted âœ“' }
                                    : s === 'rejected' ? { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Rejected' }
                                    : s === 'sent' ? { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Pending âš¡' }
                                    : s === 'in_lavorazione' || s === 'draft' ? { bg: 'bg-[#FFC703]/20', text: 'text-[#FFC703]', border: 'border-[#FFC703]/30', label: 'In Production' }
                                    : s === 'completato' ? { bg: 'bg-white/10', text: 'text-white/50', border: 'border-white/20', label: 'Completed' }
                                    : s === 'scaduto' ? { bg: 'bg-white/5', text: 'text-white/40', border: 'border-white/10', label: 'Expired' }
                                    : { bg: 'bg-[#FFC703]/20', text: 'text-[#FFC703]', border: 'border-[#FFC703]/30', label: s };
                                  return (
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                      {cfg.label}
                                    </div>
                                  );
                                })()}

                                {/* Accept / Reject buttons when quote is sent to client */}
                                {quote.status === 'sent' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-green-500/40 text-[#FFC703]/80 hover:bg-green-500/10 text-xs h-8"
                                      onClick={() => { setQuoteToRespond(quote); setRespondAction('accepted'); }}
                                    >
                                      <ThumbsUp size={13} className="mr-1" /> Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                      onClick={() => { setQuoteToRespond(quote); setRespondAction('rejected'); }}
                                    >
                                      <ThumbsDown size={13} className="mr-1" /> Reject
                                    </Button>
                                  </div>
                                )}

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent border-white/10 text-white hover:bg-white/5"
                                >
                                  <Link to={createPageUrl('Messages')}>
                                    <MessageSquare size={14} className="mr-2" />
                                    Go to Chat
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            {/* Workflow Visualizer */}
                            <div className="mt-6 pt-6 border-t border-white/5">
                              <div className="flex items-center justify-between relative px-2">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                                {[
                                  { step: 'Requested', active: true },
                                  { step: 'Review', active: ['sent', 'accepted', 'rejected'].includes(quote.status) },
                                  { step: 'In Production', active: quote.status === 'accepted' && clientOrders.some(o => o.quote_id === quote._id && ['in_production', 'ready', 'shipped', 'delivered'].includes(o.status)) },
                                  { step: 'In Transit', active: quote.status === 'accepted' && clientOrders.some(o => o.quote_id === quote._id && ['shipped', 'delivered'].includes(o.status)) },
                                  { step: 'Delivered', active: quote.status === 'accepted' && clientOrders.some(o => o.quote_id === quote._id && o.status === 'delivered') }
                                ].map((s, i) => (
                                  <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full border-2 ${s.active ? 'bg-[#FFC703]/20 border-[#FFC703]/30 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[#16191c] border-white/10'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${s.active ? 'text-[#FFC703]' : 'text-white/30'}`}>{s.step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>

                {/* Accept / Reject confirmation dialog */}
                <Dialog open={!!quoteToRespond} onOpenChange={(open) => { if (!open) { setQuoteToRespond(null); setRespondAction(null); } }}>
                  <DialogContent className="bg-[#1C1A18] border-white/10 text-white max-w-sm max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className={`flex items-center gap-2 ${respondAction === 'accepted' ? 'text-[#FFC703]/80' : 'text-red-400'}`}>
                        {respondAction === 'accepted' ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}
                        {respondAction === 'accepted' ? 'Accept Quote' : 'Reject Quote'}
                      </DialogTitle>
                    </DialogHeader>
                    {quoteToRespond && (
                      <div className="space-y-4 py-2">
                        <p className="text-white/70 text-sm">
                          {respondAction === 'accepted'
                            ? 'By confirming, you accept the quote and authorise the project to begin. A deposit payment will be required.'
                            : 'By confirming, you reject the quote. You can request a revision via the chat.'}
                        </p>
                        <div className="bg-[#535252]/40 rounded-lg p-3 text-sm">
                          <p className="text-white/40 text-xs mb-1">Quote</p>
                          <p className="text-white font-medium">{quoteToRespond.request_title || quoteToRespond.title || quoteToRespond.full_name || 'Quote'}</p>
                          {quoteToRespond.estimated_price && (
                            <p className="text-[#FFC703]/80 font-bold mt-1">â‚¬{quoteToRespond.estimated_price.toLocaleString()}</p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1 border-white/10 text-white/40" onClick={() => { setQuoteToRespond(null); setRespondAction(null); }}>
                            Cancel
                          </Button>
                          <Button
                            className={`flex-1 ${respondAction === 'accepted' ? 'bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18]' : 'bg-red-600 hover:bg-red-700'}`}
                            onClick={handleRespondToQuote}
                            disabled={isRespondingQuote}
                          >
                            {isRespondingQuote ? <Loader2 size={15} className="animate-spin" /> : (respondAction === 'accepted' ? 'Accept' : 'Reject')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
            )}

            {/* Client Cantieri Tab - Client Only */}
            {isClient && (
              <TabsContent value="client-cantieri" className="space-y-4">
                <div className="grid gap-4">
                  {clientCantieri.length === 0 ? (
                    <div className="text-center py-12 bg-[#1C1A18]/30 rounded-xl border border-white/8">
                      <Hammer size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/70">No active projects yet</p>
                      <p className="text-xs text-white/30 mt-2">Your projects will appear here once a quote has been accepted.</p>
                    </div>
                  ) : (
                    clientCantieri.map((cantiere) => (
                      <Card key={cantiere._id} className="bg-gradient-to-br from-[#1C1A18] to-[#141210] border-white/8 overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-[#FFC703]/15 rounded-xl">
                                  <Building2 className="w-6 h-6 text-[#FFC703]/70" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-white text-xl">{cantiere.nome_cantiere}</h3>
                                  <div className="flex items-center gap-2 text-white/40 text-sm">
                                    <MapPin size={14} />
                                    <span>{cantiere.indirizzo || 'Address not specified'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/70 font-medium">Work Progress</span>
                                    <span className="text-white/50 font-bold">{cantiere.progresso || 0}%</span>
                                  </div>
                                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-[#FFC703] to-[#FFC703]"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${cantiere.progresso || 0}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-2">
                                  <div className="flex items-center gap-2 text-xs text-white/40">
                                    <Calendar size={14} className="text-[#FFC703]" />
                                    <span>Created: {new Date(cantiere.created_date || cantiere._creationTime).toLocaleDateString('en-GB')}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-white/40">
                                    <Activity size={14} className="text-[#FFC703]/80" />
                                    <span className="capitalize">{cantiere.status?.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col justify-between items-stretch sm:items-end gap-4 sm:min-w-[200px]">
                              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] border ${
                                cantiere.status === 'completato' ? 'bg-[#FFC703]/15 text-[#FFC703]/80 border-green-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                              }`}>
                                {cantiere.status?.replace(/_/g, ' ') || 'In Progress'}
                              </div>
                              
                              <Button
                                asChild
                                className="w-full bg-gradient-to-r from-[#FFC703] to-[#FFC703] hover:from-[#FFC703] hover:to-[#FFC703] shadow-lg"
                              >
                                <Link to={createPageUrl('Projects')}>
                                  View Project Details
                                  <ArrowRight size={16} className="ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
            {isClient && (
              <TabsContent value="client-payments" className="space-y-4">
                <div className="grid gap-4">
                  {clientPayments.length === 0 ? (
                    <div className="text-center py-12 bg-[#1C1A18]/30 rounded-xl border border-white/8">
                      <DollarSign size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/70">No pending payments</p>
                    </div>
                  ) : (
                    clientPayments.map((payment) => (
                      <Card key={payment._id} className="bg-gradient-to-br from-[#1C1A18] to-[#141210] border-white/8 overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg">{payment.description}</h3>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-white/70">Amount: <span className="font-bold text-[#FFC703]/80">â‚¬{payment.amount.toLocaleString()}</span></p>
                                <p className="text-xs text-white/40">Due: {new Date(payment.due_date).toLocaleDateString('en-GB')}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase border ${payment.status === 'pagato' ? 'bg-[#FFC703]/15 text-[#FFC703]/80 border-green-500/30' :
                                  payment.status === 'in_verifica' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                }`}>
                                {payment.status === 'in_attesa' ? 'Due' :
                                  payment.status === 'in_verifica' ? 'Under Review' :
                                    payment.status === 'pagato' ? 'Confirmed' : payment.status}
                              </div>

                              {payment.status === 'in_attesa' && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    id={`proof-${payment._id}`}
                                    className="hidden"
                                    onChange={(e) => handleUploadPaymentProof(payment._id, e.target.files[0])}
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-bold h-8 text-xs"
                                    onClick={() => document.getElementById(`proof-${payment._id}`).click()}
                                  >
                                    <Upload size={14} className="mr-1" />
                                    Upload Payment Proof
                                  </Button>
                                </div>
                              )}

                              {payment.proof_url && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-[#FFC703] text-xs p-0 h-auto"
                                  onClick={() => {
                                    setPdfUrl(payment.proof_url);
                                    setPdfTitle("Payment Proof");
                                    setIsPdfOpen(true);
                                  }}
                                >
                                  <Eye size={14} className="mr-1" />
                                  View Proof
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}

            {/* Preventivi Documenti Tab - All Roles */}
            <TabsContent value="preventivi-docs" className="space-y-4">
              {preventivi.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={64} className="text-white/30 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">No quotes uploaded</p>
                  <p className="text-white/40 text-sm mt-2">Upload your quotes from the Documents section</p>
                </div>
              ) : (
                preventivi.map((doc) => (
                  <Card key={doc._id} className="bg-gradient-to-br from-white/5 to-white/3 border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-[#FFC703]/70" />
                            <h3 className="font-medium text-white">{doc.title}</h3>
                          </div>
                          {doc.description && (
                            <p className="text-sm text-white/70 mb-2">{doc.description}</p>
                          )}
                          <p className="text-sm text-white/40">
                            {doc.file_name} â€¢ {(doc.file_size / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-white/30 mt-1">
                            Uploaded {new Date(doc.created_date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPdfUrl(doc.file_url);
                              setPdfTitle(doc.title);
                              setIsPdfOpen(true);
                            }}
                            className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] font-semibold border-0 transition-all shadow-md"
                          >
                            <Eye size={16} className="mr-1.5" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Appointments Tab - All Roles */}
            <TabsContent value="appointments" className="space-y-4">
              {appointments.map((apt) => (
                <Card key={apt._id} className="bg-gradient-to-br from-white/5 to-white/3 border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-white">{apt.full_name}</h3>
                        <p className="text-sm text-white/70">{apt.email}</p>
                        <p className="text-sm text-white/40">
                          {new Date(apt.appointment_date).toLocaleDateString('en-GB')} - {apt.appointment_time}
                        </p>
                        <p className="text-xs text-white/40">{apt.project_type}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {isAdmin ? (
                          <Select
                            value={apt.status}
                            onValueChange={(value) => updateAppointmentStatus({ id: apt._id, status: value })}
                          >
                            <SelectTrigger className={`w-36 text-xs h-8 ${
                              (apt.status === 'confirmed' || apt.status === 'pending') ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                              apt.status === 'cancelled' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                              apt.status === 'rejected' ? 'bg-red-600/10 text-red-400 border-red-600/20' :
                              'bg-[#FFC703]/20 text-[#FFC703] border-[#FFC703]/30'
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                            apt.status === 'confirmed' ? 'bg-green-500/30 text-green-300 border border-green-500/40' :
                            apt.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40' :
                            (apt.status === 'cancelled' || apt.status === 'rejected') ? 'bg-red-500/30 text-red-300 border border-red-500/40' :
                              'bg-[#FFC703]/20 text-[#FFC703] border border-[#FFC703]/30'
                            }`}>
                            {apt.status === 'confirmed' ? 'Confirmed' :
                             apt.status === 'pending' ? 'Pending' :
                              apt.status === 'cancelled' ? 'Cancelled' : 
                              apt.status === 'rejected' ? 'Rejected' : 
                              apt.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>
    </div>
  );
}





