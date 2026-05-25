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

    // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    if (isLoading) {
        return (
            <div className="pt-0 min-h-screen bg-[#1C1A18] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/ border-t-[#F0EBE8] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="pt-0 min-h-screen bg-[#1C1A18] flex items-center justify-center">
                <div className="text-center p-8 bg-[#1C1A18]/ border border-red-500/30 rounded-2xl max-w-sm">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <h2 className="text-white text-lg font-medium mb-2">Access denied</h2>
                    <p className="text-white/40 text-sm">Solo gli amministratori possono gestire i codici referral.</p>
                </div>
            </div>
        );
    }

    // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        if (!confirm('Deletere questo codice? L\'azione non è reversibile.')) return;
        try { await removeCode({ id }); }
        catch (err) { setError(err.message || 'Errore.'); }
    };

    const openForm = () => { setShowForm(true); setError(''); setSuccess(''); };
    const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); setError(''); };

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return (
        <div className="pt-0 min-h-screen bg-[#1C1A18]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* â”€â”€ Page Header â”€â”€ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-light text-white">Referral Codes</h1>
                            <p className="text-white/40 text-sm mt-1">
                                Crea e gestisci codici sconto per i clienti registrati su Kranely.
                            </p>
                        </div>
                        <Button
                            onClick={openForm}
                            className="bg-[#F0EBE8] text-[#141210] hover:bg-white/10 rounded-full px-6 py-2.5 font-medium flex items-center gap-2 flex-shrink-0"
                        >
                            <Plus size={16} />
                            New Code
                        </Button>
                    </div>
                </motion.div>

                {/* â”€â”€ Feedback â”€â”€ */}
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

                {/* â”€â”€ Create Form â”€â”€ */}
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
                                className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-white font-medium">Create New Code</h2>
                                    <button type="button" onClick={closeForm} className="text-white/25 hover:text-white/40 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <Label className="text-white/40 text-xs mb-1.5 block">Codice *</Label>
                                        <Input
                                            value={form.code}
                                            onChange={e => set('code', e.target.value.toUpperCase())}
                                            placeholder="es. ESTATE25"
                                            className="rounded-xl bg-[#141210] border-white/ text-white placeholder:text-white/25 focus:border-white/ font-mono uppercase"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white/40 text-xs mb-1.5 block">Sconto % *</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                step="0.5"
                                                value={form.discount_percent}
                                                onChange={e => set('discount_percent', e.target.value)}
                                                placeholder="es. 10"
                                                className="rounded-xl bg-[#141210] border-white/ text-white placeholder:text-white/25 focus:border-white/"
                                            />
                                            <span className="text-white/25 text-xs whitespace-nowrap">%</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label className="text-white/40 text-xs mb-1.5 block">Description</Label>
                                        <Input
                                            value={form.description}
                                            onChange={e => set('description', e.target.value)}
                                            placeholder="es. Sconto estivo per nuovi clienti"
                                            className="rounded-xl bg-[#141210] border-white/ text-white placeholder:text-white/25 focus:border-white/"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white/40 text-xs mb-1.5 block">Maximum uses <span className="text-white/25">(optional)</span></Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={form.max_uses}
                                            onChange={e => set('max_uses', e.target.value)}
                                            placeholder="Illimitati"
                                            className="rounded-xl bg-[#141210] border-white/ text-white placeholder:text-white/25 focus:border-white/"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#F0EBE8] text-[#141210] hover:bg-white/10 rounded-full px-6 font-medium"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-[#141210] border-t-transparent rounded-full" />
                                                Creazione...
                                            </span>
                                        ) : 'Crea Codice'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={closeForm}
                                        className="text-white/40 hover:text-white hover:bg-white/ rounded-full px-6"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* â”€â”€ Codes List â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                >
                    {codes.length === 0 ? (
                        <div className="py-16 text-center">
                            <Tag size={40} className="mx-auto mb-4 text-white/20" />
                            <p className="text-white/40 font-medium">No referral codes</p>
                            <p className="text-white/25 text-sm mt-1">
                                Crea il primo codice con il pulsante in alto.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1.5fr_auto] items-center gap-3 px-5 py-3 border-b border-white/ bg-[#1C1A18]">
                                <span className="text-white/25 text-xs font-semibold uppercase tracking-wider">Codice</span>
                                <span className="text-white/25 text-xs font-semibold uppercase tracking-wider">Description</span>
                                <span className="text-white/25 text-xs font-semibold uppercase tracking-wider text-center">Sconto</span>
                                <span className="text-white/25 text-xs font-semibold uppercase tracking-wider text-center">Usi</span>
                                <span className="text-white/25 text-xs font-semibold uppercase tracking-wider text-center">Stato</span>
                                <span className="w-8" />
                            </div>

                            {/* Rows */}
                            {codes.map((c, i) => (
                                <motion.div
                                    key={c._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="grid grid-cols-[2fr_3fr_1fr_1fr_1.5fr_auto] items-center gap-3 px-5 py-4 border-b border-white/ last:border-0 hover:bg-white/ transition-colors"
                                >
                                    {/* Code */}
                                    <span className="font-mono text-sm font-bold text-white bg-[#141210] px-2.5 py-1 rounded-lg w-fit">
                                        {c.code}
                                    </span>

                                    {/* Description */}
                                    <span className="text-sm text-white/40 truncate">
                                        {c.description || <span className="text-[#535252]">"”</span>}
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
                                        <span className="inline-flex items-center gap-1 text-xs text-white/40">
                                            <Users size={12} className="text-white/25" />
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
                                                    <span className="text-green-400">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft size={22} className="text-[#535252]" />
                                                    <span className="text-white/25">Inattivo</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(c._id)}
                                        className="p-2 rounded-lg text-[#535252] hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </motion.div>
                            ))}
                        </>
                    )}
                </motion.div>

                {/* â”€â”€ Info note â”€â”€ */}
                <p className="text-white/25 text-xs mt-4 leading-relaxed">
                    I codici referral sono applicabili solo da utenti registrati su Kranely. Lo sconto viene associato al profilo utente e visibile all'admin nelle richieste ricevute.
                </p>
            </div>
        </div>
    );
}



