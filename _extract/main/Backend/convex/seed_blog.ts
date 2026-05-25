import { mutation } from "./_generated/server";

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const posts = [
            {
                title: "Le Tendenze Ristrutturazione 2026",
                slug: "tendenze-ristrutturazione-2026",
                excerpt: "Scopri quali saranno i materiali e i colori protagonisti delle case moderne nel prossimo anno. Sostenibilità e tecnologia al primo posto.",
                content: "Il 2026 si apre all'insegna della sostenibilità. Materiali naturali come legno e pietra tornano protagonisti...",
                category: "ristrutturazioni",
                author_name: "Marco Rossi",
                published: true,
                published_date: "2025-11-15T10:00:00Z",
                read_time: 5,
                tags: ["tendenze", "design", "2026"],
                featured_image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
            },
            {
                title: "Perché Scegliere Infissi in PVC",
                slug: "perche-scegliere-infissi-pvc",
                excerpt: "Isolamento termico, durata e poca manutenzione: ecco perché il PVC è la scelta migliore per le tue finestre.",
                content: "Gli infissi in PVC offrono il miglior rapporto qualità-prezzo sul mercato. Grazie alle moderne tecnologie...",
                category: "finestre",
                author_name: "Giulia Bianchi",
                published: true,
                published_date: "2025-12-10T09:30:00Z",
                read_time: 4,
                tags: ["pvc", "infissi", "risparmio energetico"],
                featured_image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
            },
            {
                title: "Bonus Casa 2026: Cosa Cambia",
                slug: "bonus-casa-2026",
                excerpt: "Guida completa alle agevolazioni fiscali per chi ristruttura casa nel 2026. Tutte le novità confermate.",
                content: "Anche per il 2026 sono stati confermati importanti bonus per la ristrutturazione e l'efficientamento energetico...",
                category: "novita",
                author_name: "Lorenzo Verdi",
                published: true,
                published_date: "2026-01-08T14:15:00Z",
                read_time: 7,
                tags: ["bonus", "fisco", "ristrutturazione"],
                featured_image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80"
            },
            {
                title: "Come Arredare un Bagno Moderno",
                slug: "arredare-bagno-moderno",
                excerpt: "Idee e consigli per trasformare il tuo bagno in una piccola spa domestica. Minimalismo e funzionalità.",
                content: "Il bagno non è più solo una stanza di servizio, ma un luogo di relax. Lo stile moderno predilige linee pulite...",
                category: "design",
                author_name: "Elena Neri",
                published: true,
                published_date: "2026-01-25T11:00:00Z",
                read_time: 6,
                tags: ["bagno", "arredamento", "moderno"],
                featured_image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80"
            },
            {
                title: "L'Importanza dell'Illuminazione",
                slug: "importanza-illuminazione-casa",
                excerpt: "Come la luce giusta può cambiare completamente l'atmosfera della tua casa. Consigli per ogni stanza.",
                content: "Progettare l'illuminazione è fondamentale quanto scegliere i mobili. Una luce calda può rendere accogliente un soggiorno...",
                category: "guide",
                author_name: "Marco Rossi",
                published: true,
                published_date: "2026-02-02T16:45:00Z",
                read_time: 5,
                tags: ["luce", "illuminazione", "interni"],
                featured_image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80"
            }
        ];

        for (const post of posts) {
            // Check if exists to avoid duplicates on re-run
            const existing = await ctx.db
                .query("blog_posts")
                .withIndex("by_slug", (q) => q.eq("slug", post.slug))
                .first();

            if (!existing) {
                await ctx.db.insert("blog_posts", post);
            }
        }
    },
});
