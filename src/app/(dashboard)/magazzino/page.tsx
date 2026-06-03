"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useOrgId } from "@/hooks/useOrgId"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PageSkeleton } from "@/components/Skeletons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Id } from "../../../../convex/_generated/dataModel"
import {
  Package, Search, Plus, Minus, History, Settings2,
  AlertTriangle, TrendingUp, DollarSign, Layers,
  X, Check, Edit3, Trash2, Save, Loader2, ArrowUpDown
} from "lucide-react"

const UNITS = ["pz", "m", "kg", "lt", "conf", "rotolo", "foglio", "barra", "scatola", "set"]

const UNIT_LABELS: Record<string, string> = {
  pz: "Pezzi", m: "Metri", kg: "Chilogrammi", lt: "Litri",
  conf: "Confezioni", rotolo: "Rotoli", foglio: "Fogli",
  barra: "Barre", scatola: "Scatole", set: "Set",
}

export default function MagazzinoPage() {
  const { user } = useAuth()
  const orgId = useOrgId()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showMovements, setShowMovements] = useState<Id<"warehouseItems"> | null>(null)
  const [showCategories, setShowCategories] = useState(false)

  const categories = useQuery(api.warehouse.listCategories,
    orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const items = useQuery(api.warehouse.listItems,
    orgId ? {
      organizationId: orgId,
      userEmail: user?.email,
      categoryId: (selectedCategory as Id<"warehouseCategories">) || undefined,
      searchQuery: searchQuery || undefined,
    } : "skip")
  const stats = useQuery(api.warehouse.getStats,
    orgId ? { organizationId: orgId, userEmail: user?.email } : "skip")
  const movementsQuery = useQuery(
    api.warehouse.listMovements,
    showMovements && orgId ? {
      organizationId: orgId,
      userEmail: user?.email,
      itemId: showMovements,
    } : "skip",
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Magazzino</h1>
          <p className="text-white/50 mt-1">Gestisci il tuo inventario e stock</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCategories(true)}
            variant="outline"
            className="border-white/10 gap-2"
          >
            <Layers className="w-4 h-4" /> Categorie
          </Button>
          <Button
            onClick={() => setShowAddItem(true)}
            className="bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 gap-2"
          >
            <Plus className="w-4 h-4" /> Nuovo Articolo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <Package className="w-4 h-4" /> Articoli
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalItems ?? 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <TrendingUp className="w-4 h-4" /> Stock Totale
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalStock ?? 0}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border bg-white/[0.02]",
          (stats?.lowStockCount ?? 0) > 0 ? "border-red-500/30" : "border-white/10"
        )}>
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <AlertTriangle className={cn("w-4 h-4", (stats?.lowStockCount ?? 0) > 0 && "text-red-400")} />
            Allerta Stock
          </div>
          <p className={cn("text-2xl font-bold", (stats?.lowStockCount ?? 0) > 0 ? "text-red-400" : "text-white")}>
            {stats?.lowStockCount ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <DollarSign className="w-4 h-4" /> Valore Stimato
          </div>
          <p className="text-2xl font-bold text-white">
            €{(stats?.estimatedValue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca articolo per nome, SKU o descrizione..."
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-48">
          <option value="">Tutte le categorie</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {!items ? (
          <PageSkeleton />
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nessun articolo in magazzino</p>
            <p className="text-sm mt-1">Aggiungi il primo articolo</p>
          </div>
        ) : (
          items.map((item) => {
            const cat = categories?.find((c) => c._id === item.categoryId)
            const isLowStock = item.minStock != null && item.quantity <= item.minStock
            return (
              <div
                key={item._id}
                className={cn(
                  "p-4 rounded-xl border bg-white/[0.02] transition-all",
                  isLowStock ? "border-red-500/20" : "border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium truncate">{item.name}</h3>
                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Stock Basso
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40 mt-1">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      {cat && <span>{cat.name}</span>}
                      {item.supplier && <span>Fornitore: {item.supplier}</span>}
                      {item.description && <span className="truncate max-w-[200px]">{item.description}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        isLowStock ? "text-red-400" : "text-white"
                      )}>
                        {item.quantity}
                      </p>
                      <p className="text-xs text-white/40">{UNIT_LABELS[item.unit] || item.unit}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowMovements(item._id)}
                        className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
                        title="Movimenti"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
                        title="Modifica"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Item Modal */}
      <ItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        orgId={orgId}
        userEmail={user?.email}
        categories={categories || []}
      />

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemModal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          orgId={orgId}
          userEmail={user?.email}
          categories={categories || []}
          initialData={editingItem}
        />
      )}

      {/* Movements Modal */}
      {showMovements && (
        <MovementsModal
          itemId={showMovements}
          onClose={() => setShowMovements(null)}
          movements={movementsQuery || []}
          items={items || []}
        />
      )}

      {/* Categories Management */}
      <CategoriesModal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        orgId={orgId}
        userEmail={user?.email}
      />
    </div>
  )
}

function ItemModal({
  open, onClose, orgId, userEmail, categories, initialData,
}: {
  open: boolean
  onClose: () => void
  orgId: Id<"organizations"> | null
  userEmail: string | undefined
  categories: { _id: Id<"warehouseCategories">; name: string }[]
  initialData?: any
}) {
  const createItem = useMutation(api.warehouse.createItem)
  const updateItem = useMutation(api.warehouse.updateItem)

  const [name, setName] = useState(initialData?.name || "")
  const [sku, setSku] = useState(initialData?.sku || "")
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "")
  const [quantity, setQuantity] = useState(String(initialData?.quantity ?? "0"))
  const [unit, setUnit] = useState(initialData?.unit || "pz")
  const [minStock, setMinStock] = useState(initialData?.minStock != null ? String(initialData.minStock) : "")
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [supplier, setSupplier] = useState(initialData?.supplier || "")
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!initialData

  const handleSubmit = async () => {
    if (!name.trim() || !orgId || !userEmail) return
    setSubmitting(true)
    try {
      if (isEdit && initialData?._id) {
        await updateItem({
          id: initialData._id,
          organizationId: orgId,
          userEmail,
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId: (categoryId as Id<"warehouseCategories">) || undefined,
          quantity: Number(quantity) || 0,
          unit,
          minStock: minStock ? Number(minStock) : undefined,
          price: price ? Number(price) : undefined,
          description: description.trim() || undefined,
          supplier: supplier.trim() || undefined,
        })
        toast.success("Articolo aggiornato")
      } else {
        await createItem({
          organizationId: orgId,
          userEmail,
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId: (categoryId as Id<"warehouseCategories">) || undefined,
          quantity: Number(quantity) || 0,
          unit,
          minStock: minStock ? Number(minStock) : undefined,
          price: price ? Number(price) : undefined,
          description: description.trim() || undefined,
          supplier: supplier.trim() || undefined,
        })
        toast.success("Articolo creato")
      }
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Errore")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1C1A18] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{isEdit ? "Modifica Articolo" : "Nuovo Articolo"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white/80"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome articolo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Codice" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Nessuna</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Quantità</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" />
            </div>
            <div>
              <Label>Unità</Label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{UNIT_LABELS[u] || u}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Stock Minimo</Label>
              <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="-" min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prezzo (€)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" />
            </div>
            <div>
              <Label>Fornitore</Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nome fornitore" />
            </div>
          </div>
          <div>
            <Label>Descrizione</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 min-h-[60px] resize-y"
              placeholder="Descrizione..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/10">Annulla</Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()} className="flex-1 bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvataggio...</> : <><Save className="w-4 h-4 mr-2" /> {isEdit ? "Salva" : "Crea"}</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MovementsModal({
  itemId, onClose, movements, items,
}: {
  itemId: Id<"warehouseItems">
  onClose: () => void
  movements: any[]
  items: any[]
}) {
  const item = items.find((i) => i._id === itemId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1C1A18] p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Movimenti: {item?.name || ""}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white/80"><X className="w-5 h-5" /></button>
        </div>

        <div className="text-sm text-white/40 mb-4">
          Stock attuale: <span className="text-white font-bold">{item?.quantity ?? 0}</span>
        </div>

        {movements.length === 0 ? (
          <p className="text-white/30 text-center py-8">Nessun movimento registrato</p>
        ) : (
          <div className="space-y-2">
            {movements.map((m: any) => (
              <div key={m._id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <span className={cn(
                    "text-sm font-medium",
                    m.type === "in" ? "text-green-400" : "text-red-400"
                  )}>
                    {m.type === "in" ? "+" : "-"}{m.quantity}
                  </span>
                  {m.note && <p className="text-xs text-white/40 mt-0.5">{m.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">{new Date(m.createdAt).toLocaleDateString("it-IT")}</p>
                  {m.reference && <p className="text-xs text-white/30">{m.reference}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoriesModal({
  open, onClose, orgId, userEmail,
}: {
  open: boolean
  onClose: () => void
  orgId: Id<"organizations"> | null
  userEmail: string | undefined
}) {
  const categories = useQuery(api.warehouse.listCategories,
    orgId ? { organizationId: orgId, userEmail } : "skip")
  const createCategory = useMutation(api.warehouse.createCategory)
  const removeCategory = useMutation(api.warehouse.removeCategory)
  const [newName, setNewName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim() || !orgId || !userEmail) return
    setSubmitting(true)
    try {
      await createCategory({
        organizationId: orgId,
        userEmail,
        name: newName.trim(),
      })
      setNewName("")
      toast.success("Categoria creata")
    } catch (e: any) {
      toast.error(e.message || "Errore")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (id: Id<"warehouseCategories">) => {
    if (!orgId || !userEmail) return
    try {
      await removeCategory({ id, organizationId: orgId, userEmail })
      toast.success("Categoria eliminata")
    } catch (e: any) {
      toast.error(e.message || "Errore")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1C1A18] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Categorie</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white/80"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuova categoria..." onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Button onClick={handleAdd} disabled={submitting || !newName.trim()} size="sm" className="bg-kranely-accent text-kranely-app-bg shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {categories?.length === 0 ? (
          <p className="text-white/30 text-center py-4">Nessuna categoria</p>
        ) : (
          <div className="space-y-1">
            {categories?.map((c) => (
              <div key={c._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group">
                <span className="text-white/70 text-sm">{c.name}</span>
                <button onClick={() => handleRemove(c._id)} className="p-1 rounded text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
