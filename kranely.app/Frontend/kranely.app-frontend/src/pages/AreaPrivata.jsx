/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import {
    FileText, CreditCard, HardHat, FolderOpen, Clock, CheckCircle, XCircle,
    Upload, Loader2, AlertTriangle, Calendar, Eye, Download, RefreshCw, Activity,
    User, Package, Truck, Zap, Star, Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import { createPageUrl } from '../utils';

// â”€â”€â”€ Phase Stepper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ordered phases from the client's perspective. Each phase has a list of
// quote.status values that map to it.
const PHASE_STEPS = [
    { label: t('private_area.phase_labels.request'),    statuses: ['draft', 'request', 'pending', '', null, undefined] },
    { label: t('private_area.phase_labels.valutazione'),  statuses: ['in_lavorazione'] },
    { label: t('private_area.phase_labels.quote'),   statuses: ['sent'] },
    { label: t('private_area.phase_labels.accettato'),    statuses: ['accepted'] },
    { label: t('private_area.phase_labels.produzione'),   statuses: ['ordine_confermato', 'in_produzione'] },
    { label: t('private_area.phase_labels.consegna'),     statuses: ['in_consegna'] },
    { label: t('private_area.phase_labels.completed'),   statuses: ['completed'] },
];

// Terminal states that break out of the linear flow
const TERMINAL_STATES = {
    rejected: { label: t('private_area.phase_labels.rejected'), color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
    scaduto:  { label: t('private_area.phase_labels.expired'),   color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: XCircle },
};

function getPhaseIndex(status) {
    for (let i = 0; i < PHASE_STEPS.length; i++) {
        if (PHASE_STEPS[i].statuses.includes(status)) return i;
    }
    return 0;
}

function QuotePhaseStepper({ status }) {
    const terminal = TERMINAL_STATES[status];
    if (terminal) {
        const Icon = terminal.icon;
        return (
            <div className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg border ${terminal.bg} w-fit`}>
                <Icon size={12} className={terminal.color} />
                <span className={`text-xs font-medium ${terminal.color}`}>{terminal.label}</span>
            </div>
        );
    }

    const currentIndex = getPhaseIndex(status);
    const isComplete = currentIndex === PHASE_STEPS.length - 1;

    return (
        <div className="mt-2.5">
            {/* Current phase label */}
            <div className="flex items-center gap-2 mb-2">
                {isComplete ? (
                    <CheckCircle size={12} className="text-green-400" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                )}
                <span className={`text-xs font-medium ${isComplete ? 'text-green-400' : 'text-[#FFC703]'}`}>
                    {PHASE_STEPS[currentIndex].label}
                </span>
<span className="text-[10px] text-white/25">
                    Â· {t('private_area.phase_labels.fase')} {currentIndex + 1} {t('common.of')} {PHASE_STEPS.length}
                </span>
            </div>

            {/* Progress dot bar */}
            <div className="flex items-center">
                {PHASE_STEPS.map((step, i) => (
                    <React.Fragment key={i}>
                        <div
                            title={step.label}
                            className={`rounded-full shrink-0 transition-all ${
                                i < currentIndex
                                    ? 'w-2.5 h-2.5 bg-green-500'
                                    : i === currentIndex
                                    ? 'w-3.5 h-3.5 bg-blue-400 ring-2 ring-[#FFC703]/30'
                                    : 'w-2 h-2 bg-[#535252]'
                            }`}
                        />
                        {i < PHASE_STEPS.length - 1 && (
                            <div
                                className={`h-0.5 flex-1 mx-0.5 ${
                                    i < currentIndex ? 'bg-green-500/60' : 'bg-[#535252]'
                                }`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step labels row "” only show first, current, and last */}
            <div className="flex justify-between mt-1">
                <span className="text-[9px] text-white/25">{PHASE_STEPS[0].label}</span>
                <span className="text-[9px] text-white/25">{PHASE_STEPS[PHASE_STEPS.length - 1].label}</span>
            </div>
        </div>
    );
}

// â”€â”€â”€ Simple status badge (used in Pagamenti / secondary contexts) â”€â”€
const paymentStatusBadge = (status) => {
    switch (status) {
        case 'confirmed': return <Badge className="bg-green-500/20 text-green-400 border-none text-xs"><CheckCircle size={11} className="mr-1" />{t('private_area.status.confirmed')}</Badge>;
        case 'pending':   return <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-xs"><Clock size={11} className="mr-1" />{t('private_area.status.pending')}</Badge>;
        case 'overdue':   return <Badge className="bg-red-500/20 text-red-400 border-none text-xs"><AlertTriangle size={11} className="mr-1" />{t('private_area.status.overdue')}</Badge>;
        default:          return <Badge className="bg-gray-500/20 text-gray-400 border-none text-xs">{status}</Badge>;
    }
};

const cantiereStatusBadge = (status) => {
    switch (status) {
        case 'attivo':      return <Badge className="bg-[#FFC703]/20 text-[#FFC703] border-none text-xs"><Activity size={11} className="mr-1" />{t('private_area.status.active')}</Badge>;
        case 'in_pausa':    return <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-xs"><Clock size={11} className="mr-1" />{t('private_area.status.on_hold')}</Badge>;
        case 'completed':  return <Badge className="bg-green-500/20 text-green-400 border-none text-xs"><CheckCircle size={11} className="mr-1" />{t('private_area.status.confirmed')}</Badge>;
        case 'pianificato': return <Badge className="bg-purple-500/20 text-[#FFC703]/60 border-none text-xs"><Calendar size={11} className="mr-1" />{t('private_area.status.pianificato')}</Badge>;
        default:            return <Badge className="bg-gray-500/20 text-gray-400 border-none text-xs">{status}</Badge>;
    }
};

function EmptyState({ icon: Icon, title, text }) {
    return (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/8">
            <Icon size={40} className="text-white/25 mx-auto mb-3" />
            <h3 className="text-lg text-white/70 mb-1">{title}</h3>
            <p className="text-white/40 text-sm">{text}</p>
        </div>
    );
}

export default function AreaPrivata() {
    const { user } = useUser();
    const { t } = useTranslation();
    const email = user?.primaryEmailAddress?.emailAddress || '';

    const [viewPdfUrl, setViewPdfUrl] = useState(null);
    const [uploadingPaymentId, setUploadingPaymentId] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('preventivi');

    const convexUser = useQuery(api.users.getByEmail, email ? { email } : 'skip');
    const myQuotes = useQuery(api.quotes.getByUser, email ? { email } : 'skip') || [];
    const myPayments = useQuery(api.payments.list, {}) || [];
    const myDocuments = useQuery(api.documents.get, {}) || [];

    const allProjects = useQuery(
        api.cantieri.listCantieri,
        email ? { company_email: email } : 'skip'
    ) || [];

    const myProjects = convexUser?._id
        ? allProjects.filter(c => c.client_id === convexUser._id || c.company_email === email)
        : [];

    const clientPayments = myPayments.filter(p => p.type === 'client');
    const pendingPayments = clientPayments.filter(p => p.status === 'pending');

    // Count quotes in active phases (not terminal)
    const activeQuotes = myQuotes.filter(q => !['rejected', 'scaduto', 'completed'].includes(q.status));

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const uploadPaymentProof = useMutation(api.payments.uploadProof);

    const handleProofUpload = async (paymentId) => {
        if (!uploadFile) return;
        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': uploadFile.type },
                body: uploadFile,
            });
            if (!result.ok) throw new Error('Upload failed');
            const { storageId } = await result.json();
            await uploadPaymentProof({ payment_id: paymentId, proof_url: storageId });
            setUploadingPaymentId(null);
            setUploadFile(null);
            alert(t('common.payment_sent'));
        } catch (err) {
            console.error(err);
            alert(t('common.upload_failed'));
        } finally {
            setIsUploading(false);
        }
    };

    if (convexUser === undefined) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={36} />
            </div>
        );
    }

    if (convexUser?.role !== 'client' && convexUser?.role !== 'admin' && convexUser?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
<h2 className="text-xl text-white mb-2">{t('access.denied')}</h2>
                    <p className="text-white/40">{t('access.no_permission')}</p>
                </div>
            </div>
        );
    }

const tabs = [
        { id: 'preventivi', label: t('private_area_tabs.quotes'),  icon: FileText,   count: myQuotes.length },
        { id: 'pagamenti',  label: t('private_area_tabs.payments'),   icon: CreditCard, count: pendingPayments.length, alert: pendingPayments.length > 0 },
        { id: 'cantieri',   label: t('private_area_tabs.projects'),    icon: HardHat,    count: myProjects.length },
        { id: 'documenti',  label: t('private_area_tabs.documents'),   icon: FolderOpen, count: myDocuments.length },
    ];

    return (
        <div className="min-h-screen bg-[#1C1A18] relative overflow-hidden">
            <UniversalPdfViewer
                isOpen={!!viewPdfUrl}
                onClose={() => setViewPdfUrl(null)}
                url={viewPdfUrl}
                title="Document"
            />

            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-[#FFC703]/20 flex items-center justify-center">
                                <User size={20} className="text-[#FFC703]" />
                            </div>
<div>
                                <h1 className="text-2xl font-light text-white">
                                    {t('private_area.welcome')}, {convexUser?.fullName || user?.firstName || 'Client'}
                                </h1>
                                <p className="text-white/40 text-sm flex items-center gap-1">
                                    <RefreshCw size={11} className="text-green-400" /> {t('private_area.private_area_title')}
                                </p>
                            </div>
                        </div>

{/* Summary stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            <StatCard label={t('private_area.active_quotes')} value={activeQuotes.length} color="blue" />
                            <StatCard label={t('private_area.pending_payments')} value={pendingPayments.length} color={pendingPayments.length > 0 ? 'amber' : 'green'} />
                            <StatCard label={t('private_area.active_projects')} value={myProjects.filter(c => c.status === 'attivo').length} color="purple" />
                            <StatCard label={t('private_area.documents')} value={myDocuments.length} color="cyan" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-[#1C1A18]/ rounded-xl p-1 mb-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                                    activeTab === tab.id
                                        ? 'bg-[#F0EBE8] text-[#141210]'
                                        : 'text-white/40 hover:text-white'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        tab.alert ? 'bg-amber-500 text-white' :
                                        activeTab === tab.id ? 'bg-[#1C1A18] text-white' : 'bg-[#535252] text-white'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* â”€â”€ PREVENTIVI â”€â”€ */}
                    {activeTab === 'preventivi' && (
                        <div className="space-y-4">
                            {myQuotes.length === 0
                                ? <EmptyState icon={FileText} title={t('empty_state.no_quotes')} text={t('private_area.view_manage_quotes')} />
                                : myQuotes.map(quote => (
                                    <motion.div key={quote._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-white/5 border border-white/10 hover:border-[#FFC703]/30 hover:bg-white/8 transition-colors">
                                            <CardContent className="p-4">
                                                {/* Title row */}
                                                <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                                                    <p className="font-medium text-white flex-1 min-w-0">
                                                        {quote.title || (
quote.quote_type === 'finestre' ? t('quote_types.finestre') :
                                                            quote.quote_type === 'chiavi_in_mano' ? t('quote_types.chiavi_in_mano') : t('quote_types.completo')
                                                        )}
                                                    </p>
                                                    {quote.estimated_price && (
                                                        <span className="text-white font-semibold text-sm shrink-0">
                                                            € {quote.estimated_price.toLocaleString('en-GB')}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Phase stepper "” real-time progress tracker */}
                                                <QuotePhaseStepper status={quote.status} />

                                                {/* Meta row */}
                                                <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap mt-2.5">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {new Date(quote.created_date || quote._creationTime).toLocaleDateString('en-GB')}
                                                    </span>
                                                    {/* Expiry warning for 'sent' quotes */}
                                                    {quote.client_quote_expires_at && quote.status === 'sent' && (() => {
                                                        const diff = new Date(quote.client_quote_expires_at) - new Date();
                                                        const hours = Math.floor(diff / 3600000);
                                                        if (diff <= 0) return null;
                                                        if (hours <= 24) return (
<span key="expiry-urgent" className="text-red-400 flex items-center gap-1 animate-pulse">
                                                                <AlertTriangle size={11} /> {t('private_area.quotes.expires_in')} {hours}{t('private_area.quotes.hours')}
                                                            </span>
                                                        );
                                                        return (
<span key="expiry" className="text-amber-400 flex items-center gap-1">
                                                                <Calendar size={11} /> {t('private_area.quotes.expires_on')} {new Date(quote.client_quote_expires_at).toLocaleDateString('en-GB')}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                {quote.notes && (
                                                    <p className="text-xs text-white/25 mt-2 line-clamp-2">{quote.notes}</p>
                                                )}

                                                {/* CTA: when quote is 'sent', prompt client to accept/reject */}
                                                {quote.status === 'sent' && (
                                                    <div className="mt-3 p-3 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-lg flex items-center justify-between">
<p className="text-xs text-[#FFC703]">{t('private_area.quotes.ready')}</p>
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#FFC703] hover:bg-[#FFC703] text-white h-7 text-xs ml-3 shrink-0"
                                                            onClick={() => window.location.href = createPageUrl('Quotes')}
                                                        >
                                                            <CheckCircle size={11} className="mr-1" /> {t('private_area.actions.view_respond')}
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Attachment */}
                                                {quote.files && quote.files.length > 0 && (
                                                    <div className="mt-3">
<Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-[#FFC703] border-[#FFC703]/20 hover:bg-[#FFC703]/20 h-7 text-xs"
                                                            onClick={() => setViewPdfUrl(quote.files[0])}
                                                        >
                                                            <Eye size={11} className="mr-1" /> {t('private_area.actions.view_attachment')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}

                    {/* â”€â”€ PAGAMENTI â”€â”€ */}
                    {activeTab === 'pagamenti' && (
                        <div className="space-y-3">
                            {clientPayments.length === 0
                                ? <EmptyState icon={CreditCard} title={t('private_area.no_payments')} text={t('private_area.payments_appear_here')} />
                                : clientPayments.map(payment => (
                                    <motion.div key={payment._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className={`border ${payment.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-[#1C1A18]'}`}>
                                            <CardContent className="p-4">
<div className="flex items-start justify-between gap-3 flex-wrap">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <p className="font-medium text-white">{payment.description || t('private_area.payments.payment')}</p>
                                                            {paymentStatusBadge(payment.status)}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-white/40 flex-wrap">
                                                            {payment.amount && (
                                                                <span className="text-xl font-bold text-white">€ {payment.amount.toLocaleString('en-GB')}</span>
                                                            )}
                                                            {payment.due_date && (
<span className="flex items-center gap-1">
                                                                    <Calendar size={12} /> {t('private_area.payments.due')} {new Date(payment.due_date).toLocaleDateString('en-GB')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {payment.payment_instructions && (
                                                            <div className="mt-2 p-2 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded text-xs text-[#FFC703] whitespace-pre-wrap">
                                                                {payment.payment_instructions}
                                                            </div>
                                                        )}
                                                        {payment.proof_url && payment.status === 'pending' && (
<p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                                                <CheckCircle size={11} /> {t('private_area.payments.proof_sent')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {payment.status === 'pending' && !payment.proof_url && (
                                                            uploadingPaymentId === payment._id ? (
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        className="text-xs text-white/40 max-w-[180px]"
                                                                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-white/40 h-7 text-xs"
onClick={() => { setUploadingPaymentId(null); setUploadFile(null); }}
                                                                        >
                                                                            {t('common.cancel')}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-[#FFC703] hover:bg-[#FFC703]/80 text-[#1C1A18] h-7 text-xs"
                                                                            disabled={!uploadFile || isUploading}
                                                                            onClick={() => handleProofUpload(payment._id)}
                                                                        >
{isUploading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Upload size={12} className="mr-1" />}
                                                                            {t('common.submit')}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
<Button
                                                                    size="sm"
                                                                    className="bg-[#FFC703] hover:bg-[#e6b300] text-[#1C1A18]"
                                                                    onClick={() => setUploadingPaymentId(payment._id)}
                                                                >
                                                                    <Upload size={13} className="mr-1" /> {t('private_area.actions.upload_payment_proof')}
                                                                </Button>
                                                            )
                                                        )}
                                                        {payment.proof_url && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-[#FFC703] border-[#FFC703]/20 hover:bg-[#FFC703]/20"
                                                                onClick={() => setViewPdfUrl(payment.proof_url)}
                                                            >
                                                                <Eye size={13} className="mr-1" /> {t('private_area.actions.view_proof')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}

                    {/* â”€â”€ CANTIERI (Real-time) â”€â”€ */}
                    {activeTab === 'cantieri' && (
                        <div className="space-y-3">
<div className="flex items-center gap-2 mb-2">
                                <RefreshCw size={13} className="text-green-400" style={{ animation: 'spin 3s linear infinite' }} />
                                <span className="text-xs text-green-400">{t('common.actions.live_updates')}</span>
                            </div>
                            {myProjects.length === 0
                                ? <EmptyState icon={HardHat} title={t('private_area.no_projects')} text={t('private_area.projects_appear_here')} />
                                : myProjects.map(cantiere => (
                                    <motion.div key={cantiere._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-white/5 border border-white/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <HardHat size={16} className="text-purple-400" />
                                                    <p className="font-medium text-white">{cantiere.nome_cantiere}</p>
                                                    {cantiereStatusBadge(cantiere.status)}
                                                </div>

                                                {cantiere.indirizzo && (
                                                    <p className="text-xs text-white/40 mb-3">{cantiere.indirizzo}</p>
                                                )}

                                                {cantiere.progress_percentage !== undefined && (
                                                    <div className="mb-3">
<div className="flex justify-between text-xs text-white/40 mb-1">
                                                            <span>{t('private_area.projects.work_progress')}</span>
                                                            <span className="font-medium text-white">{cantiere.progress_percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-[#535252] rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-[#FFC703] to-[#FFC703] h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(100, cantiere.progress_percentage)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-4 flex-wrap">
                                                    {cantiere.data_inizio && (
                                                        <div>
                                                            <p className="text-[10px] text-white/25 uppercase">{t('private_area.projects.start')}</p>
                                                            <p className="text-xs text-white/70">{new Date(cantiere.data_inizio).toLocaleDateString('en-GB')}</p>
                                                        </div>
                                                    )}
                                                    {cantiere.data_fine_prevista && (
                                                        <div>
                                                            <p className="text-[10px] text-white/25 uppercase">{t('private_area.projects.expected_end')}</p>
                                                            <p className="text-xs text-white/70">{new Date(cantiere.data_fine_prevista).toLocaleDateString('en-GB')}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {cantiere.fase_corrente && (
                                                    <div className="mt-3 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-lg p-2">
                                                        <p className="text-[10px] text-[#FFC703] uppercase mb-1">{t('private_area.projects.current_phase')}</p>
                                                        <p className="text-sm text-white">{cantiere.fase_corrente}</p>
                                                    </div>
                                                )}

                                                {cantiere.note_cliente && (
                                                    <div className="mt-2 bg-[#535252]/ rounded p-2">
                                                        <p className="text-[10px] text-white/40 uppercase mb-1">{t('private_area.projects.note')}</p>
                                                        <p className="text-xs text-white/70">{cantiere.note_cliente}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}

                    {/* â”€â”€ DOCUMENTI â”€â”€ */}
                    {activeTab === 'documenti' && (
                        <div className="space-y-3">
                            {myDocuments.length === 0
                                ? <EmptyState icon={FolderOpen} title={t('private_area.no_documents')} text={t('private_area.documents_appear_here')} />
                                : myDocuments.map(doc => (
                                    <motion.div key={doc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-white/5 border border-white/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FileText size={15} className="text-[#FFC703] shrink-0" />
                                                            <p className="font-medium text-white truncate">{doc.title}</p>
                                                        </div>
                                                        {doc.description && <p className="text-xs text-white/40 truncate">{doc.description}</p>}
                                                        {doc.created_date && (
                                                            <p className="text-xs text-white/25 mt-1">{new Date(doc.created_date).toLocaleDateString('en-GB')}</p>
                                                        )}
                                                    </div>
                                                    {doc.file_url && (
                                                         <Button
                                                             size="sm"
                                                             variant="outline"
                                                             className="text-[#FFC703] border-[#FFC703]/20 hover:bg-[#FFC703]/20 shrink-0"
                                                             onClick={() => setViewPdfUrl(doc.file_url)}
                                                         >
                                                             <Download size={13} className="mr-1" /> {t('common.open')}
                                                         </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colorMap = {
        blue:   { bg: 'bg-[#FFC703]/10',   border: 'border-[#FFC703]/20',   text: 'text-[#FFC703]' },
        amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400' },
        green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
        cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400' },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`${c.bg} border ${c.border} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
        </div>
    );
}




