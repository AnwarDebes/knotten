import Link from "next/link";
import { requireAuth } from "@/lib/admin/session-cookie";
import { logoutAction } from "../actions";

/**
 * Gate for every protected admin page. requireAuth rejects anonymous and
 * not-yet-enrolled requests server-side before any child renders.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/admin" className="text-foreground hover:text-sea">
              Knotten admin
            </Link>
            <Link href="/admin" className="text-muted-foreground hover:text-sea">
              Registreringer
            </Link>
            <Link href="/admin/audit" className="text-muted-foreground hover:text-sea">
              Aktivitetslogg
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              {auth.admin.email} ({auth.admin.role})
            </span>
            <form action={logoutAction}>
              <button type="submit" className="text-sea hover:underline">
                Logg ut
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
