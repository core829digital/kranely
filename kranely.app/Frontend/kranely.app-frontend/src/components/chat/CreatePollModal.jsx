import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel
} from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, FileText, File } from 'lucide-react';

export default function CreatePollModal({ isOpen, onClose, conversationId, clientEmail }) {
    const createPoll = useMutation(api.quote_polls.createPoll);
    const clientQuotes = useQuery(api.quotes.getByUser, { email: clientEmail }) || [];
    const clientDocs = useQuery(api.documents.getByUser, { email: clientEmail }) || [];
    const myDocs = useQuery(api.documents.get) || [];

    // Filter for only 'preventivo' category documents or potentially contracts
    // Show both client-specific docs and admin's own uploaded docs (to share)
    const preventiviDocs = [...clientDocs, ...myDocs].filter(
        (doc, index, self) =>
            doc.category === 'preventivo' &&
            self.findIndex(d => d._id === doc._id) === index // De-duplicate
    );

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState(['Accetto', 'Rifiuto', 'Controproposta']);
    const [linkedItemId, setLinkedItemId] = useState('none'); // Combined ID: "type:id"
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async () => {
        if (!title.trim() || options.some(o => !o.trim())) return;
        setIsSubmitting(true);

        try {
            let quote_id = undefined;
            let document_id = undefined;

            if (linkedItemId !== 'none') {
                const [type, id] = linkedItemId.split(':');
                if (type === 'quote') quote_id = id;
                if (type === 'doc') document_id = id;
            }

            const pollData = {
                conversation_id: conversationId,
                title,
                description,
                options: options.filter(o => o.trim()),
            };
            if (quote_id) pollData['quote_id'] = quote_id;
            if (document_id) pollData['document_id'] = document_id;

            await createPoll(pollData);
            onClose();
            setTitle('');
            setDescription('');
            setOptions(['Accetto', 'Rifiuto', 'Controproposta']);
            setLinkedItemId('none');
        } catch (error) {
            console.error("Error creating poll:", error);
            alert("Errore durante la creazione del sondaggio");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crea Nuovo Sondaggio</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Titolo / Domanda</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Es: Approvazione Preventivo #123"
                            className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descrizione (Opzionale)</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Dettagli aggiuntivi..."
                            className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Collega Documento (Opzionale)</Label>
                        <Select value={linkedItemId} onValueChange={setLinkedItemId}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                <SelectValue placeholder="Seleziona preventivo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#6c757d] text-[#f8f9fa]">
                                <SelectItem value="none">Nessun collegamento</SelectItem>

                                {clientQuotes.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="text-[#adb5bd] text-xs uppercase tracking-wider px-2 py-1.5 font-semibold">
                                            Preventivi (Builder)
                                        </SelectLabel>
                                        {clientQuotes.map(q => (
                                            <SelectItem key={q._id} value={`quote:${q._id}`}>
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-[#FFC703]" />
                                                    <span>{q.full_name || "Preventivo"} - € {q.estimated_price?.toLocaleString()}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}

                                {preventiviDocs.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="text-[#adb5bd] text-xs uppercase tracking-wider px-2 py-1.5 font-semibold mt-2">
                                            Documenti PDF
                                        </SelectLabel>
                                        {preventiviDocs.map(d => (
                                            <SelectItem key={d._id} value={`doc:${d._id}`}>
                                                <div className="flex items-center gap-2">
                                                    <File size={14} className="text-red-400" />
                                                    <span className="truncate max-w-[200px]">{d.title}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                            </SelectContent>
                        </Select>
                        {linkedItemId !== 'none' && (
                            <p className="text-xs text-[#adb5bd] flex items-center gap-1">
                                <AlertCircle size={12} className="text-[#FFC703]" />
                                Il documento sarà allegato al sondaggio.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Opzioni di Risposta</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Opzione ${index + 1}`}
                                        className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleRemoveOption(index)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAddOption}
                            className="text-[#FFC703] hover:text-[#FFC703] w-full border border-dashed border-[#FFC703]/20"
                        >
                            <Plus size={14} className="mr-1" /> Aggiungi Opzione
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="hover:bg-[#f8f9fa]/10 text-[#f8f9fa]">Annulla</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#FFC703] hover:bg-[#FFC703] text-white">
                        Crea Sondaggio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

