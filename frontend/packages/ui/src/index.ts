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

// Donation surface: the legacy PSP-integrated flat widget was REMOVED (O-021
// STAGED-REMOVAL, ADR-009 Model A). The SAQ-A-eligible shell lives in the
// composite barrel only: '@jol-hub/ui/components/composite'.

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

// ==========================================================================
// STEP 3/4 shared component library (tenant-aware, i18n-driven)
// Primitive names above stay LEGACY (existing apps depend on them); the
// new surfaces use distinct names or dedicated subpath barrels:
//   '@jol-hub/ui/components/primitives' | '/composite' | '/layout' | '/accessibility'
// ==========================================================================

// Layout chrome
export { Header } from './components/layout/header';
export type { HeaderProps } from './components/layout/header';
export { Footer } from './components/layout/footer';
export type { FooterProps, FooterLink, SocialLink } from './components/layout/footer';
export { MainNav } from './components/layout/main-nav';
export type { MainNavProps, NavItem } from './components/layout/main-nav';
export { MobileNav } from './components/layout/mobile-nav';
export type { MobileNavProps } from './components/layout/mobile-nav';
export { Breadcrumbs } from './components/layout/breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/layout/breadcrumbs';
export { Sidebar } from './components/layout/sidebar';
export type { SidebarProps, SidebarSection } from './components/layout/sidebar';
export { PageContainer } from './components/layout/page-container';
export type { PageContainerProps } from './components/layout/page-container';

// Accessibility primitives
export { SkipLink } from './components/accessibility/skip-link';
export type { SkipLinkProps } from './components/accessibility/skip-link';
export { AnnouncerProvider, useAnnounce } from './components/accessibility/announcer';
export type { AnnouncerProviderProps, AnnounceApi } from './components/accessibility/announcer';
export { LiveRegion } from './components/accessibility/live-region';
export type { LiveRegionProps } from './components/accessibility/live-region';
export { FocusTrap } from './components/accessibility/focus-trap';
export type { FocusTrapProps } from './components/accessibility/focus-trap';

// Composites
export { Hero } from './components/composite/hero';
export type { HeroProps, HeroCta, HeroVariant } from './components/composite/hero';
export { SectionHeader } from './components/composite/section-header';
export type { SectionHeaderProps, SectionHeaderFullProps } from './components/composite/section-header';
export { ContentBlock } from './components/composite/content-block';
export type { ContentBlockProps, ContentNode } from './components/composite/content-block';
export { FeatureGrid } from './components/composite/feature-grid';
export type { FeatureGridProps, FeatureItem } from './components/composite/feature-grid';
export { EventCard } from './components/composite/event-card';
export type { EventCardProps } from './components/composite/event-card';
export { NewsCard } from './components/composite/news-card';
export type { NewsCardProps } from './components/composite/news-card';
export { ServiceCard } from './components/composite/service-card';
export type { ServiceCardProps } from './components/composite/service-card';
export { TestimonialCard } from './components/composite/testimonial-card';
export type { TestimonialCardProps } from './components/composite/testimonial-card';
export { Gallery } from './components/composite/gallery';
export type { GalleryProps, GalleryImage } from './components/composite/gallery';
export { MapEmbed } from './components/composite/map-embed';
export type { MapEmbedProps } from './components/composite/map-embed';
// NOTE: legacy flat `ContactForm` above keeps its root-barrel name for
// back-compat; the STEP 3 versions are exposed via the composite barrel:
// '@jol-hub/ui/components/composite' (incl. the Model-A-compliant
// DonationWidget shell, O-021).
export { contactFormSchema } from './components/composite/contact-form';
export type { ContactFormValues } from './components/composite/contact-form';

// i18n (STEP 4)
export { LocaleSwitcher } from './components/locale-switcher';
export type { LocaleSwitcherProps } from './components/locale-switcher';

// Types
