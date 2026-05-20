import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Check, Lock, FileText, Eye } from 'lucide-react';

export default function PollMessage({ pollId, userEmail, isAdmin, onViewPdf }) {
    const poll = useQuery(api.quote_polls.getPoll, { poll_id: pollId });
    const linkedDoc = useQuery(api.documents.getById, poll?.document_id ? { id: poll.document_id } : "skip");
    const linkedQuote = useQuery(api.quotes.getById, poll?.quote_id ? { id: poll.quote_id } : "skip");
    const voteMutation = useMutation(api.quote_polls.votePoll);
    const closeMutation = useMutation(api.quote_polls.closePoll);
    const finalizeQuoteMutation = useMutation(api.quotes.finalizeQuote);
    const acceptCounterOfferMutation = useMutation(api.quote_polls.acceptCounterOffer); // NEW
    const rejectCounterOfferMutation = useMutation(api.quote_polls.rejectCounterOffer); // NEW

    // Counter proposal state
    const [showCounterInput, setShowCounterInput] = React.useState(false);
    const [counterNote, setCounterNote] = React.useState('');
    const [proposedPrice, setProposedPrice] = React.useState(''); // NEW
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    if (!poll) return <div className="p-4 bg-[#343a40] rounded-lg animate-pulse h-32"></div>;

    const totalVotes = poll.votes?.length || 0;
    const userVote = poll.votes?.find(v => v.user_email === userEmail);
    const isClosed = poll.status !== "active";

    const handleVote = async (option) => {
        if (isClosed || isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (option === 'Accetto' && poll.quote_id) {
                // The backend now handles quote finalization in votePoll mutation
                await voteMutation({ poll_id: pollId, option });
            } else if (option === 'Controproposta' || option === 'Rifiuto') {
                if (!showCounterInput) {
                    setShowCounterInput(true);
                    setIsSubmitting(false);
                    return;
                }
                // Submit with note and price if negotiation
                await voteMutation({
                    poll_id: pollId,
                    option,
                    note: counterNote,
                    proposed_price: proposedPrice ? parseFloat(proposedPrice) : undefined
                });
                setShowCounterInput(false);
            } else {
                await voteMutation({ poll_id: pollId, option });
            }
        } catch (error) {
            console.error("Error voting:", error);
            alert("Errore durante l'invio della risposta");
        } finally {
            setIsSubmitting(false);
        }
    };

    const acceptCounterOfferBox = async (pollId, voteIndex, price) => {
        try {
            await acceptCounterOfferMutation({ poll_id: pollId, vote_index: voteIndex, proposed_price: price });
        } catch (error) {
            console.error("Error accepting counter offer:", error);
            alert("Errore: " + (error.message || "Impossibile accettare la controproposta"));
        }
    };

    const rejectCounterOfferBox = async (pollId) => {
        try {
            await rejectCounterOfferMutation({ poll_id: pollId });
        } catch (error) {
            console.error("Error rejecting counter offer:", error);
            alert("Errore durante il rifiuto della controproposta");
        }
    };

    const handleClose = async () => {
        if (!isAdmin) return;
        await closeMutation({ poll_id: pollId });
    };

    // Calculate percentages
    const results = poll.options.reduce((acc, option) => {
        const count = poll.votes?.filter(v => v.option === option).length || 0;
        acc[option] = {
            count,
            percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
        };
        return acc;
    }, {});

    return (
        <Card className="w-full max-w-sm bg-[#343a40] border-[#495057] text-[#f8f9fa] mt-2 mb-2">
            <CardHeader className="pb-2 p-4">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <BarChart className="text-[#FFC703]" size={16} />
                        <span className="text-xs font-medium text-[#FFC703] uppercase tracking-wider">Sondaggio</span>
                    </div>
                    {isClosed && (
                        <div className="flex items-center gap-1 text-xs text-[#adb5bd] bg-[#495057] px-2 py-0.5 rounded-full">
                            <Lock size={12} /> Chiuso
                        </div>
                    )}
                </div>
                <CardTitle className="text-lg font-bold leading-tight">{poll.title}</CardTitle>
                {poll.description && (
                    <p className="text-sm text-[#adb5bd] mt-1">{poll.description}</p>
                )}

                {/* Linked Document/Quote Preview */}
                {(linkedDoc || linkedQuote) && (
                    <div className="mt-3 p-2 bg-[#212529] rounded border border-[#495057] flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-[#495057] flex items-center justify-center flex-shrink-0">
                                <FileText size={16} className="text-[#FFC703]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate text-[#f8f9fa]">
                                    {linkedDoc?.title || linkedQuote?.full_name || "Documento collegato"}
                                </p>
                                <p className="text-xs text-[#adb5bd]">
                                    {linkedDoc ? 'Documento PDF' : 'Preventivo Web'}
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-[#adb5bd] hover:text-white"
                            onClick={() => {
                                if (linkedDoc?.file_url) onViewPdf(linkedDoc.file_url);
                                // If it's a quote (web version), we might need a different handling or just show PDF if generated
                                // For now assuming PDF for docs. For quotes, maybe separate modal?
                                // If quote has files, show first file?
                                if (linkedQuote?.files?.[0]) onViewPdf(linkedQuote.files[0]);
                            }}
                            title="Visualizza"
                        >
                            <Eye size={16} />
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                    {poll.options.map((option) => {
                        const isSelected = userVote?.option === option;
                        const result = results[option];
                        const isNegotiation = option === 'Controproposta' || option === 'Rifiuto';
                        const isAccept = option === 'Accetto';

                        return (
                            <div key={option} className="space-y-2">
                                <button
                                    onClick={() => handleVote(option)}
                                    disabled={isClosed || isSubmitting}
                                    className={`w-full relative overflow-hidden rounded-xl border transition-all ${isSelected
                                        ? 'border-[#FFC703] ring-2 ring-[#FFC703]/20'
                                        : 'border-[#495057] hover:bg-[#495057]/50'
                                        } ${isClosed ? 'cursor-default opacity-80' : ''}`}
                                >
                                    {/* Progress Bar Background */}
                                    {(isClosed || userVote) && (
                                        <div
                                            className={`absolute inset-0 opacity-10 ${isAccept ? 'bg-green-500' : (isNegotiation ? 'bg-[#FFC703]' : 'bg-[#adb5bd]')}`}
                                            style={{ width: `${result.percentage}%` }}
                                        />
                                    )}

                                    <div className="relative p-3.5 flex items-center justify-between z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isAccept ? 'bg-green-500' : (option === 'Rifiuto' ? 'bg-red-500' : (option === 'Controproposta' ? 'bg-[#FFC703]' : 'bg-gray-500'))}`} />
                                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-[#f8f9fa]'}`}>
                                                {option}
                                            </span>
                                        </div>
                                        {(isClosed || userVote) && (
                                            <span className="text-xs font-mono text-[#adb5bd]">
                                                {result.percentage}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Show negotiation details in results */}
                                    {(isClosed || userVote) && (poll.votes || []).filter(v => v.option === option && (v.note || v['proposed_price'])).map((v, idx) => (
                                        <div key={idx} className="px-4 pb-3 text-xs border-t border-white/5 pt-2 flex flex-col gap-1 relative z-10">
                                            {v['proposed_price'] && (
                                                <div className="text-[#FFC703] font-bold flex items-center gap-1">
                                                    <span>Prezzo proposto:</span>
                                                    <span>€ {v['proposed_price']?.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {v.note && <div className="text-[#adb5bd] italic italic">"{v.note}"</div>}
                                            <div className="text-[9px] text-white/30 uppercase tracking-tighter">Da: {v.user_email}</div>
                                        </div>
                                    ))}
                                </button>

                                {/* Negotiation / Counter-Proposal Input UI for Client */}
                                {showCounterInput && isNegotiation && !userVote && (
                                    <div className="mt-2 p-3 sm:p-4 bg-[#212529] rounded-2xl border border-[#FFC703]/20 shadow-2xl animate-in slide-in-from-top-2 w-full max-w-full box-border overflow-hidden">
                                        <div className="space-y-3">
                                            <div className="w-full">
                                                <label className="text-[10px] text-[#FFC703] font-bold uppercase mb-1 block">La tua offerta (€)</label>
                                                <input
                                                    type="number"
                                                    value={proposedPrice}
                                                    onChange={(e) => setProposedPrice(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full bg-[#16191c] rounded-lg border border-[#495057] text-white text-sm p-2.5 focus:ring-2 focus:ring-[#FFC703] outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#adb5bd] font-bold uppercase mb-1 block">Note / Motivatione</label>
                                                <textarea
                                                    value={counterNote}
                                                    onChange={(e) => setCounterNote(e.target.value)}
                                                    placeholder="Spiega il motivo della tua richiesta..."
                                                    className="w-full bg-[#16191c] rounded-lg border border-[#495057] text-white text-sm p-2.5 focus:ring-2 focus:ring-[#FFC703] outline-none transition-all min-h-[80px]"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setShowCounterInput(false)}
                                                    className="h-8 text-xs text-[#adb5bd] hover:text-white"
                                                >
                                                    Annulla
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleVote(option)}
                                                    disabled={isSubmitting || (option === 'Controproposta' && !proposedPrice)}
                                                    className={`h-8 text-xs font-bold px-4 ${option === 'Rifiuto' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#FFC703] hover:bg-[#FFC703]'}`}
                                                >
                                                    Invia {option === 'Controproposta' ? 'Offerta' : 'Rifiuto'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Admin Actions for Counter Offers */}
                    {isAdmin && !isClosed && poll.votes?.map((vote, idx) => {
                        if (vote.proposed_price) {
                            return (
                                <div key={idx} className="mt-3 p-3 bg-[#FFC703]/10 border border-[#FFC703]/20 rounded-xl animate-in fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#FFC703] uppercase tracking-wider">Controproposta Ricevuta</span>
                                        <span className="text-xs text-[#adb5bd]">{new Date(vote.voted_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-end gap-2 mb-3">
                                        <span className="text-2xl font-bold text-white">€ {vote.proposed_price.toLocaleString()}</span>
                                        <span className="text-xs text-[#adb5bd] mb-1">da {vote.user_email}</span>
                                    </div>
                                    {vote.note && (
                                        <p className="text-sm text-[#dee2e6] italic mb-3 bg-[#212529]/50 p-2 rounded-lg border border-white/5">
                                            "{vote.note}"
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs font-bold"
                                            onClick={async () => {
                                                if (confirm(`Accettare la controproposta di € ${vote.proposed_price}? Il preventivo verrà aggiornato.`)) {
                                                    await acceptCounterOfferBox(pollId, idx, vote.proposed_price);
                                                }
                                            }}
                                        >
                                            Accetta Offerta
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                                            onClick={async () => {
                                                if (confirm("Rifiutare la controproposta? Il sondaggio verrà chiuso.")) {
                                                    await rejectCounterOfferBox(pollId);
                                                }
                                            }}
                                        >
                                            Rifiuta
                                        </Button>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-[#6c757d]">
                        {totalVotes} vot{totalVotes !== 1 ? 'i' : 'o'}
                    </p>
                    {isAdmin && !isClosed && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 text-xs px-2"
                        >
                            Termina sondaggio
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

