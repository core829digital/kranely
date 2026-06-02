"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/input"
import { Plus, Search, Send, Hash, MessageSquare, Users, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { useAuth } from "@/lib/auth/auth-context"

export default function MessagesPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"chatChannels"> | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<"general" | "project" | "private">("general")
  const [newChannelDesc, setNewChannelDesc] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const channels = useQuery(api.chat.listChannels, orgId && user?.email ? { organizationId: orgId, userEmail: user.email } : "skip")
  const messages = useQuery(api.chat.listMessages, selectedChannelId && orgId ? { channelId: selectedChannelId, organizationId: orgId, userEmail: user?.email } : "skip")

  const createChannel = useMutation(api.chat.createChannel)
  const sendMessage = useMutation(api.chat.sendMessage)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const handleCreateChannel = async () => {
    if (!newChannelName || !orgId) { toast.error("Inserisci un nome"); return }
    try { const id = await createChannel({ organizationId: orgId, name: newChannelName, type: newChannelType, description: newChannelDesc || undefined, userEmail: user?.email }); setSelectedChannelId(id); setShowCreateDialog(false); setNewChannelName(""); toast.success("Canale creato") } catch (e) { toast.error("Errore") }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannelId || !orgId || !user) return
    try { await sendMessage({ organizationId: orgId, channelId: selectedChannelId, senderEmail: user.email, content: newMessage.trim() }); setNewMessage("") } catch (e) { toast.error("Errore") }
  }

  if (!orgId || !channels) return <PageSkeleton />

  const selectedChannel = channels.find((c) => c._id === selectedChannelId)
  const channelTypeLabel = (t: string) => ({ general: "Generale", project: "Progetto", private: "Privato", announcement: "Annuncio" } as Record<string, string>)[t] || t

  return (
    <div className="space-y-0 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4"><div><h1 className="text-2xl font-bold text-white">Messaggi</h1><p className="text-white/60 mt-1">Chat del team</p></div><Button onClick={() => setShowCreateDialog(true)} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"><Plus className="w-4 h-4 mr-2" /> Nuovo Canale</Button></div>
      <div className="flex h-[calc(100vh-12rem)] border border-white/10 rounded-xl overflow-hidden">
        <div className="w-64 border-r border-white/10 bg-white/[0.02] flex flex-col">
          <div className="p-4 border-b border-white/10"><h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Canali</h3></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map((ch) => (
              <button key={ch._id} onClick={() => setSelectedChannelId(ch._id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedChannelId === ch._id ? "bg-kranely-accent/10 text-kranely-accent" : "bg-white text-black hover:bg-white/80"}`}>
                <Hash className="w-4 h-4" /><span className="truncate">{ch.name}</span>{ch.type === "private" && <Badge variant="secondary" className="ml-auto text-xs">Privato</Badge>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><Hash className="w-5 h-5 text-kranely-accent" /><div><h2 className="text-lg font-semibold text-white">{selectedChannel.name}</h2>{selectedChannel.description && <p className="text-xs text-white/40">{selectedChannel.description}</p>}</div></div>
                <Badge variant={selectedChannel.type === "general" ? "success" : selectedChannel.type === "announcement" ? "warning" : "default"}>{channelTypeLabel(selectedChannel.type)}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages && messages.length > 0 ? messages.map((msg) => (
                  <div key={msg._id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-kranely-accent/10 flex items-center justify-center flex-shrink-0"><span className="text-kranely-accent text-xs font-semibold">{msg.senderEmail.charAt(0).toUpperCase()}</span></div>
                    <div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-medium text-white">{msg.senderEmail}</span><span className="text-xs text-white/40">{new Date(msg._creationTime).toLocaleString("it-IT")}</span></div><p className="text-sm text-white/80 mt-1">{msg.content}</p></div>
                  </div>
                )) : <div className="flex items-center justify-center h-full text-white/40"><div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun messaggio ancora</p><p className="text-xs mt-1">Inizia la conversazione!</p></div></div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Scrivi un messaggio..." className="flex-1" />
                  <Button onClick={handleSendMessage} className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90" title="Invia messaggio" aria-label="Invia messaggio"><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          ) : <div className="flex-1 flex items-center justify-center text-white/40"><div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Seleziona un canale per iniziare</p></div></div>}
        </div>
      </div>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent><DialogHeader><DialogTitle>Nuovo Canale</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome</Label><Input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="nome-canale" /></div>
            <div><Label>Tipo</Label><select value={newChannelType} onChange={(e) => setNewChannelType(e.target.value as any)} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="general">Generale</option><option value="project">Progetto</option><option value="private">Privato</option></select></div>
            <div><Label>Descrizione</Label><Input value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Annulla</Button><Button onClick={handleCreateChannel} className="bg-kranely-accent text-kranely-app-bg">Crea</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
