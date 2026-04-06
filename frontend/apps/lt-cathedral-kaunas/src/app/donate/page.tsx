import { entityConfig } from '@/config/entity';

export const metadata = {
  title: 'Aukos | Donate - Kauno Arkikatedra',
  description: 'Paremti Kauno arkikatedrą - Support Kaunas Cathedral with your donation',
};

export default function DonatePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2 text-center">Aukos</h1>
      <p className="text-gray-600 text-center mb-8">Support Kaunas Cathedral</p>
      
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
        <p className="text-center text-gray-600 mb-6">
          Jūsų auka padeda išlaikyti Katedrą ir vykdyti arkivyskupijos veiklą.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <h3 className="font-medium">Bendroji auka</h3>
            <p className="text-sm text-gray-600">General donation for cathedral maintenance</p>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <h3 className="font-medium">Restauracija</h3>
            <p className="text-sm text-gray-600">Restoration of cathedral heritage</p>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <h3 className="font-medium">Labdara</h3>
            <p className="text-sm text-gray-600">Charitable works of the archdiocese</p>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Banko sąskaita / Bank Account</h4>
          <p className="text-sm text-gray-600">Bank: AB SEB bankas</p>
          <p className="text-sm text-gray-600">IBAN: LT00 0000 0000 0000 0000</p>
          <p className="text-sm text-gray-600">SWIFT: CBVILT2X</p>
        </div>
      </div>
    </div>
  );
}
