export interface Product {
  id: string;
  name: string;
  kind: string;
  badge: { label: string; variant: 'outline' | 'solid' };
  openSource: boolean;
  tagline: string;
  description: string;
  features: string[];
  href: string;
  cta: string;
  stack: string;
  /** Colors for the 3D slab's top texture and sides. */
  slab: { bg: string; fg: string; side: string; edge: number };
}

export const products: Product[] = [
  {
    id: 'tenvima',
    name: 'Tenvima',
    kind: 'Platform',
    badge: { label: 'Alpha', variant: 'outline' },
    openSource: false,
    tagline: 'Modular all-in-one workspace for IT service providers',
    description:
      'A modular platform that bundles tenant management, helpdesk and knowledge base into one lean workspace — built for IT-Systemhäuser and MSPs who are tired of juggling bloated suites and ten different logins. Connect Microsoft Entra tenants, run a clean ticket system with SLAs, and keep your docs in a Confluence-style wiki — all sharing the same identity, permissions and UI. Hosted in the EU (Frankfurt) with per-workspace schema isolation.',
    features: [
      'Multi-tenant Microsoft 365 management via Entra OIDC',
      'Helpdesk with SLA tracking, queues and customer portal',
      'Wiki with spaces, tags, versioning and sub-100ms full-text search',
      'Activate only the modules you need — pay per seat plus module flat',
      'EU-hosted, DSGVO-konform, tenant-isolated by design',
      'REST API and webhooks for your existing workflows',
    ],
    href: 'https://tenvima.com/',
    cta: 'Visit tenvima.com',
    stack: 'TypeScript · React · Node.js · PostgreSQL',
    slab: { bg: '#ECEAE4', fg: '#121210', side: '#BDBAB0', edge: 0x121210 },
  },
  {
    id: 'bucketkit',
    name: 'BucketKit',
    kind: 'SDK',
    badge: { label: 'Open source', variant: 'solid' },
    openSource: true,
    tagline: 'Typesafe S3 uploads for Node.js and React',
    description:
      'A developer-first SDK for handling S3-compatible file uploads. BucketKit gives you full type safety across your upload pipeline, from presigned URL generation on the server to progress tracking in React. No more guessing what your upload config looks like at runtime.',
    features: [
      'End-to-end type safety from server to client',
      'React hooks for upload progress, drag-and-drop, and file validation',
      'Works with any S3-compatible storage (AWS, Minio, R2, etc.)',
      'Lightweight — zero dependencies in the core package',
    ],
    href: 'https://bucketkit.nilovon.com/',
    cta: 'Visit website',
    stack: 'TypeScript · React · Node.js · S3',
    slab: { bg: '#F2B705', fg: '#121210', side: '#B88A00', edge: 0x121210 },
  },
  {
    id: 'hcloud',
    name: 'hcloud-js',
    kind: 'SDK',
    badge: { label: 'Open source', variant: 'solid' },
    openSource: true,
    tagline: 'Typesafe Hetzner Cloud SDK',
    description:
      'A TypeScript SDK for the Hetzner Cloud API. Manage servers, networks, firewalls, and all other Hetzner Cloud resources with full type safety and autocompletion. Built for developers who automate their infrastructure and want confidence in every API call.',
    features: [
      'Complete coverage of the Hetzner Cloud API',
      'Full TypeScript types — catch errors before they hit production',
      'Designed for infrastructure automation and CI/CD pipelines',
    ],
    href: 'https://hcloud-js.nilovon.com/',
    cta: 'Visit website',
    stack: 'TypeScript · Hetzner Cloud',
    slab: { bg: '#3A3935', fg: '#ECEAE4', side: '#262522', edge: 0xeceae4 },
  },
];

export const pad = (n: number) => String(n).padStart(2, '0');
