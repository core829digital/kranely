/// <reference types="vite/client" />
import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import {
    Search,
    User,
    FileText,
    Upload,
    ChevronRight,
    Shield,
    Eye,
    Trash2,
    Ban,
    CheckCircle,
    AlertTriangle,
    UserCog,
    Users,
    RefreshCw,
    Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';

export default function Admin() {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);

    // Queries
    const allUsers = useQuery(api.users.list) || [];
    const convexUser = useQuery(api.users.getByEmail, user?.primaryEmailAddress?.emailAddress ? { email: user.primaryEmailAddress.emailAddress } : "skip");

    // Derive selectedUser reactively from allUsers so UI always reflects latest DB state
    const selectedUser = allUsers.find(u => u._id === selectedUserId) || null;

    const selectedUserDocs = useQuery(api.documents.getByUser, selectedUser ? { email: selectedUser.email } : "skip") || [];
    const selectedUserQuotes = useQuery(api.quotes.getByUser, selectedUser ? { email: selectedUser.email } : "skip") || [];

    // Mutations
    const createDocument = useMutation(api.documents.create);
    const deleteDocument = useMutation(api.documents.deleteDocument);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const updateRoleMutation = useMutation(api.users.updateRole);
    const blockUserMutation = useMutation(api.users.blockUser);
    const deleteUserMutation = useMutation(api.users.deleteUser);
    const runMigration = useMutation(api.migrate.runMigration);

    const [migrationResult, setMigrationResult] = useState(null);
    const [migrationRunning, setMigrationRunning] = useState(false);

    const handleRunMigration = async () => {
        if (!window.confirm('Esegui migrazione dati? L\'operazione è sicura e non elimina nulla. Continuare?')) return;
        setMigrationRunning(true);
        setMigrationResult(null);
        try {
            const result = await runMigration({});
            setMigrationResult(result);
        } catch (err) {
            alert('Errore migrazione: ' + (err.message || err));
        } finally {
            setMigrationRunning(false);
        }
    };

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: 'altro',
        file: null
    });
    const [isUploading, setIsUploading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [viewPdfUrl, setViewPdfUrl] = useState(null);

    // Admin action handlers
    const handleRoleChange = async (userId, newRole) => {
        setActionLoading(true);
        try {
            await updateRoleMutation({ userId, role: newRole });
        } catch (error) {
            alert(error.message || 'Errore nel cambio ruolo');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlockToggle = async (userId, currentlyBlocked) => {
        setActionLoading(true);
        try {
            await blockUserMutation({
                userId,
                blocked: !currentlyBlocked,
                reason: !currentlyBlocked ? (blockReason || undefined) : undefined,
            });
            setBlockReason('');
        } catch (error) {
            alert(error.message || 'Errore nel blocco utente');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        setActionLoading(true);
        try {
            await deleteUserMutation({ userId });
            setSelectedUserId(null);
            setDeleteConfirmOpen(false);
        } catch (error) {
            alert(error.message || 'Errore eliminazione utente');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter Users
    const filteredUsers = allUsers.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats for Selected User
    const calculateSpending = (quotes) => {
        return quotes
            .filter(q => q.status === 'accepted' && q.estimated_price)
            .reduce((acc, curr) => acc + curr.estimated_price, 0);
    };

    const handleUpload = async () => {
        if (!uploadData.file || !uploadData.title || !selectedUser) return;
        setIsUploading(true);

        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": uploadData.file.type },
                body: uploadData.file,
            });

            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();
            const storageUrl = `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;

            await createDocument({
                title: uploadData.title,
                description: uploadData.description,
                category: uploadData.category,
                file_url: storageUrl,
                file_name: uploadData.file.name,
                file_type: uploadData.file.type,
                file_size: uploadData.file.size,
                created_by: selectedUser.email, // Upload AS selected user so they see it
                created_date: new Date().toISOString()
            });

            setUploadModalOpen(false);
            setUploadData({ title: '', description: '', category: 'altro', file: null });

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Errore upload");
        } finally {
            setIsUploading(false);
        }
    };

    // Access Control (Simple client-side for now, should be backend verified)
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';

    if (convexUser === undefined) return <div className="min-h-screen grid place-items-center bg-[#212529] text-white">Caricamento...</div>;

    // If null, user not found in Convex
    if (convexUser === null) return <div className="min-h-screen grid place-items-center bg-[#212529] text-white">Utente non trovato nel database. Assicurati di essere registrato.</div>;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden flex items-center justify-center">
                
                <div className="text-center p-8 bg-[#343a40]/50 backdrop-blur-xl rounded-2xl border border-[#f8f9fa]/20">
                    <Shield size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-[#f8f9fa]">Accesso Negato</h1>
                    <p className="text-[#dee2e6] mt-2">Area riservata agli amministratori.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            
            
            <UniversalPdfViewer
                isOpen={!!viewPdfUrl}
                onClose={() => setViewPdfUrl(null)}
                url={viewPdfUrl}
                title="Visualizzazione Documento Admin"
            />

            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2">Pannello Admin</h1>
                            <p className="text-[#dee2e6]">Gestione utenti, ruoli e documenti</p>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="px-3 py-1.5 rounded-lg bg-[#495057]/40 border border-[#f8f9fa]/10 text-xs text-[#dee2e6] flex items-center gap-2">
                                <Users size={14} /> {allUsers.length} utenti
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                                <Ban size={14} /> {allUsers.filter(u => u.blocked).length} bloccati
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRunMigration}
                                disabled={migrationRunning}
                                className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs h-8"
                            >
                                {migrationRunning
                                    ? <><RefreshCw size={13} className="mr-1.5 animate-spin" />Migrazione...</>
                                    : <><Database size={13} className="mr-1.5" />Migra Dati</>
                                }
                            </Button>
                        </div>
                        {migrationResult && (
                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400">
                                <p className="font-semibold mb-1">✓ Migrazione completata — {migrationResult.total} record aggiornati</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-green-300/80">
                                    <span>Utenti: {migrationResult.users}</span>
                                    <span>Preventivi: {migrationResult.quotes}</span>
                                    <span>Pagamenti: {migrationResult.payments}</span>
                                    <span>Richieste: {migrationResult.supplier_requests}</span>
                                    <span>Ordini: {migrationResult.supplier_orders}</span>
                                    <span>Clienti: {migrationResult.clients}</span>
                                    <span>Collaboratori: {migrationResult.collaborators}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* User List */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 h-[calc(100vh-200px)] flex flex-col">
                                <CardHeader className="p-4 border-b border-[#f8f9fa]/10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={16} />
                                        <Input
                                            placeholder="Cerca utente..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 bg-[#495057]/30 border-[#f8f9fa]/20 text-[#f8f9fa]"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-y-auto">
                                    {filteredUsers.map(u => (
                                        <div
                                            key={u._id}
                                            onClick={() => setSelectedUserId(u._id)}
                                            className={`p-4 border-b border-[#f8f9fa]/5 cursor-pointer hover:bg-[#f8f9fa]/5 transition-colors ${selectedUserId === u._id ? 'bg-[#f8f9fa]/10 border-l-4 border-l-blue-500' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${u.blocked ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                                                    {u.blocked ? <Ban size={16} /> : (u.fullName?.[0] || u.email[0].toUpperCase())}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className={`font-medium truncate ${u.blocked ? 'text-red-300 line-through' : 'text-[#f8f9fa]'}`}>{u.fullName || 'Utente'}</h4>
                                                    <p className="text-xs text-[#adb5bd] truncate">{u.email}</p>
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {u.role && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded inline-block">{u.role.toUpperCase()}</span>}
                                                        {u.blocked && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded inline-block">BLOCCATO</span>}
                                                    </div>
                                                </div>
                                                <ChevronRight className="ml-auto text-[#adb5bd] flex-shrink-0" size={16} />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* User Details */}
                        <div className="lg:col-span-2">
                            {selectedUser ? (
                                <div className="space-y-6">
                                    {/* Stats Card */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Card className="bg-gradient-to-br from-blue-600/80 to-blue-800/80 border-0 shadow-lg">
                                            <CardContent className="p-6">
                                                <p className="text-blue-100 text-sm font-medium">Spesa Totale (Preventivi Accettati)</p>
                                                <h3 className="text-3xl font-light text-white mt-2">
                                                    € {calculateSpending(selectedUserQuotes).toLocaleString()}
                                                </h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-purple-600/80 to-purple-800/80 border-0 shadow-lg">
                                            <CardContent className="p-6">
                                                <p className="text-purple-100 text-sm font-medium">Documenti Totali</p>
                                                <h3 className="text-3xl font-light text-white mt-2">
                                                    {selectedUserDocs.length}
                                                </h3>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* User Management Controls */}
                                    <Card className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20">
                                        <CardHeader className="p-6 pb-2">
                                            <CardTitle className="text-[#f8f9fa] flex items-center gap-2">
                                                <UserCog size={20} />
                                                Gestione Utente
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-5">
                                            {/* Role Management */}
                                            <div className="space-y-2">
                                                <Label className="text-[#dee2e6] text-sm">Ruolo Utente</Label>
                                                <div className="flex gap-3">
                                                    <Select
                                                        value={selectedUser.role || 'client'}
                                                        onValueChange={(v) => handleRoleChange(selectedUser._id, v)}
                                                        disabled={actionLoading || selectedUser.role === 'superadmin'}
                                                    >
                                                        <SelectTrigger className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa] flex-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                                                            <SelectItem value="client">Cliente</SelectItem>
                                                            <SelectItem value="supplier">Fornitore</SelectItem>
                                                            <SelectItem value="collaborator">Collaboratore</SelectItem>
                                                            <div className="px-2 py-1.5 text-[10px] text-[#6c757d] font-semibold uppercase tracking-wider border-t border-[#f8f9fa]/10 mt-1 pt-2">— Ruoli Speciali —</div>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Block / Unblock */}
                                            <div className="space-y-2">
                                                <Label className="text-[#dee2e6] text-sm">Accesso Utente</Label>
                                                {selectedUser.role !== 'admin' && selectedUser.role !== 'superadmin' ? (
                                                    <div className="space-y-3">
                                                        {!selectedUser.blocked && (
                                                            <Input
                                                                placeholder="Motivo blocco (opzionale)..."
                                                                value={blockReason}
                                                                onChange={(e) => setBlockReason(e.target.value)}
                                                                className="bg-[#495057]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                                                            />
                                                        )}
                                                        <Button
                                                            onClick={() => handleBlockToggle(selectedUser._id, selectedUser.blocked)}
                                                            disabled={actionLoading}
                                                            className={selectedUser.blocked
                                                                ? 'w-full bg-green-600 hover:bg-green-700 text-white'
                                                                : 'w-full bg-orange-600 hover:bg-orange-700 text-white'
                                                            }
                                                        >
                                                            {selectedUser.blocked ? (
                                                                <><CheckCircle size={16} className="mr-2" /> Sblocca Utente</>
                                                            ) : (
                                                                <><Ban size={16} className="mr-2" /> Blocca Utente</>
                                                            )}
                                                        </Button>
                                                        {selectedUser.blocked && selectedUser.blocked_reason && (
                                                            <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                                                                <AlertTriangle size={12} className="inline mr-1" />
                                                                Motivo: {selectedUser.blocked_reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-[#adb5bd] italic">Gli amministratori non possono essere bloccati.</p>
                                                )}
                                            </div>

                                            {/* Delete User */}
                                            <div className="pt-4 border-t border-[#f8f9fa]/10">
                                                <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            className="w-full bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-red-300"
                                                            disabled={selectedUser.role === 'admin' || selectedUser.role === 'superadmin'}
                                                        >
                                                            <Trash2 size={16} className="mr-2" />
                                                            Elimina Account
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2 text-red-400">
                                                                <AlertTriangle size={20} />
                                                                Conferma Eliminazione
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="py-4 space-y-4">
                                                            <p className="text-[#dee2e6]">
                                                                Stai per eliminare l'account di <strong className="text-[#f8f9fa]">{selectedUser.fullName || selectedUser.email}</strong>.
                                                            </p>
                                                            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                                                                ⚠️ Questa azione è irreversibile. Tutti i dati dell'utente verranno eliminati.
                                                            </p>
                                                            <div className="flex gap-3">
                                                                <Button
                                                                    variant="outline"
                                                                    className="flex-1 border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                                                                    onClick={() => setDeleteConfirmOpen(false)}
                                                                >
                                                                    Annulla
                                                                </Button>
                                                                <Button
                                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                                    onClick={() => handleDeleteUser(selectedUser._id)}
                                                                    disabled={actionLoading}
                                                                >
                                                                    {actionLoading ? 'Eliminazione...' : 'Elimina Definitivamente'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Documents Manager */}
                                    <Card className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20">
                                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                                            <CardTitle className="text-[#f8f9fa] flex items-center gap-2">
                                                <FileText size={20} />
                                                Documenti Utente
                                            </CardTitle>
                                            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]">
                                                        <Upload size={16} className="mr-2" />
                                                        Carica
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                                                    <DialogHeader>
                                                        <DialogTitle>Carica Documento per {selectedUser.fullName}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label>Titolo</Label>
                                                            <Input
                                                                value={uploadData.title}
                                                                onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                                                                className="bg-[#495057]/50 border-[#f8f9fa]/20"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Categoria</Label>
                                                            <Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })}>
                                                                <SelectTrigger className="bg-[#495057]/50 border-[#f8f9fa]/20">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa]">
                                                                    <SelectItem value="preventivo">Preventivo</SelectItem>
                                                                    <SelectItem value="contratto">Contratto</SelectItem>
                                                                    <SelectItem value="fattura">Fattura</SelectItem>
                                                                    <SelectItem value="progetto">Progetto</SelectItem>
                                                                    <SelectItem value="altro">Altro</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>File</Label>
                                                            <Input
                                                                type="file"
                                                                onChange={e => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                                                className="bg-[#495057]/50 border-[#f8f9fa]/20"
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={handleUpload}
                                                            disabled={isUploading || !uploadData.file || !uploadData.title}
                                                            className="w-full bg-[#f8f9fa] text-black hover:bg-[#e9ecef]"
                                                        >
                                                            {isUploading ? 'Caricamento...' : 'Carica'}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {selectedUserDocs.length === 0 ? (
                                                <div className="text-center py-8 text-[#adb5bd]">Nessun documento</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {selectedUserDocs.map(doc => (
                                                        <div key={doc._id} className="flex items-center justify-between p-3 bg-[#495057]/30 rounded-lg border border-[#f8f9fa]/10">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-lg bg-[#f8f9fa]/10 flex items-center justify-center flex-shrink-0">
                                                                    <FileText size={18} className="text-[#f8f9fa]" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-medium text-[#f8f9fa] truncate">{doc.title}</h4>
                                                                    <p className="text-xs text-[#adb5bd]">{doc.category} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button size="icon" variant="ghost" className="hover:bg-[#f8f9fa]/10" onClick={() => {
                                                                    if (doc.file_type === 'application/pdf' || doc.file_name?.toLowerCase().endsWith('.pdf') || doc.category === 'preventivo' || doc.category === 'contratto') {
                                                                        setViewPdfUrl(doc.file_url)
                                                                    } else {
                                                                        window.open(doc.file_url, '_blank')
                                                                    }
                                                                }}>
                                                                    <Eye size={16} className="text-[#f8f9fa]" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="hover:bg-red-500/10" onClick={() => deleteDocument({ id: doc._id })}>
                                                                    <Trash2 size={16} className="text-red-400" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#adb5bd] bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl">
                                    <User size={64} className="opacity-20 mb-4" />
                                    <p className="text-lg">Seleziona un utente</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
