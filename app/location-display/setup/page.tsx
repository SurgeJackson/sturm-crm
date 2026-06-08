import { LocationDisplaySetup } from "@/components/time-clock/location-display";

export default async function LocationDisplaySetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      {params.token ? (
        <LocationDisplaySetup token={params.token} />
      ) : (
        <div className="mx-auto max-w-xl rounded-md border p-6">Ссылка подключения QR-экрана некорректна.</div>
      )}
    </main>
  );
}
