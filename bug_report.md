# 🐛 Bug Report — Login Page & Main Page

## Bug #1 — `votes` Destructured dari Context yang Tidak Expose-nya (CRASH / Type Error)

**File:** `components/chat/shell.tsx` — Line 43  
**Severity:** 🔴 Critical (Runtime Crash / hydration error)

### Masalah
`shell.tsx` meng-destructure `votes` dari `useActiveChat()`:
```typescript
// shell.tsx L43
const {
  ...
  votes,       // ← INI TIDAK ADA di ActiveChatContext!
  ...
} = useActiveChat();
```

Tapi di `hooks/use-active-chat.tsx`, type `ActiveChatContextValue` **tidak punya field `votes`** sama sekali. Ini menyebabkan:
- `votes` selalu `undefined`
- Tidak error saat runtime karena destructuring JS bisa return `undefined`, tapi TypeScript harusnya error
- `votes` di-pass ke `<Messages votes={votes} />` → `PreviewMessage` bisa berperilaku tak terduga

### Fix
Hapus `votes` dari destructure di `shell.tsx` (field yang sudah dihapus dari backend integration) atau pass `undefined` secara eksplisit:

```diff
// shell.tsx
-  votes,
```
```diff
// Pada prop Messages
- votes={votes}
+ votes={undefined}
```

---

## Bug #2 — Login Page: Redirect Loop Potensial (Auth Page + Not Logged In)

**Files:** `middleware.ts` + `app/(auth)/layout.tsx`  
**Severity:** 🟠 High (Infinite redirect loop di kondisi tertentu)

### Masalah
Di `auth/(auth)/layout.tsx`, ada link **"Back"** yang langsung ke `href="/"`:
```tsx
// auth/layout.tsx L15
<Link href="/">Back</Link>
```

Ketika user **belum login** dan klik "Back":
1. User klik Back → navigate ke `/`
2. Middleware detects `!isLoggedIn` → redirect ke `/login`
3. User balik ke login page → loop → lihat "Back" → bisa klik lagi

Ini bukan infinite redirect secara teknis di sisi server, tapi **UX loop** yang membingungkan. Lebih parah: jika Next.js push history terlalu cepat (React strict mode double-effect), bisa trigger redirect chain yang terasa freeze.

### Masalah Tambahan di `login/page.tsx`
```typescript
// login/page.tsx L34-38
} else if (state.status === "success") {
  setIsSuccessful(true);
  updateSession();          // ← async, tidak di-await
  router.refresh();         // ← di-call langsung setelah updateSession()
}
```
`updateSession()` adalah async (returns Promise), tapi langsung diikuti `router.refresh()` tanpa menunggu. Hasilnya: session belum terupdate saat refresh → middleware masih anggap user belum login → **redirect balik ke `/login`** (loop redirect sementara).

### Fix untuk login/page.tsx
```diff
- updateSession();
- router.refresh();
+ await updateSession();
+ router.push("/");
```
Dan ubah `useEffect` callback menjadi async:
```diff
- useEffect(() => {
+ useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
-     updateSession();
-     router.refresh();
+     updateSession().then(() => {
+       router.push("/");
+     });
    }
  }, [state.status]);
```

---

## Bug #3 — `(chat)/layout.tsx`: Double Auth Check Causing Redirect Loop

**File:** `app/(chat)/layout.tsx`  
**Severity:** 🟠 High (Redirect loop antara middleware dan server component)

### Masalah
Ada **dua lapis** pengecekan auth yang bisa berkonflik:

1. **Middleware** (`middleware.ts` L22-24): Jika tidak login → redirect ke `/login`
2. **Server Component** (`(chat)/layout.tsx` L32-34): Jika tidak ada session → redirect ke `/login`

```typescript
// (chat)/layout.tsx
async function ChatContainer({ children }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");   // ← duplicate check
  }
  ...
}
```

Masalahnya: **NextAuth `auth()` di server component bisa return `null` bahkan ketika session cookie valid**, jika ada race condition atau token tidak tersync. Ini terjadi karena `auth.ts` menggunakan `Credentials` provider yang butuh koneksi ke backend (`/api/auth/token` di `http://127.0.0.1:8000`). Kalau backend mati/timeout → auth() gagal → redirect ke `/login` → middleware redirect balik ke `/` (karena dianggap sudah ada cookie) → **loop tak berujung**.

### Pola Loop:
```
/ → ChatContainer auth() fails (backend down) 
  → redirect("/login")
  → middleware: has session cookie? yes → redirect("/")
  → loop
```

### Fix
Di `(chat)/layout.tsx`, ganti hard redirect dengan fallback graceful:

