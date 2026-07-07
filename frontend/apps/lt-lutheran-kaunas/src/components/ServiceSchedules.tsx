'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type ServiceTime } from '@/config/entity';

export interface ServiceSchedulesProps {
  schedule?: ServiceTime[];
  className?: string;
}

const serviceTypeColors: Record<string, string> = {
  main: 'bg-lutheran-red text-white',
  vespers: 'bg-primary text-white',
  'bible-study': 'bg-lutheran-gold text-gray-900',
  special: 'bg-green-100 text-green-800',
};

const serviceTypeLabels: Record<string, { lt: string; en: string }> = {
  main: { lt: 'Pagrindinės pamaldos', en: 'Main Service' },
  vespers: { lt: 'Vakarinės pamaldos', en: 'Vespers' },
  'bible-study': { lt: 'Biblijos studijos', en: 'Bible Study' },
  special: { lt: 'Specialios pamaldos', en: 'Special Service' },
};

export function ServiceSchedules({
  schedule = entityConfig.serviceSchedule,
  className,
}: ServiceSchedulesProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Pamaldų tvarkaraštis</CardTitle>
        <p className="text-sm text-gray-600">Service Schedule</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {schedule.map((service, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-primary">{service.day}</h3>
                  <p className="text-sm text-gray-600">{service.dayEn}</p>
                </div>
                <Badge className={serviceTypeColors[service.type]}>
                  {serviceTypeLabels[service.type]?.lt}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {service.times.map((time, timeIndex) => (
                  <Badge key={timeIndex} variant="outline" className="text-lg px-3 py-1">
                    {time}
                  </Badge>
                ))}
              </div>

              {service.notes && (
                <p className="text-sm text-gray-600 mt-2">{service.notes}</p>
              )}

              {service.language && (
                <p className="text-xs text-gray-500 mt-1">
                  Kalba: {service.language === 'lt' ? 'Lietuvių' : service.language}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Sacraments Info */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-heading text-lg text-primary mb-4">Sakramentai / Sacraments</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Krikštas / Baptism</h4>
              <p className="text-sm text-gray-600">{entityConfig.sacraments.baptism.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {entityConfig.sacraments.baptism.preparationRequired && '⚠️ Parengiamasis kursas reikalingas'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Šv. Vakarienė / Holy Communion</h4>
              <p className="text-sm text-gray-600">{entityConfig.sacraments.communion.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Dažnumas: {entityConfig.sacraments.communion.frequency}
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Konfirmacija / Confirmation</h4>
              <p className="text-sm text-gray-600">{entityConfig.sacraments.confirmation.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Amžius: {entityConfig.sacraments.confirmation.age} | {entityConfig.sacraments.confirmation.preparationYears} m. parengtis
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium">Vestuvės / Marriage</h4>
              <p className="text-sm text-gray-600">{entityConfig.sacraments.marriage.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {entityConfig.sacraments.marriage.preparationRequired && '⚠️ Parengiamasis kursas reikalingas'}
              </p>
            </div>
          </div>
        </div>

        {/* Community Programs */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-heading text-lg text-primary mb-4">Bendruomenės programos / Community Programs</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {entityConfig.communityPrograms.map((program) => (
              <div key={program.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium">{program.name}</h4>
                <p className="text-sm text-gray-600">{program.nameEn}</p>
                <p className="text-xs text-gray-500 mt-1">📅 {program.schedule}</p>
                {'ages' in program && program.ages && (
                  <p className="text-xs text-gray-500">👥 {program.ages} metų</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
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
