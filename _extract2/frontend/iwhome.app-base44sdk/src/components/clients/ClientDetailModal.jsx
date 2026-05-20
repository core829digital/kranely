import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    User, Mail, Phone, MapPin, Building2, FileText, Briefcase,
    Euro
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ClientDetailModal({ clientId, onClose }) {
    const clientData = useQuery(api.clients.getById, { id: clientId });
    const deleteClientMutation = useMutation(api.clients.deleteClient);
    const [activeTab, setActiveTab] = useState("info");

    if (!clientData) return null;

    const { cantieri, quotes, ...client } = clientData;

    // Financial calculations
    const totalQuotes = quotes?.length || 0;
    const acceptedQuotes = quotes?.filter(q => q.status === 'accepted') || [];
    const totalPotentialValue = quotes?.reduce((sum, q) => sum + (q.estimated_price || 0), 0) || 0;
    const totalConfirmedValue = acceptedQuotes.reduce((sum, q) => sum + (q.estimated_price || 0), 0) || 0;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                {client.full_name}
                                <Badge variant="outline" className={
                                    client.status === 'active' ? 'border-green-500 text-green-400' :
                                        client.status === 'lead' ? 'border-yellow-500 text-yellow-400' :
                                            'border-gray-500 text-gray-400'
                                }>
                                    {client.status}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-[#adb5bd]">
                                Cliente dal {format(new Date(client.created_date || Date.now()), 'dd MMMM yyyy', { locale: it })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="bg-[#212529] border border-[#495057]">
                        <TabsTrigger value="info" className="data-[state=active]:bg-[#343a40] data-[state=active]:text-white">
                            <User size={16} className="mr-2" /> Info
                        </TabsTrigger>
                        <TabsTrigger value="financials" className="data-[state=active]:bg-[#343a40] data-[state=active]:text-white">
                            <Euro size={16} className="mr-2" /> Finanze
                        </TabsTrigger>
                        <TabsTrigger value="projects" className="data-[state=active]:bg-[#343a40] data-[state=active]:text-white">
                            <Briefcase size={16} className="mr-2" /> Cantieri ({cantieri?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="quotes" className="data-[state=active]:bg-[#343a40] data-[state=active]:text-white">
                            <FileText size={16} className="mr-2" /> Preventivi ({quotes?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4 pr-4">
                        {/* INFO TAB */}
                        <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-[#2b3035] border-[#495057]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-[#adb5bd]">Contatti</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-3 text-[#f8f9fa]">
                                            <Mail size={16} className="text-blue-400" />
                                            <span>{client.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[#f8f9fa]">
                                            <Phone size={16} className="text-green-400" />
                                            <span>{client.phone || "N/D"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[#f8f9fa]">
                                            <MapPin size={16} className="text-red-400" />
                                            <span>{client.address || "N/D"}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-[#2b3035] border-[#495057]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-[#adb5bd]">Dettagli Aziendali</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-3 text-[#f8f9fa]">
                                            <Building2 size={16} className="text-purple-400" />
                                            <span>{client.company_name || "Privato"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[#f8f9fa]">
                                            <FileText size={16} className="text-orange-400" />
                                            <span>{client.fiscal_code || "N/D"}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {client.notes && (
                                    <Card className="bg-[#2b3035] border-[#495057] col-span-full">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-[#adb5bd]">Note</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-[#f8f9fa] text-sm">{client.notes}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* FINANCIALS TAB */}
                        <TabsContent value="financials" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-[#2b3035] border-[#495057] bg-gradient-to-br from-green-900/10 to-transparent">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-[#adb5bd]">Valore Confermato</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-400">
                                            € {totalConfirmedValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                        </div>
                                        <p className="text-xs text-[#adb5bd] mt-1">Da {acceptedQuotes.length} preventivi accettati</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-[#2b3035] border-[#495057]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-[#adb5bd]">Valore Potenziale</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-[#f8f9fa]">
                                            € {totalPotentialValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                        </div>
                                        <p className="text-xs text-[#adb5bd] mt-1">Totale di tutti i preventivi</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* PROJECTS TAB */}
                        <TabsContent value="projects">
                            {cantieri && cantieri.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {cantieri.map(c => (
                                        <Card key={c._id} className="bg-[#2b3035] border-[#495057]">
                                            <CardContent className="p-4 flex justify-between items-center">
                                                <div>
                                                    <h4 className="text-[#f8f9fa] font-medium text-lg">{c.nome_cantiere}</h4>
                                                    <p className="text-sm text-[#adb5bd]">{c.indirizzo}</p>
                                                </div>
                                                <Badge variant="outline" className="border-gray-500">{c.status}</Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[#adb5bd]">
                                    Nessun cantiere collegato
                                </div>
                            )}
                        </TabsContent>

                        {/* QUOTES TAB */}
                        <TabsContent value="quotes">
                            {quotes && quotes.length > 0 ? (
                                <div className="space-y-3">
                                    {quotes.map(q => (
                                        <div key={q._id} className="p-3 bg-[#2b3035] rounded-lg border border-[#495057] flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[#f8f9fa] font-medium">Preventivo</span>
                                                    <span className="text-xs text-[#adb5bd]">{format(new Date(q._creationTime), 'dd/MM/yyyy')}</span>
                                                </div>
                                                <p className="text-sm text-blue-400">€ {q.estimated_price?.toLocaleString() || '0'}</p>
                                            </div>
                                            <Badge variant={q.status === 'accepted' ? 'default' : 'secondary'} className="bg-gray-700">
                                                {q.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[#adb5bd]">
                                    Nessun preventivo presente
                                </div>
                            )}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="border-t border-[#495057] pt-4 mt-auto">
                    <Button onClick={onClose} variant="ghost">Chiudi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