```diff
async function ChatContainer({ children }) {
  const session = await auth();

  if (!session?.user) {
-   redirect("/login");
+   // Biarkan middleware yang handle, jangan double redirect
+   // Atau tampilkan error state daripada hard redirect
+   return <div>Session expired. <a href="/login">Login again</a></div>;
  }
  ...
}
```

---

## Bug #4 — `getChatHistoryPaginationKey` Arah Cursor Terbalik

**File:** `components/chat/sidebar-history.tsx` — Line 92-98  
**Severity:** 🟡 Medium (Data pagination salah)

### Masalah
```typescript
// sidebar-history.tsx L92-98
const firstChatFromPage = previousPageData.chats.at(-1);  // ← AMBIL ITEM TERAKHIR
return `.../api/history?ending_before=${firstChatFromPage.id}...`;
```

Logic di `history/route.ts` L69-73:
```typescript
} else if (endingBefore) {
  const idx = paginated.findIndex((c) => c.id === endingBefore);
  if (idx !== -1) {
    paginated = paginated.slice(0, idx);  // ambil semua SEBELUM id ini
  }
}
```

List di backend sudah **sorted newest first**. `ending_before` harusnya mengambil chat yang lebih lama (sebelum item termuda di page sebelumnya). Tapi `firstChatFromPage.at(-1)` mengambil item termuda (index terakhir digunakan justru ambil item terlama di page). **Arahnya terbalik** → pagination infinite scroll tidak akan load data baru yang benar.

### Fix
```diff
- const firstChatFromPage = previousPageData.chats.at(-1);
+ const lastChatFromPage = previousPageData.chats.at(-1);  // item terlama di page

// Seharusnya pakai starting_after (item terlama) bukan ending_before
- return `...?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
+ return `...?starting_after=${lastChatFromPage.id}&limit=${PAGE_SIZE}`;
```

Dan update `history/route.ts` agar `starting_after` logic benar:
```typescript
// Sudah benar: slice(idx + 1) artinya ambil item setelah cursor (lebih lama)
```

---

## Bug #5 — `newChatIdRef` Regenerasi Salah Kondisi (Main Page Logic)

**File:** `hooks/use-active-chat.tsx` — Line 70-73  
**Severity:** 🟡 Medium (ID chat baru bisa sama antar navigasi)

### Masalah
```typescript
// use-active-chat.tsx L70-73
if (isNewChat && prevPathnameRef.current !== pathname) {
  newChatIdRef.current = generateUUID();  // ← hanya update ref, tidak trigger re-render
}
prevPathnameRef.current = pathname;
```

Ini dijalankan **saat render**, bukan di dalam `useEffect`. Mutasi ref di luar effect = **side effect selama render** = React Strict Mode akan run dua kali → bisa generate dua UUID atau tidak generate sama sekali.

Lebih berbahaya: Jika user navigasi dari `/chat/[id]` → `/` → `/chat/[id]` lagi:
- `isNewChat` jadi `false` → tidak generate UUID
- `newChatIdRef` masih UUID lama
- Ketika kirim message baru → pakai chat ID lama yang sudah ada

### Fix
Pindahkan ke `useEffect`:
```diff
- if (isNewChat && prevPathnameRef.current !== pathname) {
-   newChatIdRef.current = generateUUID();
- }
- prevPathnameRef.current = pathname;

+ useEffect(() => {
+   if (isNewChat && prevPathnameRef.current !== pathname) {
+     newChatIdRef.current = generateUUID();
+   }
+   prevPathnameRef.current = pathname;
+ }, [pathname, isNewChat]);
```

---

## Bug #6 — Auth Layout: "Back" Button Unreachable Bagi Unauthenticated User

**File:** `app/(auth)/layout.tsx` — Line 15  
**Severity:** 🟡 Low-Medium (UX / potensi redirect loop persepsi)

```tsx
<Link href="/">Back</Link>
```

User yang belum login → klik Back → middleware redirect ke `/login` lagi. Link ini **tidak berfungsi** untuk unauthenticated user dan seharusnya dihapus atau diubah kondisinya.

---

## Ringkasan

| # | File | Tipe Bug | Severity |
|---|------|----------|----------|
| 1 | `shell.tsx` | `votes` tidak exist di context | 🔴 Critical |
| 2 | `login/page.tsx` | `updateSession` + `router.refresh` async race → redirect loop | 🟠 High |
| 3 | `(chat)/layout.tsx` | Double auth check → redirect loop saat backend down | 🟠 High |
| 4 | `sidebar-history.tsx` | Pagination cursor arah terbalik | 🟡 Medium |
| 5 | `use-active-chat.tsx` | Side effect dalam render (ref mutation) | 🟡 Medium |
| 6 | `(auth)/layout.tsx` | "Back" button useless/misleading | 🟡 Low |
