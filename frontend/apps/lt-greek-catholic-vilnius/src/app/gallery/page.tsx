import { entityConfig } from '@/config/entity';

export const metadata = {
  title: 'Ikonos / Icons / Ікони',
};

export default function GalleryPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-byzantine font-bold text-byzantine-blue">
        🖼️ Ikonos / Icons / Ікони
      </h1>

      <p className="text-gray-600">
        Our church houses several notable icons from the Byzantine tradition. These sacred images 
        are windows to heaven, connecting the faithful with the saints and the divine.
      </p>

      {/* Featured Icons */}
      <div className="grid md:grid-cols-3 gap-8">
        {entityConfig.notableIcons.map((icon) => (
          <div key={icon.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-byzantine-gold via-byzantine-red to-byzantine-purple flex items-center justify-center">
              <span className="text-9xl text-white/80">☦</span>
            </div>
            <div className="p-6">
              <h2 className="font-bold text-xl text-byzantine-blue">{icon.nameLt}</h2>
              <p className="text-sm text-gray-600 mb-2">{icon.nameEn}</p>
              <p className="text-gray-700">{icon.description}</p>
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                <p><strong>Origin:</strong> {icon.origin}</p>
                <p><strong>Century:</strong> {icon.century}</p>
                <p><strong>Location:</strong> {icon.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Icon Information */}
      <section className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl font-byzantine font-bold mb-4 text-byzantine-red">
          Apie Ikonas / About Icons
        </h2>
        <div className="prose max-w-none text-gray-700">
          <p>
            Icons are an integral part of Byzantine worship. They are not mere decorations but 
            sacramental windows that connect us to the heavenly realm. In the Greek Catholic tradition, 
            we venerate (show respect to) icons, we do not worship them — worship is reserved for God alone.
          </p>
          <p className="mt-4">
            Our icons follow the traditional Byzantine style, characterized by:
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Gold backgrounds symbolizing divine light</li>
            <li>Stylized, non-realistic figures pointing to the spiritual realm</li>
            <li>Inverse perspective drawing the viewer into the scene</li>
            <li>Specific colors with symbolic meanings</li>
          </ul>
        </div>
      </section>

      {/* Shop Link */}
      <section className="text-center bg-byzantine-purple text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Purchase Icons</h2>
        <p className="mb-6">
          High-quality reproductions of these icons and others are available in our online store.
        </p>
        <a 
          href="/shop" 
          className="inline-block px-8 py-3 bg-byzantine-gold text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Visit Shop →
        </a>
      </section>
    </div>
  );
}
