"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, X, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface UniversalPdfViewerProps {
  url: string
  title?: string
  open: boolean
  onClose: () => void
}

export default function UniversalPdfViewer({ url, title, open, onClose }: UniversalPdfViewerProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = title || "document.pdf"
    a.target = "_blank"
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className={fullscreen ? "max-w-[95vw] h-[95vh]" : "max-w-5xl h-[85vh]"}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-kranely-accent flex-shrink-0" />
              <span className="truncate">{title || "Documento"}</span>
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black/20 border border-white/10">
          <object
            data={url}
            type="application/pdf"
            className="w-full h-full"
            style={{ minHeight: "60vh" }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <FileText className="w-16 h-16 text-white/20" />
              <p className="text-white/60 text-center">Il browser non supporta la visualizzazione inline dei PDF.</p>
              <Button onClick={handleDownload} className="bg-kranely-accent text-kranely-app-bg">
                <Download className="w-4 h-4 mr-2" /> Scarica PDF
              </Button>
            </div>
          </object>
        </div>
      </DialogContent>
    </Dialog>
  )
}
