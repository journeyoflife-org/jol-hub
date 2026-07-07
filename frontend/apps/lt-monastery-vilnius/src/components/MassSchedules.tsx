'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, cn } from '@jol-hub/ui';
import { entityConfig, type MassTime } from '@/config/entity';

export interface MassSchedulesProps {
  schedule?: MassTime[];
  className?: string;
}

export function MassSchedules({
  schedule = entityConfig.massSchedule,
  className,
}: MassSchedulesProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Mišių tvarkaraštis / Mass Schedule</CardTitle>
        <p className="text-sm text-gray-600">{entityConfig.name.lt}</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Main Mass Schedule */}
          <div className="space-y-3">
            {schedule.map((mass, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border transition-colors cursor-pointer',
                  selectedDay === mass.day
                    ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                )}
                onClick={() => setSelectedDay(selectedDay === mass.day ? null : mass.day)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-primary">{mass.day}</h3>
                    <p className="text-sm text-gray-600">{mass.dayEn}</p>
                  </div>
                  {mass.notes && (
                    <Badge variant="secondary" className="text-xs">
                      {mass.notes}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {mass.times.map((time, timeIndex) => (
                    <Badge key={timeIndex} className="bg-liturgical-gold text-gray-900">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Monastic Liturgy Schedule */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-lg mb-3 text-primary">
              Vienuolių liturgija / Monastic Liturgy
            </h3>
            <div className="grid md:grid-cols-4 gap-2">
              {Object.entries(entityConfig.monasticSchedule).map(([key, schedule]) => (
                <div key={key} className="p-3 bg-liturgical-purple/10 rounded-lg">
                  <p className="font-medium capitalize">{key}</p>
                  <p className="text-primary font-bold">{schedule.time}</p>
                  <p className="text-xs text-gray-500">{schedule.location}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Visi kviečiami dalyvauti vienuolių liturginėje maldoje.
              <br />
              All are welcome to join the monastic liturgical prayer.
            </p>
          </div>

          {/* Confession Schedule */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-lg mb-3 text-primary">Išpažintis / Confession</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">Darbo dienomis / Weekdays</p>
                <p className="text-sm text-gray-600">{entityConfig.confessionSchedule.weekdays.times}</p>
                <p className="text-xs text-gray-500 mt-1">{entityConfig.confessionSchedule.weekdays.location}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">Savaitgaliais / Weekends</p>
                <p className="text-sm text-gray-600">{entityConfig.confessionSchedule.weekends.times}</p>
                <p className="text-xs text-gray-500 mt-1">{entityConfig.confessionSchedule.weekends.location}</p>
              </div>
            </div>
            {entityConfig.confessionSchedule.byAppointment && (
              <Badge className="mt-2 bg-liturgical-purple text-white">
                Pagal susitarimą / By appointment
              </Badge>
            )}
          </div>

          {/* Community Info */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-lg mb-3 text-primary">Bendruomenė / Community</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 bg-liturgical-gold/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{entityConfig.statistics.communityMembers}</p>
                <p className="text-sm text-gray-600">Vienuoliai / Monks</p>
              </div>
              <div className="p-3 bg-liturgical-gold/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{entityConfig.statistics.oblates}</p>
                <p className="text-sm text-gray-600">Oblatai / Oblates</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-4 text-sm text-gray-600">
            <p>
              📍 {entityConfig.address.street}, {entityConfig.address.postalCode} {entityConfig.address.city}
            </p>
            <p>📞 {entityConfig.contact.phone}</p>
            <p>📧 {entityConfig.contact.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MassSchedules;
