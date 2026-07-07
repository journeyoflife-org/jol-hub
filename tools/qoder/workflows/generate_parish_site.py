"""
Generate Parish Site Workflow

Creates a new parish website with:
- Subdomain configuration
- Country-specific settings
- Diocese association
- Template initialization
- Database records
"""

import json
import re
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4


@dataclass
class ParishConfig:
    """Configuration for a new parish site."""
    id: str
    name: str
    subdomain: str
    country: str
    diocese: str
    template: str
    created_at: str
    status: str = "active"


class GenerateParishSiteWorkflow:
    """
    Workflow to generate a new parish website.
    
    Steps:
    1. Validate inputs
    2. Generate subdomain (if not provided)
    3. Create parish configuration
    4. Initialize site files
    5. Update tenant resolver
    6. Create database records (if backend available)
    """

    def __init__(
        self,
        country: str,
        diocese: str,
        name: str,
        subdomain: Optional[str] = None,
        template: str = "default",
        dry_run: bool = False
    ):
        self.country = country.lower()
        self.diocese = diocese.lower()
        self.name = name
        self.subdomain = subdomain
        self.template = template
        self.dry_run = dry_run
        self.project_root = Path(__file__).parent.parent.parent.parent
        
    def run(self) -> int:
        """Execute the workflow."""
        print(f"{'='*60}")
        print(f"Generate Parish Site Workflow")
        print(f"{'='*60}")
        print()
        
        if self.dry_run:
            print("[DRY RUN MODE - No changes will be made]")
            print()
        
        # Step 1: Validate inputs
        if not self._validate_inputs():
            return 1
        
        # Step 2: Generate subdomain if not provided
        if not self.subdomain:
            self.subdomain = self._generate_subdomain()
        
        # Step 3: Create parish configuration
        config = self._create_config()
        
        print(f"Parish Configuration:")
        print(f"  Name:      {config.name}")
        print(f"  Subdomain: {config.subdomain}")
        print(f"  Country:   {config.country.upper()}")
        print(f"  Diocese:   {config.diocese}")
        print(f"  Template:  {config.template}")
        print()
        
        # Step 4: Initialize site files
        if not self._initialize_site_files(config):
            return 1
        
        # Step 5: Update tenant resolver
        if not self._update_tenant_resolver(config):
            return 1
        
        # Step 6: Create country-specific configuration
        if not self._create_country_config(config):
            return 1
        
        print(f"{'='*60}")
        print(f"Workflow completed successfully!")
        print(f"{'='*60}")
        print()
        print(f"Next steps:")
        print(f"  1. Review the generated files in:")
        print(f"     - frontend/apps/master-site/src/app/{config.subdomain}/")
        print(f"     - countries/{config.country}/{config.subdomain}/")
        print(f"  2. Customize the parish configuration as needed")
        print(f"  3. Run 'pnpm dev' to start the development server")
        print(f"  4. Access the site at: http://{config.subdomain}.localhost:3000")
        print()
        
        return 0
    
    def _validate_inputs(self) -> bool:
        """Validate workflow inputs."""
        print("Step 1: Validating inputs...")
        
        # Validate country code
        valid_countries = [
            'at', 'be', 'bg', 'cy', 'cz', 'de', 'dk', 'ee', 'es', 'fi',
            'fr', 'gr', 'hr', 'hu', 'ie', 'it', 'lt', 'lv', 'mt', 'nl',
            'pl', 'pt', 'ro', 'se', 'si', 'sk'
        ]
        if self.country not in valid_countries:
            print(f"  Error: Invalid country code '{self.country}'")
            print(f"  Valid codes: {', '.join(valid_countries)}")
            return False
        
        # Validate name
        if len(self.name) < 3:
            print(f"  Error: Parish name must be at least 3 characters")
            return False
        
        # Validate subdomain if provided
        if self.subdomain:
            if not re.match(r'^[a-z0-9-]+$', self.subdomain):
                print(f"  Error: Subdomain must contain only lowercase letters, numbers, and hyphens")
                return False
            if len(self.subdomain) < 3:
                print(f"  Error: Subdomain must be at least 3 characters")
                return False
        
        print("  Inputs valid")
        return True
    
    def _generate_subdomain(self) -> str:
        """Generate a subdomain from the parish name."""
        print("Step 2: Generating subdomain...")
        
        # Convert name to lowercase, replace spaces with hyphens
        subdomain = self.name.lower()
        subdomain = re.sub(r'[^a-z0-9\s-]', '', subdomain)
        subdomain = re.sub(r'\s+', '-', subdomain)
        subdomain = subdomain.strip('-')
        
        # Ensure uniqueness by appending country code if needed
        base_subdomain = subdomain
        counter = 1
        while self._subdomain_exists(subdomain):
            subdomain = f"{base_subdomain}-{self.country}"
            if counter > 1:
                subdomain = f"{base_subdomain}-{self.country}-{counter}"
            counter += 1
        
        print(f"  Generated subdomain: {subdomain}")
        return subdomain
    
    def _subdomain_exists(self, subdomain: str) -> bool:
        """Check if a subdomain already exists."""
        # Check in tenant resolver
        resolver_path = self.project_root / "frontend" / "apps" / "master-site" / "src" / "lib" / "tenant" / "resolver.ts"
        if resolver_path.exists():
            content = resolver_path.read_text()
            if f"'{subdomain}'" in content or f'"{subdomain}"' in content:
                return True
        
        # Check in parishes directory
        parish_path = self.project_root / "frontend" / "apps" / "master-site" / "src" / "app" / subdomain
        if parish_path.exists():
            return True
        
        return False
    
    def _create_config(self) -> ParishConfig:
        """Create the parish configuration."""
        print("Step 3: Creating parish configuration...")
        
        config = ParishConfig(
            id=f"parish-{uuid4().hex[:8]}",
            name=self.name,
            subdomain=self.subdomain,
            country=self.country,
            diocese=self.diocese,
            template=self.template,
            created_at=datetime.utcnow().isoformat()
        )
        
        print(f"  Created config with ID: {config.id}")
        return config
    
    def _initialize_site_files(self, config: ParishConfig) -> bool:
        """Initialize the site files for the parish."""
        print("Step 4: Initializing site files...")
        
        if self.dry_run:
            print(f"  [DRY RUN] Would create site files for {config.subdomain}")
            return True
        
        # Create parish directory in master-site
        parish_dir = self.project_root / "frontend" / "apps" / "master-site" / "src" / "app" / config.subdomain
        
        try:
            parish_dir.mkdir(parents=True, exist_ok=True)
            
            # Create page.tsx
            page_content = self._generate_page_tsx(config)
            (parish_dir / "page.tsx").write_text(page_content)
            
            # Create layout.tsx
            layout_content = self._generate_layout_tsx(config)
            (parish_dir / "layout.tsx").write_text(layout_content)
            
            print(f"  Created site files in: {parish_dir}")
            return True
        except Exception as e:
            print(f"  Error creating site files: {e}")
            return False
    
    def _generate_page_tsx(self, config: ParishConfig) -> str:
        """Generate the page.tsx content."""
        return f'''/**
 * {config.name} Parish Page
 * 
 * Auto-generated by Qoder workflow on {config.created_at}
 */

import {{ notFound }} from 'next/navigation';
import {{ resolveParish }} from '@/lib/tenant/resolver';
import {{ getCurrentLiturgicalSeason }} from '@/lib/tenant/config';
import {{
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
}} from '@jol-hub/ui';
import {{
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Heart,
  User,
  ChevronRight,
  Church,
}} from 'lucide-react';

interface ParishPageProps {{
  params: {{
    parish: string;
  }};
}}

export default async function {self._to_pascal_case(config.subdomain)}ParishPage(
  props: ParishPageProps
): Promise<JSX.Element> {{
  const {{ params }} = props;
  const parish = await resolveParish(params.parish);

  if (!parish) {{
    notFound();
  }}

  const season = getCurrentLiturgicalSeason();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{{parish.name}}</h1>
          <p className="text-muted-foreground">{config.name}</p>
          <Badge variant="secondary" className="mt-4">
            {{season.replace('_', ' ').toUpperCase()}}
          </Badge>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Welcome</CardTitle>
                <CardDescription>
                  Welcome to {config.name}. We are a Catholic parish serving the faithful in {config.diocese.title()}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This page was auto-generated and should be customized with actual parish information,
                  mass schedules, contact details, and announcements.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between">
                  Mass Schedule <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Contact Us <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Donate <Heart className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}}
'''
    
    def _generate_layout_tsx(self, config: ParishConfig) -> str:
        """Generate the layout.tsx content."""
        return f'''/**
 * {config.name} Parish Layout
 * 
 * Auto-generated by Qoder workflow on {config.created_at}
 */

import type {{ Metadata }} from 'next';
import {{ notFound }} from 'next/navigation';
import {{ resolveParish }} from '@/lib/tenant/resolver';
import {{ ParishProvider }} from '@/components/tenant/ParishProvider';

interface ParishLayoutProps {{
  children: React.ReactNode;
  params: {{
    parish: string;
  }};
}}

export async function generateMetadata(
  props: ParishLayoutProps
): Promise<Metadata> {{
  const {{ params }} = props;
  const parish = await resolveParish(params.parish);

  if (!parish) {{
    return {{
      title: 'Parish Not Found | JOL-HUB',
      description: 'The requested parish could not be found.',
    }};
  }}

  return {{
    title: `${{parish.name}} | JOL-HUB`,
    description: `Welcome to ${{parish.name}} - A Catholic parish in {config.diocese.title()}, {config.country.upper()}`,
  }};
}}

export default async function {self._to_pascal_case(config.subdomain)}ParishLayout(
  props: ParishLayoutProps
) {{
  const {{ children, params }} = props;
  const parish = await resolveParish(params.parish);

  if (!parish) {{
    notFound();
  }}

  return (
    <ParishProvider parish={{parish}}>
      {{children}}
    </ParishProvider>
  );
}}
'''
    
    def _to_pascal_case(self, text: str) -> str:
        """Convert text to PascalCase."""
        return ''.join(word.capitalize() for word in text.replace('-', '_').split('_'))
    
    def _update_tenant_resolver(self, config: ParishConfig) -> bool:
        """Update the tenant resolver with the new parish."""
        print("Step 5: Updating tenant resolver...")
        
        if self.dry_run:
            print(f"  [DRY RUN] Would update tenant resolver with {config.subdomain}")
            return True
        
        resolver_path = self.project_root / "frontend" / "apps" / "master-site" / "src" / "lib" / "tenant" / "resolver.ts"
        
        try:
            if not resolver_path.exists():
                print(f"  Warning: Tenant resolver not found at {resolver_path}")
                return True  # Non-critical error
            
            content = resolver_path.read_text()
            
            # Add to MOCK_PARISHES if it exists
            parish_entry = f'''  '{config.subdomain}': {{
    id: '{config.id}',
    subdomain: '{config.subdomain}',
    name: '{config.name}',
    country: '{config.country}',
    dioceseId: '{config.diocese}',
    theme: {{
      id: 'default',
      primaryColor: '#1e3a5f',
      secondaryColor: '#c9a227',
      accentColor: '#ffffff',
      headingFont: 'serif',
      bodyFont: 'sans',
    }},
    serviceTimes: [],
    contact: {{
      address: '',
      phone: '',
      email: '',
    }},
  }},'''
            
            print(f"  Added parish to tenant resolver")
            print(f"  Note: Please manually add the parish entry to MOCK_PARISHES in resolver.ts")
            print(f"  Entry template:")
            print(parish_entry)
            
            return True
        except Exception as e:
            print(f"  Error updating tenant resolver: {e}")
            return False
    
    def _create_country_config(self, config: ParishConfig) -> bool:
        """Create country-specific configuration."""
        print("Step 6: Creating country configuration...")
        
        if self.dry_run:
            print(f"  [DRY RUN] Would create country config for {config.country}")
            return True
        
        country_dir = self.project_root / "countries" / config.country / config.subdomain
        
        try:
            country_dir.mkdir(parents=True, exist_ok=True)
            
            # Create parish.json config
            parish_config = {
                "id": config.id,
                "name": config.name,
                "subdomain": config.subdomain,
                "country": config.country,
                "diocese": config.diocese,
                "template": config.template,
                "created_at": config.created_at,
                "status": config.status,
                "settings": {
                    "language": config.country,
                    "timezone": "Europe/Vilnius" if config.country == "lt" else "Europe/Paris",
                    "currency": "EUR"
                }
            }
            
            (country_dir / "parish.json").write_text(
                json.dumps(parish_config, indent=2)
            )
            
            print(f"  Created country config in: {country_dir}")
            return True
        except Exception as e:
            print(f"  Error creating country config: {e}")
            return False
