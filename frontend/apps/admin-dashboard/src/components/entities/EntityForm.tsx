'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EU_COUNTRIES } from '@/lib/countries';
import { ENTITY_TYPES } from '@/lib/entityTypes';
import { Loader2 } from 'lucide-react';
import type { Entity } from '@/types';

// =============================================================================
// Entity Form Schema
// Zod validation for 7 entity types
// =============================================================================

const entitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(1, 'Please select an entity type'),
  category: z.enum(['catholic', 'commercial']),
  country: z.string().min(1, 'Please select a country'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  diocese: z.string().optional().or(z.literal('')),
  vatNumber: z.string().optional().or(z.literal('')),
});

type EntityFormData = z.infer<typeof entitySchema>;

// =============================================================================
// Entity Form Component
// Dynamic form supporting 7 entity types
// Canon Law CIC 1300-1307: Catholic entities require diocese assignment
// =============================================================================

interface EntityFormProps {
  entity?: Entity;
  onSubmit: (data: EntityFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EntityForm({
  entity,
  onSubmit,
  onCancel,
  isLoading = false,
}: EntityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      name: entity?.name ?? '',
      type: entity?.type ?? '',
      category: entity?.category ?? 'catholic',
      country: entity?.country ?? '',
      email: entity?.email ?? '',
      phone: entity?.phone ?? '',
      address: entity?.address ?? '',
      city: entity?.city ?? '',
      postalCode: entity?.postalCode ?? '',
      website: entity?.website ?? '',
      description: entity?.description ?? '',
      diocese: entity?.diocese ?? '',
      vatNumber: entity?.vatNumber ?? '',
    },
  });

  const selectedCategory = watch('category');
  const selectedType = watch('type');
  const selectedCountry = watch('country');

  // All entity types are shown - no category filtering
  const filteredEntityTypes = ENTITY_TYPES;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core entity details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Entity Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="St. Mary's Parish"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={selectedCategory}
              onValueChange={(v) => setValue('category', v as 'catholic' | 'commercial')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="catholic">✝ Catholic Entity</SelectItem>
                <SelectItem value="commercial">🏢 Commercial Entity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Entity Type *</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue('type', v)}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {filteredEntityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Country - GDPR Article 44 */}
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={selectedCountry}
              onValueChange={(v) => setValue('country', v)}
            >
              <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {EU_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              GDPR Article 44: Data will be stored in this country's region
            </p>
          </div>

          {/* Diocese - Catholic Only */}
          {selectedCategory === 'catholic' && (
            <div className="space-y-2">
              <Label htmlFor="diocese">Diocese</Label>
              <Input
                id="diocese"
                {...register('diocese')}
                placeholder="Archdiocese of Vilnius"
              />
              <p className="text-xs text-muted-foreground">
                Canon Law CIC 1300-1307: Required for canonical approval
              </p>
            </div>
          )}

          {/* VAT Number - Commercial Only */}
          {selectedCategory === 'commercial' && (
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                {...register('vatNumber')}
                placeholder="LT123456789"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            How to reach this entity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="parish@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+370 123 45678"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="123 Church Street"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Vilnius"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                placeholder="LT-00000"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              {...register('website')}
              placeholder="https://parish.example.com"
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>
            Additional information about this entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('description')}
            placeholder="Enter a description of the entity..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            entity ? 'Update Entity' : 'Create Entity'
          )}
        </Button>
      </div>
    </form>
  );
}
