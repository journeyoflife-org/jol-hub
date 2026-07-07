/**
 * PhotoUploadForm Component
 * Customers upload photos of graves for quote requests
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Alert, AlertDescription } from '@jol-hub/ui';
import { Upload, Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
}

export function PhotoUploadForm(): JSX.Element {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: UploadedPhoto[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit

      const id = Math.random().toString(36).substring(7);
      newPhotos.push({
        id,
        file,
        preview: URL.createObjectURL(file),
      });
    });

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5)); // Max 5 photos
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (photos.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('location', location);
      formData.append('notes', notes);
      photos.forEach((photo) => formData.append('photos', photo.file));

      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL;
      if (apiUrl) {
        await fetch(`${apiUrl}/api/cemetery/quote-request/`, {
          method: 'POST',
          body: formData,
        });
      }

      // Cleanup previews
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setIsSuccess(true);
    } catch {
      setError('Failed to submit. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  }, [photos, name, email, phone, location, notes]);

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Quote Request Submitted</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Thank you for your inquiry. We will review your photos and send you a 
            personalized quote within 24 hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Photos for Quote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos of the grave (max 5)</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={photo.preview}
                    alt="Uploaded photo"
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote-name">Your Name *</Label>
              <Input
                id="quote-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-email">Email *</Label>
              <Input
                id="quote-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote-phone">Phone</Label>
              <Input
                id="quote-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+370 ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-location">Grave Location</Label>
              <Input
                id="quote-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Section, row, number"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="quote-notes">Additional Notes</Label>
            <Textarea
              id="quote-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what services you're interested in..."
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Request Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
