import type { components } from '@/api/generated/schema';

export const checkoutApp: components['schemas']['ApplicationDto'] = {
  id: 'b3f1c1f0-0000-4000-8000-000000000001',
  name: 'Checkout',
  code: 'CHECKOUT',
  environments: ['Production', 'UAT'],
  isActive: true,
};

export const catalogApp: components['schemas']['ApplicationDto'] = {
  id: 'b3f1c1f0-0000-4000-8000-000000000002',
  name: 'Catalog',
  code: 'CATALOG',
  environments: ['Development'],
  isActive: true,
};

export const createdIncident: components['schemas']['IncidentDetailDto'] = {
  id: '8f2c0000-0000-4000-8000-000000000001',
  number: 'INC-1042',
  title: 'Checkout fails with 500 after payment',
  status: 'New',
  rowVersion: 'AAAAAAAAB9E=',
};

export const pendingAttachment: components['schemas']['AttachmentDto'] = {
  id: 'a91c0000-0000-4000-8000-000000000001',
  fileName: 'screenshot.png',
  contentType: 'image/png',
  sizeBytes: 2048,
  scanStatus: 'Pending',
};
