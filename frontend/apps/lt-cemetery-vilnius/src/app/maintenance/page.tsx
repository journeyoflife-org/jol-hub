import type { Metadata } from 'next';
import { MaintenanceScheduler } from '@/components/MaintenanceScheduler';
import { MaintenancePlansStore } from '@/components/MaintenancePlansStore';

export const metadata: Metadata = {
  title: 'Priežiūros planai | Maintenance Plans | Vilniaus Kapinių Tarnyba',
  description: 'Kapų priežiūros planai - savaitiniai, mėnesiniai, ketvirtiniai.',
};

export default function MaintenancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <MaintenanceScheduler />
        <MaintenancePlansStore />
      </div>
    </div>
  );
}
