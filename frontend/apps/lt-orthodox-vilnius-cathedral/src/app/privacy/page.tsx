import { PrivacyPage } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export const metadata = {
  title: 'Privatumo politika | Privacy Policy',
};

export default function Privacy() {
  return (
    <PrivacyPage
      entityName={entityConfig.name.en}
      entityNameLocal={entityConfig.name.lt}
      address={entityConfig.address}
      contactEmail={entityConfig.contact.email}
      contactPhone={entityConfig.contact.phone}
      bitrix24Domain={entityConfig.bitrix24?.portalDomain}
      countryCode="lt"
      entityType="orthodox"
      lastUpdated="2025-01-15"
      language="lt"
    />
  );
}
