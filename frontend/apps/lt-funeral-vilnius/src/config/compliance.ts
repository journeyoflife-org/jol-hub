/**
 * Funeral Home Compliance Configuration
 * GDPR + PCI-DSS compliance settings
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
        email: 'dpo@vilniusfuneral.lt',
        phone: '+370 5 210 5556',
      },
    },
    legalBasis: {
      serviceProvision: 'GDPR Art. 6(1)(b) - Contract performance',
      legalObligation: 'GDPR Art. 6(1)(c) - Legal obligation',
      legitimateInterest: 'GDPR Art. 6(1)(f) - Legitimate interest',
      consent: 'GDPR Art. 6(1)(a) - Consent',
    },
    dataSubjectRights: {
      access: true,
      rectification: true,
      erasure: true,
      restriction: true,
      portability: true,
      objection: true,
      automatedDecisionMaking: false,
    },
    consentManagement: {
      requiredConsents: [
        'service_agreement',
        'data_processing',
        'marketing_communications',
        'obituary_publication',
      ],
      consentVersion: '2026-01-01',
      withdrawalMechanism: 'email',
    },
    crossBorderTransfer: {
      enabled: false,
      countries: [],
      safeguards: [],
    },
    dataMinimization: {
      collectOnlyNecessary: true,
      retentionLimits: entityConfig.compliance.dataRetention,
    },
  },

  // PCI-DSS Compliance
  pciDss: {
    enabled: entityConfig.compliance.pciDss.enabled,
    level: entityConfig.compliance.pciDss.level,
    saq: entityConfig.compliance.pciDss.saq,
    assessmentDate: entityConfig.compliance.pciDss.assessmentDate,
    requirements: {
      // Requirement 1: Firewall
      networkSecurity: {
        firewalls: true,
        segmentation: true,
        dmzRequired: true,
      },
      // Requirement 2: Default passwords
      defaultCredentials: {
        changed: true,
        uniquePerSystem: true,
        sshEnabled: true,
      },
      // Requirement 3: Stored data protection
      cardholderData: {
        stored: false, // Tokenization only
        encrypted: true,
        maskingEnabled: true,
        keyManagement: 'AWS-KMS',
        keyRotation: 'annual',
      },
      // Requirement 4: Transmission encryption
      transmission: {
        tls: '1.3',
        protocols: ['TLSv1.2', 'TLSv1.3'],
        certificateManagement: 'automated',
      },
      // Requirement 5: Antivirus
      malwareProtection: {
        enabled: true,
        automaticUpdates: true,
        scanFrequency: 'daily',
      },
      // Requirement 6: Secure systems
      patchManagement: {
        criticalPatches: 'within-24-hours',
        securityPatches: 'within-1-week',
        vulnerabilityScanning: 'quarterly',
      },
      // Requirement 7: Access control
      accessControl: {
        principleLeastPrivilege: true,
        roleBasedAccess: true,
        individualAccounts: true,
      },
      // Requirement 8: Identify access
      authentication: {
        uniqueIds: true,
        twoFactorAuth: true,
        passwordPolicy: {
          minLength: 12,
          complexity: true,
          expiration: 90,
          history: 12,
        },
        lockoutThreshold: 6,
      },
      // Requirement 9: Physical access
      physicalSecurity: {
        badgeAccess: true,
        visitorLogs: true,
        mediaDestruction: 'certified',
      },
      // Requirement 10: Log access
      auditLogging: {
        enabled: true,
        retention: 365,
        logReview: 'daily',
        tamperEvident: true,
      },
      // Requirement 11: Test security
      securityTesting: {
        internalScans: 'quarterly',
        externalScans: 'quarterly',
        penetrationTesting: 'annual',
        codeReview: 'continuous',
      },
      // Requirement 12: Information security policy
      policyManagement: {
        securityPolicy: true,
        incidentResponse: true,
        awarenessTraining: 'annual',
      },
    },
    allowedPaymentMethods: ['credit_card', 'debit_card', 'bank_transfer', 'cash'],
    prohibitedStorage: ['cvv', 'magnetic_stripe', 'pin', 'ca_service_code'],
  },

  // Financial Transaction Logging
  financialLogging: {
    enabled: entityConfig.compliance.financialTransactionLogging,
    logLevel: 'detailed',
    retention: entityConfig.compliance.dataRetention.financialRecords,
    events: [
      'payment_initiated',
      'payment_completed',
      'payment_failed',
      'refund_requested',
      'refund_completed',
      'pre-need_payment',
      'invoice_generated',
    ],
    auditTrail: {
      tamperEvident: true,
      hashChain: 'sha256-chain',
      timestamp: 'iso8601-utc',
      actorTracking: true,
    },
  },

  // Pre-Need Contract Management
  preNeedCompliance: {
    enabled: entityConfig.compliance.preNeedContractManagement,
    trustAccount: {
      required: true,
      segregatedFunds: true,
      interestAccrual: true,
      annualAudit: true,
    },
    contractRequirements: {
      writtenContract: true,
      goodsAndServices: 'itemized',
      priceGuarantee: true,
      cancellationPolicy: true,
      transferPolicy: true,
    },
    disclosures: {
      licenseInformation: true,
      trustAccountDetails: true,
      priceList: true,
      grievanceProcedure: true,
    },
    stateReporting: {
      annualReport: true,
      trustAccountAudit: true,
      contractRegistry: true,
    },
  },

  // Audit Configuration
  audit: {
    enabled: entityConfig.compliance.audit.enabled,
    logLevel: entityConfig.compliance.audit.logLevel,
    retention: entityConfig.compliance.audit.retention,
    tamperEvident: entityConfig.compliance.audit.tamperEvident,
    events: {
      clientCreated: true,
      clientUpdated: true,
      clientDeleted: true,
      serviceCreated: true,
      serviceUpdated: true,
      serviceCancelled: true,
      paymentProcessed: true,
      refundProcessed: true,
      preNeedContractSigned: true,
      preNeedPaymentReceived: true,
      obituaryPublished: true,
      obituaryUnpublished: true,
      gdprRequestReceived: true,
      gdprRequestCompleted: true,
      dataExportRequested: true,
      dataDeletionRequested: true,
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
        name: 'Client Management',
        purpose: 'Funeral service delivery and client communication',
        categories: ['identity', 'contact', 'financial'],
        recipients: ['internal_staff', 'vendors', 'cemetery'],
        retention: '10 years',
        safeguards: ['encryption', 'access_control', 'audit_logging'],
      },
      {
        name: 'Payment Processing',
        purpose: 'Payment for funeral services and products',
        categories: ['financial', 'transaction'],
        recipients: ['payment_processor', 'internal_finance'],
        retention: '10 years',
        safeguards: ['encryption', 'tokenization', 'pci_dss'],
      },
      {
        name: 'Obituary Publication',
        purpose: 'Public announcement of death and service details',
        categories: ['identity', 'biographical'],
        recipients: ['public', 'media'],
        retention: 'permanent',
        safeguards: ['consent', 'family_authorization'],
      },
      {
        name: 'Pre-Need Contract Management',
        purpose: 'Advance funeral planning and payment',
        categories: ['identity', 'contact', 'financial', 'testamentary'],
        recipients: ['trust_account', 'internal_staff'],
        retention: 'permanent',
        safeguards: ['trust_account', 'encryption', 'audit_logging'],
      },
    ],
  },
} as const;

export type ComplianceConfig = typeof complianceConfig;

