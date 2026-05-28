"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { PageSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, FileText, Eye, Trash2, Globe, Lock, Edit3 } from "lucide-react"
import { toast } from "sonner"

export default function BlogAdminPage() {
  const orgId = useOrgId()
  const { user } = useAuth()
  const posts = useQuery(api.blog.list, orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const createPost = useMutation(api.blog.create)
  const updatePost = useMutation(api.blog.update)
  const publishPost = useMutation(api.blog.publish)
  const removePost = useMutation(api.blog.remove)

  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "news", authorName: "", readTime: 3, featuredImage: "" })

  const resetForm = () => setForm({ title: "", slug: "", excerpt: "", content: "", category: "news", authorName: "", readTime: 3, featuredImage: "" })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!orgId) return
    try {
      await createPost({ organizationId: orgId, ...form, userEmail: user?.email, readTime: form.readTime, tags: undefined })
      setShowCreate(false); resetForm(); toast.success("Articolo creato")
    } catch (err: any) { toast.error(err.message) }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editId) return
    try {
      await updatePost({ id: editId as any, organizationId: orgId!, userEmail: user?.email, ...form, readTime: form.readTime, tags: undefined })
      setEditId(null); resetForm(); toast.success("Articolo aggiornato")
    } catch (err: any) { toast.error(err.message) }
  }

  const openEdit = (post: any) => {
    setEditId(post._id)
    setForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || "", content: post.content || "", category: post.category, authorName: post.authorName, readTime: post.readTime || 3, featuredImage: post.featuredImage || "" })
  }

  const togglePublish = async (id: string, current: boolean) => {
    try { await publishPost({ id: id as any, published: !current, organizationId: orgId!, userEmail: user?.email }); toast.success(!current ? "Pubblicato" : "Nascosto") }
    catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo articolo?")) return
    try { await removePost({ id: id as any, organizationId: orgId!, userEmail: user?.email }); toast.success("Eliminato") }
    catch (err: any) { toast.error(err.message) }
  }

  if (!orgId || !posts) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Blog</h1><p className="text-white/60 mt-1">Gestisci gli articoli del blog</p></div>
        <Button onClick={() => { resetForm(); setShowCreate(true) }} className="bg-kranely-accent text-kranely-app-bg"><Plus className="w-4 h-4 mr-2" />Nuovo Articolo</Button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div key={post._id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10 text-kranely-accent" />
              <div>
                <h3 className="font-medium text-white">{post.title}</h3>
                <p className="text-sm text-white/40">{post.category} — {post.authorName}{post.readTime ? ` · ${post.readTime} min` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={post.published ? "default" : "outline"} className={post.published ? "bg-green-500/10 text-green-400" : ""}>
                {post.published ? "Pubblicato" : "Bozza"}
              </Badge>
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => openEdit(post)}><Edit3 className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => togglePublish(post._id, post.published ?? false)}>
                {post.published ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(post._id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="p-12 text-center text-white/40"><FileText className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nessun articolo. Creane uno!</p></div>}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nuovo Articolo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-white/80 mb-1">Titolo</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium text-white/80 mb-1">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="titolo-articolo" /></div>
            </div>
            <div><label className="block text-sm font-medium text-white/80 mb-1">Estratto</label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-white/80 mb-1">Contenuto (Markdown)</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-white/80 mb-1">Categoria</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="news">News</option><option value="guide">Guide</option><option value="case_study">Case Study</option></select></div>
              <div><label className="block text-sm font-medium text-white/80 mb-1">Autore</label><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium text-white/80 mb-1">Tempo lettura (min)</label><Input type="number" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: parseInt(e.target.value) || 3 })} /></div>
            </div>
            <div><label className="block text-sm font-medium text-white/80 mb-1">URL Immagine</label><Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} placeholder="https://..." /></div>
            <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10">Annulla</Button><Button type="submit" className="bg-kranely-accent text-kranely-app-bg">Crea</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null) }}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifica Articolo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-white/80 mb-1">Titolo</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium text-white/80 mb-1">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
            </div>
            <div><label className="block text-sm font-medium text-white/80 mb-1">Estratto</label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-white/80 mb-1">Contenuto</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-white/80 mb-1">Categoria</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="news">News</option><option value="guide">Guide</option><option value="case_study">Case Study</option></select></div>
              <div><label className="block text-sm font-medium text-white/80 mb-1">Autore</label><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium text-white/80 mb-1">Lettura</label><Input type="number" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: parseInt(e.target.value) || 3 })} /></div>
            </div>
            <div><label className="block text-sm font-medium text-white/80 mb-1">URL Immagine</label><Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} /></div>
            <DialogFooter><Button variant="outline" onClick={() => setEditId(null)} className="border-white/10">Annulla</Button><Button type="submit" className="bg-kranely-accent text-kranely-app-bg">Salva</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
