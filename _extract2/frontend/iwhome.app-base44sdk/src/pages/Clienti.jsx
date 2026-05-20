/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
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
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null); // For Edit
    const [detailClient, setDetailClient] = useState(null); // For Details View
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
    const registeredUsers = useQuery(api.users.list, isAdmin ? {} : "skip") || []; // All registered users
    const createClient = useMutation(api.clients.create);
    const updateClient = useMutation(api.clients.update);
    const archiveClient = useMutation(api.clients.archive);
    const unarchiveClient = useMutation(api.clients.unarchive);
    const deleteClient = useMutation(api.clients.deleteClient);

    // Add manual sync action
    const syncUsers = useAction(api.syncClerkUsers.manualSync);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncUsers();
            // Optional: Refetch or invalidate queries if needed, but Convex creates real-time updates automatically
        } catch (e) {
            console.error(e);
            alert("Errore sincronizzazione: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // Get users who are not already clients (for dropdown)
    const clientEmails = clients.map(c => c.email);
    const availableUsers = registeredUsers.filter(u => !clientEmails.includes(u.email));

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
            alert("Errore: " + error.message);
        }
    };

    const handleArchive = async (clientId) => {
        if (confirm("Archiviare questo cliente?")) {
            await archiveClient({ id: clientId });
        }
    };

    const handleDelete = async (clientId) => {
        if (confirm("Eliminare DEFINITIVAMENTE questo cliente? L'operazione non può essere annullata.")) {
            try {
                await deleteClient({ id: clientId });
            } catch (e) {
                alert("Errore: " + e.message);
            }
        }
    };

    // Check admin access — render inline with layout to prevent flash
    const isAccessDenied = convexUser && convexUser.role !== "admin" && convexUser.role !== "superadmin";

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            
            

            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                {convexUser === undefined ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : isAccessDenied ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center">
                            <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2>
                            <p className="text-[#adb5bd]">Solo gli amministratori possono accedere a questa pagina.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-light text-[#f8f9fa] flex items-center gap-3">
                                    <Users className="text-blue-400" /> Gestione Clienti
                                </h1>
                                <p className="text-[#adb5bd] mt-1">{clients.length} clienti registrati</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="bg-[#343a40] border-[#495057] text-[#f8f9fa] hover:bg-[#495057] hover:text-white"
                                >
                                    <Users size={18} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Sincronizzazione...' : 'Sincronizza da Clerk'}
                                </Button>
                                <Button onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <UserPlus size={18} className="mr-2" /> Nuovo Cliente
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                    <Input
                                        placeholder="Cerca per nome o email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {['active', 'lead', 'archived', 'all'].map(status => (
                                        <Button
                                            key={status}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStatusFilter(status)}
                                            className={statusFilter === status
                                                ? "bg-blue-600/20 text-blue-400"
                                                : "text-[#adb5bd]"}
                                        >
                                            {status === 'all' ? 'Tutti' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.length === 0 ? (
                                <div className="col-span-full text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <Users size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun cliente trovato</h3>
                                    <p className="text-[#adb5bd] mt-2">Registra il primo cliente per iniziare.</p>
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <motion.div
                                        key={client._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-blue-500/50 transition-all cursor-pointer group"
                                            onClick={() => setDetailClient(client._id)}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg text-[#f8f9fa]">{client.full_name}</CardTitle>
                                                        <CardDescription className="text-[#adb5bd] text-sm flex items-center gap-1 mt-1">
                                                            <Mail size={14} /> {client.email}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <Badge variant="secondary" className={
                                                            client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                                client.status === 'lead' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                        }>
                                                            {client.status}
                                                        </Badge>
                                                        <Badge variant="outline" className={`text-[10px] ${client.client_type === 'b2b' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                                                            {client.client_type === 'b2b' ? 'B2B' : 'B2C'}
                                                        </Badge>
                                                        {!registeredUsers.some(u => u.email === client.email && u.role === 'client') && (
                                                            <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30">
                                                                Manuale
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-2 space-y-2 text-sm text-[#adb5bd]">
                                                {client.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} /> {client.phone}
                                                    </div>
                                                )}
                                                {client.company_name && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={14} /> {client.company_name}
                                                    </div>
                                                )}
                                                <div className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" className="text-[#adb5bd] hover:text-white"
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(client); }}>
                                                        <Edit size={14} className="mr-1" /> Modifica
                                                    </Button>
                                                    {client.status === 'archived' ? (
                                                        <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm("Ripristinare questo cliente?")) {
                                                                    unarchiveClient({ id: client._id });
                                                                }
                                                            }}>
                                                            <Archive size={14} className="mr-1" /> Ripristina
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300"
                                                            onClick={(e) => { e.stopPropagation(); handleArchive(client._id); }}>
                                                            <Archive size={14} className="mr-1" /> Archivia
                                                        </Button>
                                                    )}
                                                    {client.status === 'archived' && (
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }}>
                                                            <Trash2 size={14} className="mr-1" /> Elimina
                                                        </Button>
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
                    <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{selectedClient ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome Completo *</Label>
                                    <Input value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="bg-[#495057] border-[#6c757d]" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Utente Registrato *</Label>
                                    {selectedClient ? (
                                        // In edit mode, just show the email (can't change)
                                        <Input type="email" value={formData.email} disabled
                                            className="bg-[#495057] border-[#6c757d] opacity-70" />
                                    ) : (
                                        // In create mode, show dropdown of available users
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
                                                <SelectTrigger className="bg-[#495057] border-[#6c757d]">
                                                    <SelectValue placeholder="Seleziona utente..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#495057] border-[#6c757d]">
                                                    {availableUsers.length === 0 ? (
                                                        <div className="p-2 text-[#adb5bd] text-sm">Nessun utente disponibile</div>
                                                    ) : (
                                                        availableUsers.map(u => (
                                                            <SelectItem key={u.email} value={u.email}>
                                                                {u.fullName || u.email} ({u.role})
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-[#adb5bd] flex items-center gap-1">
                                                <AlertCircle size={12} />
                                                Il cliente deve essere collegato a un account registrato
                                            </p>
                                        </>
                                    )}
                                    {formData.email && !selectedClient && (
                                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                            <p className="text-xs text-blue-300 flex items-start gap-2">
                                                <AlertCircle size={14} className="mt-0.5" />
                                                <span>
                                                    Se l'utente selezionato ha il ruolo "User", verrà automaticamente promosso a "Client" e riceverà accesso all'area riservata.
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Telefono</Label>
                                    <Input value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-[#495057] border-[#6c757d]" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Codice Fiscale / P.IVA</Label>
                                    <Input value={formData.fiscal_code}
                                        onChange={(e) => setFormData({ ...formData, fiscal_code: e.target.value })}
                                        className="bg-[#495057] border-[#6c757d]" />
                                </div>
                            </div>
                            {/* Tipo Cliente B2B / B2C */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo Cliente</Label>
                                    <Select value={formData.client_type} onValueChange={v => setFormData({ ...formData, client_type: v, vat_number: v === 'b2c' ? '' : formData.vat_number })}>
                                        <SelectTrigger className="bg-[#495057] border-[#6c757d]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#495057] border-[#6c757d]">
                                            <SelectItem value="b2c">B2C — Privato</SelectItem>
                                            <SelectItem value="b2b">B2B — Azienda</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.client_type === 'b2b' && (
                                    <div className="space-y-2">
                                        <Label>Partita IVA</Label>
                                        <Input value={formData.vat_number}
                                            onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                                            placeholder="IT12345678901"
                                            className="bg-[#495057] border-[#6c757d]" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Nome Azienda</Label>
                                <Input value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="bg-[#495057] border-[#6c757d]" />
                            </div>
                            <div className="space-y-2">
                                <Label>Indirizzo</Label>
                                <Input value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-[#495057] border-[#6c757d]" />
                            </div>
                            <div className="space-y-2">
                                <Label>Note</Label>
                                <Input value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="bg-[#495057] border-[#6c757d]" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Salva</Button>
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
