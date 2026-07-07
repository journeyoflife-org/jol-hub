/**
 * Funeral template sub-components
 * ObituaryList, CondolenceBook, FlowerOrderForm, LivestreamEmbed
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@jol-hub/ui';
import {
  Search,
  Calendar,
  Flower,
  Video,
  Heart,
  Lock,
  SendHorizonal,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { Obituary } from '../page';

// =============================================================================
// OBITUARY LIST
// =============================================================================

interface ObituaryListProps {
  obituaries: Obituary[];
}

export function ObituaryList({ obituaries }: ObituaryListProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  const MONTHS = [
    { value: 'all', label: 'All months' },
    { value: '0', label: 'January' }, { value: '1', label: 'February' },
    { value: '2', label: 'March' }, { value: '3', label: 'April' },
    { value: '4', label: 'May' }, { value: '5', label: 'June' },
    { value: '6', label: 'July' }, { value: '7', label: 'August' },
    { value: '8', label: 'September' }, { value: '9', label: 'October' },
    { value: '10', label: 'November' }, { value: '11', label: 'December' },
  ];

  const filtered = useMemo(() => {
    return obituaries.filter((o) => {
      const matchesSearch =
        !searchTerm ||
        o.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.firstName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMonth =
        filterMonth === 'all' ||
        new Date(o.dateOfDeath).getMonth() === parseInt(filterMonth);

      return matchesSearch && matchesMonth && o.isPublic;
    });
  }, [obituaries, searchTerm, filterMonth]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by surname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Search obituaries by surname"
          />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by month">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} obituaries
      </p>

      {/* Obituary Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No obituaries found matching your search
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((obituary) => (
            <Card key={obituary.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Photo */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {obituary.photo ? (
                      <Image
                        src={obituary.photo}
                        alt={`${obituary.firstName} ${obituary.lastName}`}
                        fill
                        className="object-cover grayscale"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-2xl font-light">
                        {obituary.firstName[0]}{obituary.lastName[0]}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">
                      {obituary.firstName} {obituary.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(obituary.dateOfBirth).getFullYear()} — {new Date(obituary.dateOfDeath).getFullYear()}
                    </p>
                    {obituary.biography && (
                      <p className="text-sm mt-2 line-clamp-2">{obituary.biography}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {obituary.funeralDate && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(obituary.funeralDate).toLocaleDateString('lt-LT')}
                          {obituary.funeralTime && ` at ${obituary.funeralTime}`}
                        </Badge>
                      )}
                      {obituary.hasStream && (
                        <Badge variant="secondary" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Live stream available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LIVESTREAM EMBED
// =============================================================================

interface LivestreamEmbedProps {
  obituaries: Obituary[];
}

export function LivestreamEmbed({ obituaries }: LivestreamEmbedProps): JSX.Element {
  const [selectedObituary, setSelectedObituary] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const streamObituaries = obituaries.filter((o) => o.hasStream);
  const selected = streamObituaries.find((o) => o.id === selectedObituary);

  const getEmbedUrl = (streamUrl: string): string => {
    // YouTube
    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      const videoId = streamUrl.includes('watch?v=')
        ? streamUrl.split('watch?v=')[1]?.split('&')[0]
        : streamUrl.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    }
    // Facebook
    if (streamUrl.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(streamUrl)}&autoplay=false`;
    }
    return streamUrl;
  };

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setIsLoading(true);
    setAuthError(null);

    // Simulate password verification
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === selected.streamPassword) {
      setIsAuthenticated(true);
    } else {
      setAuthError('Incorrect password. Please check your invitation.');
    }
    setIsLoading(false);
  }, [selected, password]);

  if (streamObituaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No live streams are currently scheduled
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select Obituary */}
      <div className="space-y-2">
        <Label htmlFor="stream-select">Select service to view</Label>
        <Select
          value={selectedObituary}
          onValueChange={(val) => {
            setSelectedObituary(val);
            setIsAuthenticated(false);
            setPassword('');
            setAuthError(null);
          }}
        >
          <SelectTrigger id="stream-select">
            <SelectValue placeholder="Choose a service..." />
          </SelectTrigger>
          <SelectContent>
            {streamObituaries.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.firstName} {o.lastName} — {o.funeralDate && new Date(o.funeralDate).toLocaleDateString('lt-LT')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Password Gate */}
      {selected && !isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This live stream is protected. Please enter the password provided in your invitation.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="stream-password">Stream Password</Label>
                <Input
                  id="stream-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  aria-describedby={authError ? 'password-error' : undefined}
                />
              </div>
              {authError && (
                <Alert variant="destructive" id="password-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={!password || isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                Access Stream
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Video Embed */}
      {selected && isAuthenticated && selected.streamUrl && (
        <div className="rounded-lg overflow-hidden border">
          <div className="relative aspect-video bg-black">
            <iframe
              src={getEmbedUrl(selected.streamUrl)}
              title={`Live stream: ${selected.firstName} ${selected.lastName} memorial`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          <div className="p-3 bg-muted flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selected.firstName} {selected.lastName} — Memorial Service
            </span>
            <a
              href={selected.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Open in new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONDOLENCE BOOK
// =============================================================================

interface CondolenceBookProps {
  obituaries: Obituary[];
}

interface CondolenceEntry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export function CondolenceBook({ obituaries }: CondolenceBookProps): JSX.Element {
  const [selectedObituary, setSelectedObituary] = useState(obituaries[0]?.id || '');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [condolences, setCondolences] = useState<CondolenceEntry[]>([
    { id: '1', name: 'Anna Kavaliauskienė', message: 'Nuoširdi užuojauta šeimai. Amžina atmintis.', createdAt: '2024-03-02T10:30:00Z' },
    { id: '2', name: 'Petras Žukauskas', message: 'Tegul ilsisi ramybėje. Ji buvo labai gerbiama bendruomenėje.', createdAt: '2024-03-02T11:15:00Z' },
    { id: '3', name: 'Rūta Mikalajūnaitė', message: 'With deepest condolences to the family. She will be dearly missed.', createdAt: '2024-03-02T14:00:00Z' },
  ]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      setError('Please enter your name and message');
      return;
    }

    if (message.length > 500) {
      setError('Message must be under 500 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL;
      if (apiUrl) {
        await fetch(`${apiUrl}/api/condolences/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            obituary_id: selectedObituary,
            name: name.trim(),
            message: message.trim(),
          }),
        });
      }
      
      // Optimistic UI update
      const newEntry: CondolenceEntry = {
        id: Date.now().toString(),
        name: name.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };
      setCondolences((prev) => [newEntry, ...prev]);
      setIsSuccess(true);
      setName('');
      setMessage('');
      setTimeout(() => setIsSuccess(false), 5000);
    } catch {
      setError('Failed to submit condolence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, message, selectedObituary]);

  const charCount = message.length;
  const maxChars = 500;

  return (
    <div className="space-y-6">
      {/* Select whose condolence book */}
      {obituaries.length > 1 && (
        <div className="space-y-2">
          <Label>Leave condolences for</Label>
          <Select value={selectedObituary} onValueChange={setSelectedObituary}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {obituaries.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Write Condolence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave a Message</CardTitle>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Thank you for your kind words</p>
                <p className="text-sm text-muted-foreground">
                  Your message will appear after moderation.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condolence-name">Your Name</Label>
                <Input
                  id="condolence-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condolence-message">
                  Message
                  <span className="text-muted-foreground text-xs ml-2">
                    ({charCount}/{maxChars})
                  </span>
                </Label>
                <Textarea
                  id="condolence-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share a memory or offer your condolences..."
                  rows={3}
                  maxLength={maxChars}
                  disabled={isSubmitting}
                  required
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
                  <SendHorizonal className="h-4 w-4 mr-2" />
                )}
                Submit Condolence
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                All messages are reviewed before publishing
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Existing Condolences */}
      <div className="space-y-3">
        {condolences.map((entry) => (
          <div key={entry.id} className="flex gap-3 p-4 bg-white rounded-lg border">
            <Heart className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{entry.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleDateString('lt-LT')}
                </span>
              </div>
              <p className="text-sm mt-1 text-muted-foreground">{entry.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// FLOWER ORDER FORM
// =============================================================================

interface FlowerOrderFormProps {
  obituaries: Obituary[];
}

interface FlowerArrangement {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
}

const FLOWER_ARRANGEMENTS: FlowerArrangement[] = [
  { id: 'small-bouquet', name: 'Small Bouquet', price: 25, description: 'Seasonal flowers, 12 stems' },
  { id: 'large-bouquet', name: 'Large Bouquet', price: 45, description: 'Premium seasonal flowers, 20+ stems' },
  { id: 'wreath', name: 'Memorial Wreath', price: 75, description: 'Traditional circular wreath with ribbon' },
  { id: 'casket-spray', name: 'Casket Spray', price: 120, description: 'Full casket spray, premium flowers' },
  { id: 'basket', name: 'Flower Basket', price: 55, description: 'Lush arrangement in keepsake basket' },
];

export function FlowerOrderForm({ obituaries }: FlowerOrderFormProps): JSX.Element {
  const [selectedObituary, setSelectedObituary] = useState(obituaries[0]?.id || '');
  const [selectedArrangement, setSelectedArrangement] = useState('');
  const [dedicationCard, setDedicationCard] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = FLOWER_ARRANGEMENTS.find((a) => a.id === selectedArrangement);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedArrangement) {
      setError('Please select a flower arrangement');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Integrate with local florist API
      const floristApiUrl = process.env.NEXT_PUBLIC_FLORIST_API_URL;
      if (floristApiUrl) {
        await fetch(`${floristApiUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            obituary_id: selectedObituary,
            arrangement_id: selectedArrangement,
            dedication: dedicationCard,
          }),
        });
      }

      setIsSuccess(true);
    } catch {
      setError('Failed to submit order. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedObituary, selectedArrangement, dedicationCard]);

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Order Placed Successfully</h3>
          <p className="text-sm text-muted-foreground">
            Your flowers will be delivered to the funeral. You will receive a confirmation email shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Select Funeral */}
      {obituaries.length > 1 && (
        <div className="space-y-2">
          <Label>For the funeral of</Label>
          <Select value={selectedObituary} onValueChange={setSelectedObituary}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {obituaries.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Arrangement Selection */}
      <div className="space-y-3">
        <Label>Select Arrangement</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FLOWER_ARRANGEMENTS.map((arrangement) => (
            <button
              key={arrangement.id}
              type="button"
              onClick={() => setSelectedArrangement(arrangement.id)}
              className={`text-left p-4 rounded-lg border-2 transition-colors ${
                selectedArrangement === arrangement.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{arrangement.name}</span>
                <span className="font-semibold text-primary">€{arrangement.price}</span>
              </div>
              <p className="text-sm text-muted-foreground">{arrangement.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dedication Card */}
      <div className="space-y-2">
        <Label htmlFor="dedication">Dedication Card Message (optional)</Label>
        <Textarea
          id="dedication"
          value={dedicationCard}
          onChange={(e) => setDedicationCard(e.target.value)}
          placeholder="Enter a personal message for the dedication card..."
          rows={3}
          maxLength={200}
          disabled={isSubmitting}
        />
      </div>

      {/* Order Summary */}
      {selected && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Order Summary</h4>
          <div className="flex justify-between text-sm">
            <span>{selected.name}</span>
            <span className="font-semibold">€{selected.price}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Includes delivery to funeral location
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting || !selectedArrangement} className="w-full">
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Flower className="h-4 w-4 mr-2" />
        )}
        {selected ? `Order Flowers — €${selected.price}` : 'Order Flowers'}
      </Button>
    </form>
  );
}
