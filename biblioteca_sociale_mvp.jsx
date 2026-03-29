import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Users, BookOpen, Library, Sparkles, CheckCircle2, Circle, Pencil, Trash2, Star, UserPlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const STORAGE_KEY = "dream-library-mvp-v1";

const starterState = {
  currentUser: { id: "me", name: "Tu" },
  friends: [],
  shelves: {
    me: [],
    shared: [],
  },
  ui: {
    selectedShelf: "me",
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  if (typeof window === "undefined") return starterState;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? safeParse(raw, starterState) : starterState;
}

function saveState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeBookFromOpenLibrary(doc) {
  const firstIsbn = doc.isbn?.[0] || "";
  const coverId = doc.cover_i;
  const cover = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : firstIsbn
      ? `https://covers.openlibrary.org/b/isbn/${firstIsbn}-L.jpg`
      : "";

  return {
    id: uid(),
    source: "openlibrary",
    title: doc.title || "Titolo sconosciuto",
    author: doc.author_name?.join(", ") || "Autore sconosciuto",
    year: doc.first_publish_year || "",
    publisher: doc.publisher?.[0] || "",
    isbn: firstIsbn,
    language: doc.language?.[0] || "",
    subjects: (doc.subject || []).slice(0, 6),
    pages: "",
    description: "",
    cover,
    edition: "",
    readStatus: "to-read",
    rating: 0,
    notes: "",
    favorite: false,
    addedAt: new Date().toISOString(),
    spineColor: ["bg-stone-700", "bg-amber-700", "bg-emerald-700", "bg-rose-700", "bg-sky-700", "bg-violet-700"][Math.floor(Math.random() * 6)],
  };
}

function statsForBooks(books) {
  const total = books.length;
  const read = books.filter((b) => b.readStatus === "read").length;
  const reading = books.filter((b) => b.readStatus === "reading").length;
  const favorites = books.filter((b) => b.favorite).length;
  return { total, read, reading, favorites, progress: total ? Math.round((read / total) * 100) : 0 };
}

function SpineWall({ books }) {
  if (!books.length) {
    return (
      <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
        Qui compariranno le costine digitali dei tuoi libri. Per ora c'è il vuoto cosmico della libreria appena nata.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border p-4 bg-white/50">
      {books.map((book) => (
        <div
          key={book.id}
          title={`${book.title} — ${book.author}`}
          className={`w-10 h-40 rounded-xl ${book.spineColor || "bg-stone-700"} text-white flex items-end justify-center p-1 shadow-sm`}
        >
          <span className="text-[9px] leading-[10px] [writing-mode:vertical-rl] rotate-180 text-center font-medium tracking-wide">
            {book.title}
          </span>
        </div>
      ))}
    </div>
  );
}

function BookCard({ book, onToggleFavorite, onDelete, onStatusChange }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-20 h-28 shrink-0 overflow-hidden rounded-2xl bg-stone-100 border">
              {book.cover ? (
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  Nessuna copertina
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base leading-tight">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onToggleFavorite(book.id)}>
                  <Star className={`h-4 w-4 ${book.favorite ? "fill-current" : ""}`} />
                </Button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {book.year ? <Badge variant="secondary">{book.year}</Badge> : null}
                {book.isbn ? <Badge variant="outline">ISBN {book.isbn}</Badge> : null}
                {book.edition ? <Badge variant="outline">{book.edition}</Badge> : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant={book.readStatus === "to-read" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => onStatusChange(book.id, "to-read")}
                >
                  <Circle className="mr-1 h-4 w-4" /> Da leggere
                </Button>
                <Button
                  variant={book.readStatus === "reading" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => onStatusChange(book.id, "reading")}
                >
                  <BookOpen className="mr-1 h-4 w-4" /> In lettura
                </Button>
                <Button
                  variant={book.readStatus === "read" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => onStatusChange(book.id, "read")}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Letto
                </Button>
              </div>

              {(book.publisher || book.language || (book.subjects && book.subjects.length > 0)) && (
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                  {book.publisher ? <p><span className="font-medium text-foreground">Editore:</span> {book.publisher}</p> : null}
                  {book.language ? <p><span className="font-medium text-foreground">Lingua:</span> {book.language}</p> : null}
                  {book.subjects?.length ? <p><span className="font-medium text-foreground">Tag:</span> {book.subjects.join(", ")}</p> : null}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" className="rounded-full text-red-600" onClick={() => onDelete(book.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Rimuovi
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddBookDialog({ onAddBook, onAddManual }) {
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [manual, setManual] = useState({ title: "", author: "", edition: "", isbn: "", publisher: "", year: "" });

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const q = [query.trim(), author.trim()].filter(Boolean).join(" ");
      const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(query.trim())}${author.trim() ? `&author=${encodeURIComponent(author.trim())}` : ""}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      const mapped = (data.docs || []).slice(0, 10).map(normalizeBookFromOpenLibrary);
      setResults(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function submitManual() {
    if (!manual.title.trim()) return;
    onAddManual({
      id: uid(),
      source: "manual",
      title: manual.title.trim(),
      author: manual.author.trim() || "Autore sconosciuto",
      edition: manual.edition.trim(),
      isbn: manual.isbn.trim(),
      publisher: manual.publisher.trim(),
      year: manual.year.trim(),
      language: "",
      subjects: [],
      pages: "",
      description: "",
      cover: manual.isbn.trim() ? `https://covers.openlibrary.org/b/isbn/${manual.isbn.trim()}-L.jpg` : "",
      readStatus: "to-read",
      rating: 0,
      notes: "",
      favorite: false,
      addedAt: new Date().toISOString(),
      spineColor: ["bg-stone-700", "bg-amber-700", "bg-emerald-700", "bg-rose-700", "bg-sky-700", "bg-violet-700"][Math.floor(Math.random() * 6)],
    });
    setManual({ title: "", author: "", edition: "", isbn: "", publisher: "", year: "" });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-2xl"><Plus className="mr-2 h-4 w-4" /> Aggiungi libro</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Aggiungi un libro</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Ricerca automatica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Titolo" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Input placeholder="Autore (facoltativo)" value={author} onChange={(e) => setAuthor(e.target.value)} />
              <Button onClick={runSearch} disabled={loading || !query.trim()} className="rounded-2xl w-full">
                <Search className="mr-2 h-4 w-4" /> {loading ? "Cerco..." : "Cerca online"}
              </Button>

              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {results.map((book) => (
                  <div key={book.id} className="border rounded-2xl p-3 flex gap-3 items-start">
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border">
                      {book.cover ? (
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full text-[10px] flex items-center justify-center text-muted-foreground text-center p-1">No cover</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-tight">{book.title}</div>
                      <div className="text-sm text-muted-foreground">{book.author}</div>
                      <div className="text-xs text-muted-foreground mt-1">{[book.year, book.publisher].filter(Boolean).join(" • ")}</div>
                      <Button size="sm" className="mt-3 rounded-full" onClick={() => onAddBook(book)}>Aggiungi</Button>
                    </div>
                  </div>
                ))}
                {!loading && query && results.length === 0 ? (
                  <div className="text-sm text-muted-foreground rounded-2xl border border-dashed p-4">
                    Nessun risultato utile. Succede. I libri rari fanno gli snob. Usa l'inserimento manuale qui accanto.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Inserimento manuale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Titolo *" value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} />
              <Input placeholder="Autore" value={manual.author} onChange={(e) => setManual({ ...manual, author: e.target.value })} />
              <Input placeholder="Edizione" value={manual.edition} onChange={(e) => setManual({ ...manual, edition: e.target.value })} />
              <Input placeholder="ISBN" value={manual.isbn} onChange={(e) => setManual({ ...manual, isbn: e.target.value })} />
              <Input placeholder="Editore" value={manual.publisher} onChange={(e) => setManual({ ...manual, publisher: e.target.value })} />
              <Input placeholder="Anno" value={manual.year} onChange={(e) => setManual({ ...manual, year: e.target.value })} />
              <Button onClick={submitManual} disabled={!manual.title.trim()} className="rounded-2xl w-full">
                <Pencil className="mr-2 h-4 w-4" /> Salva manualmente
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DreamLibraryApp() {
  const [state, setState] = useState(starterState);
  const [friendName, setFriendName] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const selectedShelf = state.ui.selectedShelf;
  const currentBooks = state.shelves[selectedShelf] || [];
  const filteredBooks = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return currentBooks;
    return currentBooks.filter((b) => [b.title, b.author, b.publisher, b.isbn].filter(Boolean).some((v) => v.toLowerCase().includes(f)));
  }, [currentBooks, filter]);

  const globalBooks = useMemo(() => {
    const personal = state.shelves.me || [];
    const shared = state.shelves.shared || [];
    const friendBooks = state.friends.flatMap((f) => state.shelves[f.id] || []);
    return [...personal, ...shared, ...friendBooks];
  }, [state]);

  const stats = statsForBooks(currentBooks);
  const allStats = statsForBooks(globalBooks);

  function updateShelfBooks(shelfKey, updater) {
    setState((prev) => ({
      ...prev,
      shelves: {
        ...prev.shelves,
        [shelfKey]: updater(prev.shelves[shelfKey] || []),
      },
    }));
  }

  function addBook(book) {
    updateShelfBooks(selectedShelf, (books) => {
      const exists = books.some((b) => (b.isbn && b.isbn === book.isbn) || (b.title === book.title && b.author === book.author));
      if (exists) return books;
      return [book, ...books];
    });
  }

  function deleteBook(id) {
    updateShelfBooks(selectedShelf, (books) => books.filter((b) => b.id !== id));
  }

  function toggleFavorite(id) {
    updateShelfBooks(selectedShelf, (books) => books.map((b) => b.id === id ? { ...b, favorite: !b.favorite } : b));
  }

  function changeStatus(id, status) {
    updateShelfBooks(selectedShelf, (books) => books.map((b) => b.id === id ? { ...b, readStatus: status } : b));
  }

  function addFriend() {
    if (!friendName.trim()) return;
    const id = `friend-${uid()}`;
    setState((prev) => ({
      ...prev,
      friends: [...prev.friends, { id, name: friendName.trim() }],
      shelves: { ...prev.shelves, [id]: [] },
      ui: { ...prev.ui, selectedShelf: id },
    }));
    setFriendName("");
  }

  const shelfOptions = [
    { id: "me", label: "La mia libreria", icon: Library },
    { id: "shared", label: "Libreria condivisa", icon: Users },
    ...state.friends.map((f) => ({ id: f.id, label: f.name, icon: BookOpen })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-neutral-50 to-white text-stone-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="rounded-[28px] bg-white/70 backdrop-blur border shadow-sm p-5 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs mb-3 bg-white">
                  <Sparkles className="h-3.5 w-3.5" /> MVP funzionante — web + mobile friendly
                </div>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Dream Library</h1>
                <p className="text-muted-foreground mt-3 max-w-2xl text-sm md:text-base">
                  La tua biblioteca personale e condivisa: aggiungi libri, cerca online automaticamente, gestisci stati di lettura e costruisci la tua parete di costine digitali.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <AddBookDialog onAddBook={addBook} onAddManual={addBook} />
                <div className="flex gap-2">
                  <Input
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    placeholder="Nome amico"
                    className="w-40 rounded-2xl bg-white"
                  />
                  <Button variant="outline" className="rounded-2xl" onClick={addFriend}>
                    <UserPlus className="mr-2 h-4 w-4" /> Aggiungi amico
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid xl:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-6">
            <Card className="rounded-[28px] border-0 shadow-sm bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Spazi biblioteca</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedShelf} onValueChange={(value) => setState((prev) => ({ ...prev, ui: { ...prev.ui, selectedShelf: value } }))}>
                  <TabsList className="grid grid-cols-1 h-auto bg-transparent gap-2">
                    {shelfOptions.map((shelf) => {
                      const Icon = shelf.icon;
                      const active = selectedShelf === shelf.id;
                      return (
                        <TabsTrigger
                          key={shelf.id}
                          value={shelf.id}
                          className={`justify-start rounded-2xl px-4 py-3 border data-[state=active]:shadow-none ${active ? "bg-stone-900 text-white" : "bg-white"}`}
                        >
                          <Icon className="mr-2 h-4 w-4" /> {shelf.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-0 shadow-sm bg-white/80">
              <CardHeader>
                <CardTitle className="text-lg">Statistiche dello spazio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2"><span>Completamento lettura</span><span>{stats.progress}%</span></div>
                  <Progress value={stats.progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-semibold">{stats.total}</div><div className="text-sm text-muted-foreground">Totali</div></div>
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-semibold">{stats.read}</div><div className="text-sm text-muted-foreground">Letti</div></div>
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-semibold">{stats.reading}</div><div className="text-sm text-muted-foreground">In lettura</div></div>
                  <div className="rounded-2xl border p-4"><div className="text-2xl font-semibold">{stats.favorites}</div><div className="text-sm text-muted-foreground">Preferiti</div></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-0 shadow-sm bg-stone-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Panoramica globale</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-semibold">{allStats.total}</div><div className="text-white/70">Libri complessivi</div></div>
                <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-semibold">{state.friends.length}</div><div className="text-white/70">Amici</div></div>
                <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-semibold">{allStats.read}</div><div className="text-white/70">Libri letti</div></div>
                <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-semibold">{allStats.favorites}</div><div className="text-white/70">Preferiti</div></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-0 shadow-sm bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <CardTitle className="text-lg">Costine digitali</CardTitle>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtra per titolo, autore, ISBN..." className="pl-9 rounded-2xl bg-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SpineWall books={filteredBooks} />
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredBooks.length ? (
                filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteBook}
                    onStatusChange={changeStatus}
                  />
                ))
              ) : (
                <Card className="rounded-[28px] border-0 shadow-sm bg-white/80">
                  <CardContent className="p-10 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Nessun libro ancora</h3>
                    <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                      Parti da zero, che è sempre meglio che partire da un Excel assassino. Premi “Aggiungi libro”, cerca il titolo e popola la tua prima biblioteca.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
