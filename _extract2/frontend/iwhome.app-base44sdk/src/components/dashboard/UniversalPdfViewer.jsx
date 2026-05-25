import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, AlertCircle, FileText, Download, Loader2 } from 'lucide-react';

const UniversalPdfViewer = ({ url, title, isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-4xl w-full h-[85vh] bg-[#343a40] border-[#f8f9fa]/20 text-[#f8f9fa] p-0 flex flex-col gap-0 [&>button]:hidden"
            >
                <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-[#f8f9fa]/10 space-y-0 bg-[#212529]">
                    <DialogTitle className="text-lg font-medium truncate flex-1 pr-4 flex items-center gap-2">
                        <FileText className="text-cyan-400" size={20} />
                        {title || 'Visualizzatore Documento'}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {url && (
                            <>
                                <a href={url} download target="_blank" rel="noopener noreferrer">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[#adb5bd] hover:text-white hover:bg-white/10 h-8 px-2"
                                        title="Scarica Documento"
                                    >
                                        <Download size={18} className="mr-1" />
                                        <span className="hidden sm:inline">Scarica</span>
                                    </Button>
                                </a>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#adb5bd] hover:text-white hover:bg-white/10 h-8 px-2"
                                    onClick={() => window.open(url, '_blank')}
                                    title="Apri in nuova scheda"
                                >
                                    <ExternalLink size={18} className="mr-1" />
                                    <span className="hidden sm:inline">Apri Esterno</span>
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#adb5bd] hover:text-white hover:bg-white/10 h-8 w-8 ml-2"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-[#212529] w-full h-full relative overflow-hidden flex flex-col">
                    {url ? (
                        <>
                            {url.includes('example.com') ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-[#adb5bd] p-8 text-center bg-[#212529]">
                                    <AlertCircle size={48} className="mb-4 text-yellow-500" />
                                    <h3 className="text-xl font-medium text-[#f8f9fa] mb-2">Documento di Esempio</h3>
                                    <p className="max-w-md mb-6">
                                        Questo è un documento segnaposto. Il file reale non è stato ancora caricato.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#212529] z-10">
                                            <div className="flex flex-col items-center">
                                                <Loader2 size={40} className="text-cyan-400 animate-spin mb-4" />
                                                <p className="text-[#adb5bd] text-sm">Caricamento documento...</p>
                                            </div>
                                        </div>
                                    )}
                                    <iframe
                                        src={url}
                                        className="w-full h-full border-0 bg-white"
                                        title={title || 'Documento PDF'}
                                        allowFullScreen
                                        onLoad={() => setIsLoading(false)}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#adb5bd] p-8 text-center">
                            <AlertCircle size={48} className="mb-4 text-red-400" />
                            <h3 className="text-xl font-medium text-[#f8f9fa] mb-2">Documento non disponibile</h3>
                            <p className="max-w-md">
                                Impossibile visualizzare il documento. Il file potrebbe essere stato rimosso o il percorso non è valido.
                            </p>
                            <Button variant="outline" className="mt-6 border-[#f8f9fa]/20" onClick={onClose}>
                                Chiudi
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UniversalPdfViewer;
