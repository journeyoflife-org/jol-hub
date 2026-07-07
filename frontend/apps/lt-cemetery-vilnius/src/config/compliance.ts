/**
 * Cemetery Services Compliance Configuration
 * GDPR + PCI-DSS compliance with special handling for deceased person data
 */

import { entityConfig } from './entity';

export const complianceConfig = {
  // GDPR Compliance
  gdpr: {
    enabled: entityConfig.compliance.gdpr,
    dataController: {
      name: entityConfig.name.lt,
      registrationNumber: entityConfig.business.license,
      contact: {
        dpo: 'Duomenų Apsaugos Pareigūnas',
        email: 'dpo@vilniuscemetery.lt',
        phone: '+370 5 210 6001',
      },
    },
    // Special Category: Deceased Person Data
    deceasedDataHandling: {
      enabled: entityConfig.compliance.deceasedDataHandling.enabled,
      legalBasis: 'GDPR Art. 9(2)(g) - Substantial public interest',
      familyConsent: 'required',
      retention: 'permanent',
      accessControls: {
        publicAccess: 'limited',
        familyAccess: 'full',
        administrativeAccess: 'role-based',
        researcherAccess: 'application-based',
      },
      dataMinimization: {
        collectOnly: [
          'name',
          'birth_date',
          'death_date',
          'interment_date',
          'epitaph',
          'photo',
        ],
        optionalData: ['biography', 'occupation', 'relationships'],
        prohibitedData: ['religious_beliefs', 'political_opinions', 'health_data'],
      },
      rightsExercise: {
        familyRepresentative: true,
        subjectAccessRequest: 'family_only',
        rectification: 'family_request',
        erasure: 'not_applicable_for_deceased',
        restriction: 'court_order_only',
      },
    },
    // Living Person Data
    livingDataHandling: {
      legalBasis: {
        serviceProvision: 'GDPR Art. 6(1)(b) - Contract performance',
        legalObligation: 'GDPR Art. 6(1)(c) - Legal obligation',
        consent: 'GDPR Art. 6(1)(a) - Consent',
      },
      retention: {
        ownerRecords: 'permanent',
        contractRecords: 50,
        paymentRecords: 10,
        communicationRecords: 5,
      },
    },
  },

  // PCI-DSS Compliance
  pciDss: {
    enabled: entityConfig.compliance.pciDss.enabled,
    level: entityConfig.compliance.pciDss.level,
    saq: entityConfig.compliance.pciDss.saq,
    assessmentDate: entityConfig.compliance.pciDss.assessmentDate,
    paymentTypes: {
      accepted: ['credit_card', 'debit_card', 'bank_transfer', 'cash'],
      recurring: {
        enabled: true,
        methods: ['card', 'bank_transfer'],
      },
      installments: {
        enabled: true,
        maxInstallments: 24,
        interestFree: [3, 6, 12],
      },
    },
    dataProtection: {
      cardholderData: {
        stored: false,
        tokenized: true,
        encrypted: true,
      },
      sensitiveAuthData: {
        cvv: 'never_stored',
        pin: 'never_stored',
        trackData: 'never_stored',
      },
    },
    requirements: {
      networkSecurity: true,
      accessControl: true,
      encryption: 'TLS_1_3',
      auditLogging: true,
      vulnerabilityManagement: true,
      policyManagement: true,
    },
  },

  // Long-term Contract Management
  longTermContractManagement: {
    enabled: entityConfig.compliance.longTermContractManagement.enabled,
    contractTypes: {
      maintenance: {
        minDuration: 1,
        maxDuration: 50,
        renewalOptions: [1, 3, 5, 10, 20, 50],
        priceProtection: true,
      },
      perpetualCare: {
        type: 'permanent',
        endowment: true,
        managedFunds: true,
        annualReporting: true,
      },
      monumentInstallation: {
        warranty: 10,
        maintenanceIncluded: 1,
      },
    },
    renewalPolicies: {
      autoRenewal: true,
      notificationPeriod: 90, // days before expiry
      gracePeriod: 30, // days after expiry
      priceIncrease: {
        maxAnnualIncrease: 5, // percent
        notificationRequired: 60, // days before increase
      },
    },
    transferPolicies: {
      allowed: true,
      documentation: ['death_certificate', 'inheritance_document'],
      notarization: true,
      fee: 50,
    },
    cancellation: {
      noticePeriod: 30, // days
      refundPolicy: 'pro_rata',
      administrativeFee: 25,
    },
  },

  // Audit Configuration
  audit: {
    enabled: entityConfig.compliance.audit.enabled,
    logLevel: entityConfig.compliance.audit.logLevel,
    retention: entityConfig.compliance.audit.retention,
    tamperEvident: entityConfig.compliance.audit.tamperEvident,
    events: {
      // Plot & Ownership
      plotCreated: true,
      plotTransferred: true,
      ownershipChanged: true,
      // Contracts
      contractCreated: true,
      contractRenewed: true,
      contractCancelled: true,
      // Payments
      paymentProcessed: true,
      refundProcessed: true,
      paymentFailed: true,
      // Deceased Records
      deceasedRecordCreated: true,
      deceasedRecordUpdated: true,
      deceasedAccessChanged: true,
      // GDPR
      consentGiven: true,
      consentWithdrawn: true,
      dataAccessRequest: true,
      dataCorrectionRequest: true,
    },
    hashing: {
      algorithm: 'sha256',
      chainEnabled: true,
      anchorInterval: 1000,
    },
  },

  // Data Processing Record (GDPR Art. 30)
  dataProcessingRecord: {
    processingActivities: [
      {
        name: 'Plot Ownership Management',
        purpose: 'Cemetery plot registration and ownership tracking',
        categories: ['identity', 'contact', 'location'],
        recipients: ['internal_staff', 'local_authorities'],
        retention: 'permanent',
        safeguards: ['access_control', 'audit_logging', 'encryption'],
      },
      {
        name: 'Deceased Person Records',
        purpose: 'Interment records and public memorial information',
        categories: ['identity', 'biographical', 'family_relationships'],
        recipients: ['family', 'public_limited', 'researchers'],
        retention: 'permanent',
        safeguards: ['consent', 'access_controls', 'family_authorization'],
        gdprSpecialCategory: true,
      },
      {
        name: 'Maintenance Contract Management',
        purpose: 'Grave maintenance service delivery',
        categories: ['identity', 'contact', 'financial'],
        recipients: ['internal_staff', 'service_providers'],
        retention: 50,
        safeguards: ['contract', 'encryption', 'audit_logging'],
      },
      {
        name: 'Payment Processing',
        purpose: 'Service and contract payment processing',
        categories: ['financial', 'transaction'],
        recipients: ['payment_processor', 'internal_finance'],
        retention: 10,
        safeguards: ['pci_dss', 'encryption', 'tokenization'],
      },
      {
        name: 'Perpetual Care Endowment',
        purpose: 'Long-term cemetery maintenance funding',
        categories: ['identity', 'financial', 'testamentary'],
        recipients: ['trust_account', 'internal_finance'],
        retention: 'permanent',
        safeguards: ['segregated_funds', 'audit', 'regulatory_oversight'],
      },
    ],
  },
} as const;

export type ComplianceConfig = typeof complianceConfig;
