import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tag, Plus, Trash2, AlertCircle, CheckCircle2,
    Percent, Users, ToggleLeft, ToggleRight, X
} from 'lucide-react';
import useRBAC from '../hooks/useRBAC';

const EMPTY_FORM = { code: '', description: '', discount_percent: '', max_uses: '' };

export default function CodiceReferral() {
    const { isAdmin, isLoading } = useRBAC();

    const codes = useQuery(api.referralCodes.list, isAdmin ? {} : 'skip') ?? [];
    const createCode = useMutation(api.referralCodes.create);
    const toggleActive = useMutation(api.referralCodes.toggleActive);
    const removeCode = useMutation(api.referralCodes.remove);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ── Loading ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="lg:ml-[280px] pt-[76px] min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#f8f9fa]/20 border-t-[#f8f9fa] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="lg:ml-[280px] pt-[76px] min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="text-center p-8 bg-[#343a40]/50 border border-red-500/30 rounded-2xl max-w-sm">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <h2 className="text-[#f8f9fa] text-lg font-medium mb-2">Accesso negato</h2>
                    <p className="text-[#adb5bd] text-sm">Solo gli amministratori possono gestire i codici referral.</p>
                </div>
            </div>
        );
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!form.code.trim()) { setError('Il codice è obbligatorio.'); return; }
        const pct = parseFloat(form.discount_percent);
        if (isNaN(pct) || pct <= 0 || pct > 100) { setError('Lo sconto deve essere un valore tra 1 e 100.'); return; }

        setSaving(true);
        try {
            await createCode({
                code: form.code,
                description: form.description || undefined,
                discount_percent: pct,
                max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
            });
            setSuccess('Codice creato con successo!');
            setForm(EMPTY_FORM);
            setShowForm(false);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.message || 'Errore durante la creazione.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try { await toggleActive({ id }); }
        catch (err) { setError(err.message || 'Errore.'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Eliminare questo codice? L\'azione non è reversibile.')) return;
        try { await removeCode({ id }); }
        catch (err) { setError(err.message || 'Errore.'); }
    };

    const openForm = () => { setShowForm(true); setError(''); setSuccess(''); };
    const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); setError(''); };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="lg:ml-[280px] pt-[76px] min-h-screen bg-[#212529]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Page Header ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-light text-[#f8f9fa]">Codici Referral</h1>
                            <p className="text-[#adb5bd] text-sm mt-1">
                                Crea e gestisci codici sconto per i clienti registrati su IWHome.
                            </p>
                        </div>
                        <Button
                            onClick={openForm}
                            className="bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] rounded-full px-6 py-2.5 font-medium flex items-center gap-2 flex-shrink-0"
                        >
                            <Plus size={16} />
                            Nuovo Codice
                        </Button>
                    </div>
                </motion.div>

                {/* ── Feedback ── */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm"
                        >
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span className="flex-1">{error}</span>
                            <button onClick={() => setError('')} className="hover:text-red-300"><X size={14} /></button>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-5 flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm"
                        >
                            <CheckCircle2 size={16} className="flex-shrink-0" />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Create Form ── */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <form
                                onSubmit={handleSubmit}
                                className="bg-[#2c3136] border border-[#f8f9fa]/10 rounded-2xl p-5 sm:p-6"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-[#f8f9fa] font-medium">Crea Nuovo Codice</h2>
                                    <button type="button" onClick={closeForm} className="text-[#6c757d] hover:text-[#adb5bd] transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <Label className="text-[#adb5bd] text-xs mb-1.5 block">Codice *</Label>
                                        <Input
                                            value={form.code}
                                            onChange={e => set('code', e.target.value.toUpperCase())}
                                            placeholder="es. ESTATE25"
                                            className="rounded-xl bg-[#212529] border-[#f8f9fa]/15 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/40 font-mono uppercase"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[#adb5bd] text-xs mb-1.5 block">Sconto % *</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                step="0.5"
                                                value={form.discount_percent}
                                                onChange={e => set('discount_percent', e.target.value)}
                                                placeholder="es. 10"
                                                className="rounded-xl bg-[#212529] border-[#f8f9fa]/15 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/40"
                                            />
                                            <span className="text-[#6c757d] text-xs whitespace-nowrap">%</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-[#adb5bd] text-xs mb-1.5 block">Descrizione</Label>
                                        <Input
                                            value={form.description}
                                            onChange={e => set('description', e.target.value)}
                                            placeholder="es. Sconto estivo per nuovi clienti"
                                            className="rounded-xl bg-[#212529] border-[#f8f9fa]/15 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/40"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[#adb5bd] text-xs mb-1.5 block">Utilizzi massimi <span className="text-[#6c757d]">(opzionale)</span></Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={form.max_uses}
                                            onChange={e => set('max_uses', e.target.value)}
                                            placeholder="Illimitati"
                                            className="rounded-xl bg-[#212529] border-[#f8f9fa]/15 text-[#f8f9fa] placeholder:text-[#6c757d] focus:border-[#f8f9fa]/40"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] rounded-full px-6 font-medium"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-[#212529] border-t-transparent rounded-full" />
                                                Creazione...
                                            </span>
                                        ) : 'Crea Codice'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={closeForm}
                                        className="text-[#adb5bd] hover:text-[#f8f9fa] hover:bg-[#f8f9fa]/10 rounded-full px-6"
                                    >
                                        Annulla
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Codes List ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-[#2c3136] border border-[#f8f9fa]/10 rounded-2xl overflow-hidden"
                >
                    {codes.length === 0 ? (
                        <div className="py-16 text-center">
                            <Tag size={40} className="mx-auto mb-4 text-[#f8f9fa]/20" />
                            <p className="text-[#adb5bd] font-medium">Nessun codice referral</p>
                            <p className="text-[#6c757d] text-sm mt-1">
                                Crea il primo codice con il pulsante in alto.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1.5fr_auto] items-center gap-3 px-5 py-3 border-b border-[#f8f9fa]/10 bg-[#343a40]">
                                <span className="text-[#6c757d] text-xs font-semibold uppercase tracking-wider">Codice</span>
                                <span className="text-[#6c757d] text-xs font-semibold uppercase tracking-wider">Descrizione</span>
                                <span className="text-[#6c757d] text-xs font-semibold uppercase tracking-wider text-center">Sconto</span>
                                <span className="text-[#6c757d] text-xs font-semibold uppercase tracking-wider text-center">Usi</span>
                                <span className="text-[#6c757d] text-xs font-semibold uppercase tracking-wider text-center">Stato</span>
                                <span className="w-8" />
                            </div>

                            {/* Rows */}
                            {codes.map((c, i) => (
                                <motion.div
                                    key={c._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="grid grid-cols-[2fr_3fr_1fr_1fr_1.5fr_auto] items-center gap-3 px-5 py-4 border-b border-[#f8f9fa]/5 last:border-0 hover:bg-[#f8f9fa]/5 transition-colors"
                                >
                                    {/* Code */}
                                    <span className="font-mono text-sm font-bold text-[#f8f9fa] bg-[#212529] px-2.5 py-1 rounded-lg w-fit">
                                        {c.code}
                                    </span>

                                    {/* Description */}
                                    <span className="text-sm text-[#adb5bd] truncate">
                                        {c.description || <span className="text-[#495057]">—</span>}
                                    </span>

                                    {/* Discount */}
                                    <div className="flex justify-center">
                                        <span className="inline-flex items-center gap-1 bg-orange-500/15 text-orange-400 font-semibold px-2.5 py-1 rounded-lg text-xs">
                                            <Percent size={11} />
                                            {c.discount_percent}
                                        </span>
                                    </div>

                                    {/* Uses */}
                                    <div className="flex justify-center">
                                        <span className="inline-flex items-center gap-1 text-xs text-[#adb5bd]">
                                            <Users size={12} className="text-[#6c757d]" />
                                            {c.uses_count}{c.max_uses != null ? `/${c.max_uses}` : ''}
                                        </span>
                                    </div>

                                    {/* Toggle */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => handleToggle(c._id)}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                                        >
                                            {c.is_active ? (
                                                <>
                                                    <ToggleRight size={22} className="text-green-500" />
                                                    <span className="text-green-400">Attivo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft size={22} className="text-[#495057]" />
                                                    <span className="text-[#6c757d]">Inattivo</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(c._id)}
                                        className="p-2 rounded-lg text-[#495057] hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </motion.div>
                            ))}
                        </>
                    )}
                </motion.div>

                {/* ── Info note ── */}
                <p className="text-[#6c757d] text-xs mt-4 leading-relaxed">
                    I codici referral sono applicabili solo da utenti registrati su IWHome. Lo sconto viene associato al profilo utente e visibile all'admin nelle richieste ricevute.
                </p>
            </div>
        </div>
    );
}
