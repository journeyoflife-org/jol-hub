// Base utilities
export { cn } from './lib/utils';

// Components
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/accordion';
export { Alert, AlertTitle, AlertDescription } from './components/alert';
export { Avatar, AvatarFallback, AvatarImage } from './components/avatar';
export { Badge } from './components/badge';
export { Button } from './components/button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/card';
export { Checkbox } from './components/checkbox';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/dropdown-menu';
export { Input } from './components/input';
export { Label } from './components/label';
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './components/navigation-menu';
export { Popover, PopoverTrigger, PopoverContent } from './components/popover';
export { RadioGroup, RadioGroupItem } from './components/radio-group';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/select';
export { Separator } from './components/separator';
export { Switch } from './components/switch';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs';
export { Textarea } from './components/textarea';
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './components/toast';
export { Toaster } from './components/toaster';
export { useToast, toast } from './components/use-toast';
export type { ToastActionElement, ToastProps } from './components/toast';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/tooltip';

// Parish Templates - Shared Components
export { LiturgicalCalendar } from './components/liturgical-calendar';
export type { LiturgicalCalendarProps, LiturgicalSeason, FeastDay } from './components/liturgical-calendar';
export { ContactForm } from './components/contact-form';
export type { ContactFormProps, ContactFormData } from './components/contact-form';
export { PhotoGallery } from './components/photo-gallery';
export type { PhotoGalleryProps, Photo } from './components/photo-gallery';
export { ServiceSchedule } from './components/service-schedule';
export type { ServiceScheduleProps, ScheduleItem } from './components/service-schedule';

// Donation Widget (GDPR-compliant)
export {
  DonationWidget,
  StripePaymentForm,
  DonationSuccess,
  DonationError,
  useDonation,
  createPaymentIntent,
  confirmDonation,
  getTaxReceipt,
  downloadTaxReceipt,
  createCrmDonationContact,
  createCrmDonationDeal,
  syncDonationToCrm,
} from './components/donation';

// GDPR Cookie Consent
export {
  CookieConsentBanner,
  getStoredConsent,
  storeConsent,
  isConsentValid,
} from './components/cookie-consent-banner';
export type {
  CookieConsentBannerProps,
  ConsentPreferences,
  ConsentCategory,
} from './components/cookie-consent-banner';

// GDPR Compliance Pages
export { PrivacyPage } from './components/privacy-page';
export type { PrivacyPageProps } from './components/privacy-page';
export { ConsentPage } from './components/consent-page';
export type { ConsentPageProps } from './components/consent-page';
export { DSRPage } from './components/dsr-page';
export type { DSRPageProps } from './components/dsr-page';

// PII Encryption Utilities
export {
  encryptPII,
  decryptPII,
  encryptFormData,
  isEncryptionAvailable,
  generateEncryptionKey,
  hashForPseudonymization,
  usePIIEncryption,
} from './lib/pii-encryption';
export type {
  EncryptedData,
  PIIField,
  EncryptionConfig,
} from './lib/pii-encryption';

// Entity CRM Integration Hooks
export { useEntityCRM } from './hooks/useEntityCRM';
export type {
  EntityType,
  CRMContact,
  CRMDeal,
  AuditLogEntry,
  EntityCRMMConfig,
  EntityCRMMState,
  EntityCRMOperations,
  UseEntityCRMReturn,
} from './hooks/useEntityCRM';

// Types
