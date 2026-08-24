/**
 * Global 404 — deliberately generic.
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): this page must never reveal whether
 * a tenant slug exists, list valid tenants, or echo the attempted value.
 * A helpful, tenant-free message is the only allowed disclosure.
 */
export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center space-y-4">
        <p className="text-6xl font-heading font-bold text-primary">404</p>
        <h1 className="text-2xl font-heading font-bold">Puslapis nerastas / Page not found</h1>
        <p className="text-gray-600">
          Ieškomas adresas neegzistuoja arba yra nepasiekiamas. Patikrinkite nuorodą arba
          kreipkitės į jus dominančios įstaigos administraciją.
        </p>
        <p className="text-sm text-gray-500">
          The requested address does not exist or is unavailable. Please verify the link or
          contact the administration of the institution you are looking for.
        </p>
      </div>
    </main>
  );
}
