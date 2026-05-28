"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useOrgId } from "@/hooks/useOrgId"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare, User, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function ConversationsPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientName, setNewClientName] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)

  const conversations = useQuery(api.conversations.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const messages = useQuery(
    api.conversationMessages.list,
    selectedConv && orgId ? { conversationId: selectedConv as any, organizationId: orgId, userEmail: user?.email } : "skip",
  )
  const sendMsg = useMutation(api.conversationMessages.send)
  const createConv = useMutation(api.conversations.create)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConv || !newMessage.trim() || !user?.email || !orgId) return
    try {
      await sendMsg({
        conversationId: selectedConv as any,
        organizationId: orgId,
        senderEmail: user.email,
        senderName: user.fullName || user.email,
        content: newMessage.trim(),
      })
      setNewMessage("")
    } catch (err: any) {
      toast.error(err.data || "Errore invio messaggio")
    }
  }

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !user?.email || !newClientEmail.trim() || !newClientName.trim()) return
    try {
      const id = await createConv({
        organizationId: orgId,
        clientEmail: newClientEmail.trim(),
        adminEmail: user?.email || "",
        clientName: newClientName.trim(),
        adminName: user?.fullName || user?.email || "Amministratore",
      })
      setSelectedConv(id as any)
      setShowNewForm(false)
      setNewClientEmail("")
      setNewClientName("")
      toast.success("Conversazione creata")
    } catch (err: any) {
      toast.error(err.data || "Errore creazione conversazione")
    }
  }

  const selectedConversation = conversations?.find((c) => c._id === selectedConv)

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      <div className={`w-80 border-r border-white/10 flex flex-col ${selectedConv ? "hidden lg:flex" : "flex"}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">Conversazioni</h2>
          <Button size="sm" variant="outline" className="border-white/10 text-xs" onClick={() => setShowNewForm(!showNewForm)}>
            + Nuova
          </Button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreateConversation} className="p-3 border-b border-white/10 space-y-2 bg-white/[0.02]">
            <Input
              placeholder="Email cliente"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="text-xs h-8"
              required
            />
            <Input
              placeholder="Nome cliente"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="text-xs h-8"
              required
            />
            <Button type="submit" size="sm" className="w-full bg-kranely-accent text-kranely-app-bg text-xs h-7">
              Crea
            </Button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto">
          {!conversations && (
            <div className="p-4 text-center text-white/40 text-sm">Caricamento...</div>
          )}
          {conversations?.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Nessuna conversazione</p>
            </div>
          )}
          {conversations?.map((conv) => {
            const isClient = conv.clientEmail === user?.email
            const otherName = isClient ? conv.adminName : conv.clientName
            const otherEmail = isClient ? conv.adminEmail : conv.clientEmail
            return (
              <button
                key={conv._id}
                onClick={() => setSelectedConv(conv._id)}
                className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                  selectedConv === conv._id ? "bg-white/[0.04] border-l-2 border-l-kranely-accent" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-kranely-accent/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-kranely-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{otherName}</p>
                    <p className="text-white/40 text-xs truncate">{otherEmail}</p>
                  </div>
                </div>
                {conv.lastMessage && (
                  <p className="text-white/30 text-xs mt-1 truncate pl-9">{conv.lastMessage}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!selectedConv ? "hidden lg:flex" : "flex"}`}>
        {selectedConv && selectedConversation ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                className="lg:hidden text-white/60"
                onClick={() => setSelectedConv(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-kranely-accent/20 flex items-center justify-center">
                <User className="w-4 h-4 text-kranely-accent" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {selectedConversation.clientEmail === user?.email
                    ? selectedConversation.adminName
                    : selectedConversation.clientName}
                </p>
                <p className="text-white/40 text-xs">
                  {selectedConversation.clientEmail === user?.email
                    ? selectedConversation.adminEmail
                    : selectedConversation.clientEmail}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!messages && (
                <div className="text-center text-white/40 text-sm pt-8">Caricamento...</div>
              )}
              {messages?.length === 0 && (
                <div className="text-center text-white/40 text-sm pt-8">
                  Nessun messaggio. Inizia la conversazione!
                </div>
              )}
              {messages?.map((msg) => {
                const isMine = msg.senderEmail === user?.email
                return (
                  <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2 ${
                        isMine
                          ? "bg-kranely-accent text-kranely-app-bg rounded-br-sm"
                          : "bg-white/10 text-white rounded-bl-sm"
                      }`}
                    >
                      {!isMine && (
                        <p className="text-xs opacity-60 mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-kranely-app-bg/60" : "text-white/40"}`}>
                        {new Date(msg._creationTime).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">Seleziona una conversazione</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
