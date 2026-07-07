'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface ServiceSchedulesProps {
  className?: string;
}

const serviceTypeIcons: Record<string, string> = {
  liturgy: '✝️',
  vespers: '🌅',
  matins: '🌅',
  'all-night-vigil': '🕯️',
  moleben: '🙏',
  panikhida: '🕯️',
};

export function ServiceSchedules({ className }: ServiceSchedulesProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-orthodox">Dievo tarnybos</CardTitle>
        <p className="text-sm text-gray-600">Divine Services Schedule</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-6">
          {entityConfig.serviceSchedule.map((schedule, index) => (
            <div key={index} className="space-y-3">
              <h3 className="font-medium text-lg text-primary border-b pb-2">
                {schedule.day}
              </h3>

              <div className="space-y-2">
                {schedule.services.map((service, sIndex) => (
                  <div
                    key={sIndex}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{serviceTypeIcons[service.type] || '⛪'}</span>
                      <div>
                        <p className="font-medium">{service.nameLt}</p>
                        <p className="text-sm text-gray-600">{entityConfig.serviceTypes[service.type]?.nameEn}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {service.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Confession Schedule */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium text-lg text-primary mb-3">Išpažintis / Holy Confession</h3>
          <div className="p-4 bg-orthodox-blue/10 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              {entityConfig.sacraments.confession.schedule}
            </p>
            <p className="text-sm text-gray-600">
              Пeр kiekvieną Liturgiją pasninkavusiems tikintiesiems arba susitarus su kunigu.
              <br />
              Before each Liturgy for prepared faithful or by appointment with a priest.
            </p>
          </div>
        </div>

        {/* Sacraments */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium text-lg text-primary mb-3">Slėpiniai / Holy Mysteries</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(entityConfig.sacraments).map(([key, sacrament]) => (
              <div key={key} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium">{sacrament.nameLt}</h4>
                <p className="text-sm text-gray-600">{sacrament.nameEn}</p>
                {'preparation' in sacrament && sacrament.preparation && (
                  <p className="text-xs text-gray-500 mt-1">{sacrament.preparation}</p>
                )}
                {'schedule' in sacrament && sacrament.schedule && (
                  <p className="text-xs text-gray-500 mt-1">{sacrament.schedule}</p>
                )}
                {'note' in sacrament && sacrament.note && (
                  <p className="text-xs text-gray-500 mt-1">{sacrament.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-6 pt-6 border-t text-sm text-gray-600">
          <p>📍 {entityConfig.address.street}, {entityConfig.address.postalCode} {entityConfig.address.city}</p>
          <p>📞 {entityConfig.contact.phone}</p>
          <p>📧 {entityConfig.contact.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceSchedules;
