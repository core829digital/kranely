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
                className="max-w-4xl w-full h-[85vh] bg-[#1C1A18] border-white/10 text-white p-0 flex flex-col gap-0 [&>button]:hidden"
            >
                <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/8 space-y-0 bg-[#141210]">
                    <DialogTitle className="text-lg font-medium truncate flex-1 pr-4 flex items-center gap-2">
                        <FileText className="text-[#FFC703]/70" size={20} />
                        {title || 'Document Viewer'}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {url && (
                            <>
                                <a href={url} download target="_blank" rel="noopener noreferrer">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white/50 hover:text-white hover:bg-white/8 h-8 px-2"
                                        title="Download Document"
                                    >
                                        <Download size={18} className="mr-1" />
                                        <span className="hidden sm:inline">Download</span>
                                    </Button>
                                </a>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/50 hover:text-white hover:bg-white/8 h-8 px-2"
                                    onClick={() => window.open(url, '_blank')}
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={18} className="mr-1" />
                                    <span className="hidden sm:inline">Open</span>
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/50 hover:text-white hover:bg-white/8 h-8 w-8 ml-2"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-[#141210] w-full h-full relative overflow-hidden flex flex-col">
                    {url ? (
                        <>
                            {url.includes('example.com') ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
                                    <AlertCircle size={48} className="mb-4 text-[#FFC703]/60" />
                                    <h3 className="text-xl font-medium text-white mb-2">Sample Document</h3>
                                    <p className="max-w-md mb-6">
                                        This is a placeholder document. The real file has not been uploaded yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#141210] z-10">
                                            <div className="flex flex-col items-center">
                                                <Loader2 size={40} className="text-[#FFC703]/70 animate-spin mb-4" />
                                                <p className="text-white/40 text-sm">Loading document...</p>
                                            </div>
                                        </div>
                                    )}
                                    <iframe
                                        src={url}
                                        className="w-full h-full border-0 bg-white"
                                        title={title || 'PDF Document'}
                                        allowFullScreen
                                        onLoad={() => setIsLoading(false)}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
                            <AlertCircle size={48} className="mb-4 text-red-400" />
                            <h3 className="text-xl font-medium text-white mb-2">Document not available</h3>
                            <p className="max-w-md">
                                Unable to display the document. The file may have been removed or the path is invalid.
                            </p>
                            <Button variant="outline" className="mt-6 border-white/15 text-white/60 hover:text-white" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UniversalPdfViewer;
