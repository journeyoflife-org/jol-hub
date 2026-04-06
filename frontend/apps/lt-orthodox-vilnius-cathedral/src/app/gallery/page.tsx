import { IconGallery } from '@/components';

export default function GalleryPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-4">
        <div className="text-4xl mb-2">☦</div>
        <h1 className="text-3xl font-orthodox font-bold text-primary mb-2">
          Ikonų galerija
        </h1>
        <p className="text-xl text-gray-600">Иконная галерея / Icon Gallery</p>
      </section>

      <IconGallery />

      {/* Veneration Information */}
      <section className="p-6 bg-orthodox-blue/10 rounded-lg text-center">
        <h2 className="text-xl font-orthodox font-bold text-primary mb-2">
          Ikonų garbinimas
        </h2>
        <p className="text-gray-600 mb-4">
          Icon Veneration in the Orthodox Tradition
        </p>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Stačiatikių tradicijoje ikonos nėra stabai, o šventi vaizdai, per kuriuos
          tikintieji gali pagerbti pavaizduotus šventuosius ir šventybes.
          Ikonų garbinimas yra ne garbinimas pačiam medžiui, o per jį -
          prototipui, t.y. šventajam arba įvykiui.
        </p>
      </section>
    </div>
  );
}
