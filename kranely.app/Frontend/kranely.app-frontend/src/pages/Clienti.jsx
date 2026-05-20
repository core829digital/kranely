/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

import {
    Users, UserPlus, Search, Mail, Phone, Building2,
    Edit, Archive, Trash2, AlertCircle, Loader2
} from 'lucide-react';
import ClientDetailModal from '../components/clients/ClientDetailModal';

export default function Clienti() {
    const { user } = useUser();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [detailClient, setDetailClient] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', address: '',
        fiscal_code: '', company_name: '', notes: '',
        client_type: 'b2c', vat_number: ''
    });

    const convexUser = useQuery(api.users.getByEmail, {
        email: user?.primaryEmailAddress?.emailAddress || ""
    });
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';

    const clients = useQuery(api.clients.list, isAdmin ? {} : "skip") || [];
    const registeredUsers = useQuery(api.users.list, isAdmin ? {} : "skip") || [];
    const createClient = useMutation(api.clients.create);
    const updateClient = useMutation(api.clients.update);
    const archiveClient = useMutation(api.clients.archive);
    const unarchiveClient = useMutation(api.clients.unarchive);
    const deleteClient = useMutation(api.clients.deleteClient);

    const syncUsers = useAction(api.syncClerkUsers.manualSync);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncUsers();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    };

    const clientEmails = clients.map(c => c.email);
    const availableUsers = registeredUsers.filter(u => !clientEmails.includes(u.email));

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusFilters = [
        { key: 'active', label: t('clients.active') },
        { key: 'lead', label: t('clients.lead') },
        { key: 'archived', label: t('clients.archived') },
        { key: 'all', label: t('common.all') },
    ];

    const openNewModal = () => {
        setSelectedClient(null);
        setFormData({ full_name: '', email: '', phone: '', address: '', fiscal_code: '', company_name: '', notes: '', client_type: 'b2c', vat_number: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (client) => {
        setSelectedClient(client);
        setFormData({
            full_name: client.full_name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            fiscal_code: client.fiscal_code || '',
            company_name: client.company_name || '',
            notes: client.notes || '',
            client_type: client.client_type || 'b2c',
            vat_number: client.vat_number || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (selectedClient) {
                await updateClient({ id: selectedClient._id, ...formData });
            } else {
                await createClient(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save error:", error.message);
        }
    };

    const handleArchive = async (clientId) => {
        if (confirm(t('clients.delete_client') + '?')) {
            await archiveClient({ id: clientId });
        }
    };

    const handleDelete = async (clientId) => {
        if (confirm(t('clients.delete_client') + '?')) {
            try {
                await deleteClient({ id: clientId });
            } catch (e) {
                console.error(e.message);
            }
        }
    };

    const isAccessDenied = convexUser && convexUser.role !== "admin" && convexUser.role !== "superadmin";

    const statusBadge = (status) => {
        if (status === 'active') return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
        if (status === 'lead') return 'bg-[#FFC703]/15 text-[#FFC703] border border-[#FFC703]/25';
        return 'bg-[#F0EBE8]/10 text-[#F0EBE8]/50 border border-[#F0EBE8]/10';
    };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1C1A18 0%, #232323 60%, #2a2826 100%)' }}>
            <div className="pt-0 relative z-10 min-h-screen pb-safe">
                {convexUser === undefined ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="w-10 h-10 rounded-full border-[3px] border-[#FFC703]/20 border-t-[#FFC703] animate-spin" />
                    </div>
                ) : isAccessDenied ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                            <div className="text-4xl mb-4">ðŸ”’</div>
<h2 className="text-xl text-[#F0EBE8] mb-2">{t('access.denied')}</h2>
                            <p className="text-[#F0EBE8]/50 text-sm">{t('access.no_permission')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
                        >
                            <div>
                                <h1 className="text-3xl font-light text-[#F0EBE8] flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-[#FFC703]/15 border border-[#FFC703]/25">
                                        <Users className="text-[#FFC703]" size={22} />
                                    </div>
                                    {t('clients.title')}
                                </h1>
                                <p className="text-[#F0EBE8]/40 mt-1 text-sm ml-12">
                                    {clients.length} {t('clients.title').toLowerCase()} registered
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="bg-white/5 border-white/10 text-[#F0EBE8]/70 hover:bg-white/10 hover:text-[#F0EBE8] hover:border-white/20"
                                >
                                    <Users size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? t('common.loading') : t('common.sync_clerk')}
                                </Button>
                                <Button
                                    onClick={openNewModal}
                                    className="font-semibold shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)', color: '#1C1A18' }}
                                >
                                    <UserPlus size={16} className="mr-2" /> {t('clients.new_client')}
                                </Button>
                            </div>
                        </motion.div>

                        {/* Filters */}
                        <Card className="mb-6 border-white/10" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0EBE8]/30" size={16} />
                                    <Input
                                        placeholder={t('clients.search')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 bg-white/5 border-white/10 text-[#F0EBE8] placeholder:text-[#F0EBE8]/30 focus:border-[#FFC703]/40"
                                    />
                                </div>
                                <div className="flex gap-1.5">
                                    {statusFilters.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setStatusFilter(key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === key
                                                ? 'bg-[#FFC703]/20 text-[#FFC703] border border-[#FFC703]/30'
                                                : 'text-[#F0EBE8]/40 hover:text-[#F0EBE8]/70 hover:bg-white/5'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.length === 0 ? (
                                <div className="col-span-full text-center py-16 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFC703]/10 flex items-center justify-center">
                                        <Users size={28} className="text-[#FFC703]/60" />
                                    </div>
                                    <h3 className="text-lg text-[#F0EBE8]/60">{t('clients.no_clients')}</h3>
                                    <button
                                        onClick={openNewModal}
                                        className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-[#1C1A18]"
                                        style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}
                                    >
                                        {t('clients.add_client')}
                                    </button>
                                </div>
                            ) : (
                                filteredClients.map((client, idx) => (
                                    <motion.div
                                        key={client._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                    >
                                        <Card
                                            className="border-white/10 hover:border-[#FFC703]/30 transition-all cursor-pointer group hover:shadow-lg hover:shadow-[#FFC703]/5"
                                            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
                                            onClick={() => setDetailClient(client._id)}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-base text-[#F0EBE8] truncate group-hover:text-[#FFC703] transition-colors">
                                                            {client.full_name}
                                                        </CardTitle>
                                                        <CardDescription className="text-[#F0EBE8]/40 text-xs flex items-center gap-1 mt-0.5">
                                                            <Mail size={11} /> {client.email}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-end ml-2">
                                                        <Badge className={`text-[10px] font-semibold ${statusBadge(client.status)}`}>
                                                            {client.status === 'active' ? t('clients.active') :
                                                             client.status === 'lead' ? t('clients.lead') :
                                                             t('clients.archived')}
                                                        </Badge>
                                                        <Badge className={`text-[9px] font-bold ${
                                                            client.client_type === 'b2b'
                                                                ? 'bg-[#FFC703]/10 text-[#FFC703] border border-[#FFC703]/20'
                                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {client.client_type === 'b2b' ? 'B2B' : 'B2C'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-2 space-y-1.5 text-xs text-[#F0EBE8]/40">
                                                {client.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={11} /> {client.phone}
                                                    </div>
                                                )}
                                                {client.company_name && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={11} /> {client.company_name}
                                                    </div>
                                                )}
                                                <div className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#F0EBE8]/50 hover:text-[#FFC703] hover:bg-[#FFC703]/10 transition-all text-xs"
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(client); }}
                                                    >
                                                        <Edit size={11} /> {t('common.edit')}
                                                    </button>
                                                    {client.status === 'archived' ? (
                                                        <button
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                unarchiveClient({ id: client._id });
                                                            }}
                                                        >
                                                            <Archive size={11} /> {t('common.restore')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
                                                            onClick={(e) => { e.stopPropagation(); handleArchive(client._id); }}
                                                        >
                                                            <Archive size={11} /> {t('common.archive')}
                                                        </button>
                                                    )}
                                                    {client.status === 'archived' && (
                                                        <button
                                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-red-600 hover:bg-red-500/10 transition-all text-xs"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }}
                                                        >
                                                            <Trash2 size={11} /> {t('common.delete')}
                                                        </button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Client Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="border-white/10 text-[#F0EBE8] max-w-lg" style={{ background: '#232323' }}>
                        <DialogHeader>
                            <DialogTitle className="text-[#F0EBE8]">
                                {selectedClient ? t('clients.edit_client') : t('clients.new_client')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.full_name')} *</Label>
                                    <Input value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.email')} *</Label>
                                    {selectedClient ? (
                                        <Input type="email" value={formData.email} disabled
                                            className="bg-white/5 border-white/10 opacity-50" />
                                    ) : (
                                        <>
                                            <Select
                                                value={formData.email}
                                                onValueChange={(email) => {
                                                    const selectedUser = registeredUsers.find(u => u.email === email);
                                                    setFormData({
                                                        ...formData,
                                                        email: email,
                                                        full_name: selectedUser?.fullName || formData.full_name
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10">
                                                    <SelectValue placeholder={t('clients.select')} />
                                                </SelectTrigger>
                                                <SelectContent className="border-white/10" style={{ background: '#2d2d2d' }}>
                                                    {availableUsers.length === 0 ? (
                                                        <div className="p-2 text-[#F0EBE8]/40 text-sm">{t('common.no_users')}</div>
                                                    ) : (
                                                        availableUsers.map(u => (
                                                            <SelectItem key={u.email} value={u.email} className="text-[#F0EBE8]">
                                                                {u.fullName || u.email}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {formData.email && (
                                                <p className="text-xs text-[#FFC703]/60 flex items-center gap-1">
                                                    <AlertCircle size={11} />
                                                    {t('common.will_be_promoted')}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.phone')}</Label>
                                    <Input value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.fiscal_code')}</Label>
                                    <Input value={formData.fiscal_code}
                                        onChange={(e) => setFormData({ ...formData, fiscal_code: e.target.value })}
                                        className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.type')}</Label>
                                    <Select value={formData.client_type} onValueChange={v => setFormData({ ...formData, client_type: v, vat_number: v === 'b2c' ? '' : formData.vat_number })}>
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-white/10" style={{ background: '#2d2d2d' }}>
                                            <SelectItem value="b2c" className="text-[#F0EBE8]">{t('clients.b2c')}</SelectItem>
                                            <SelectItem value="b2b" className="text-[#F0EBE8]">{t('clients.b2b')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.client_type === 'b2b' && (
                                    <div className="space-y-2">
                                        <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.vat_number')}</Label>
                                        <Input value={formData.vat_number}
                                            onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                                            placeholder="IT12345678901"
                                            className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.company')}</Label>
                                <Input value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.address')}</Label>
                                <Input value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#F0EBE8]/60 text-xs">{t('clients.notes')}</Label>
                                <Input value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="bg-white/5 border-white/10 text-[#F0EBE8] focus:border-[#FFC703]/40" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[#F0EBE8]/50 hover:text-[#F0EBE8]">
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="font-semibold text-[#1C1A18]"
                                style={{ background: 'linear-gradient(135deg, #FFC703 0%, #e6b200 100%)' }}
                            >
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Client Detail Modal */}
                {detailClient && (
                    <ClientDetailModal
                        clientId={detailClient}
                        onClose={() => setDetailClient(null)}
                    />
                )}
            </div>
        </div>
    );
}


