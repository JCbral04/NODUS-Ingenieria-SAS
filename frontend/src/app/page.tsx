export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">NODUS</h1>
        <p className="mt-2 text-slate-400">
          Plataforma de orquestación de casos — Ingenierías SAS
        </p>
        <p className="mt-6 text-sm text-slate-500">
          API: <code className="rounded bg-slate-800 px-2 py-1">http://localhost:3001/api/docs</code>
        </p>
      </div>
    </main>
  );
}
