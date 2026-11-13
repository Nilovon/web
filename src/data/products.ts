export interface ProductLink {
  label: string;
  href: string;
}

export interface Product {
  id: string;
  name: string;
  kind: string;
  license: string;
  tagline: string;
  description: string;
  features: string[];
  links: ProductLink[];
  stack: string;
  /** Colors for the 3D slab's top texture and sides, also used for the index square. */
  slab: { bg: string; fg: string; side: string; edge: number };
}

export const products: Product[] = [
  {
    id: 'lumvika',
    name: 'Lumvika',
    kind: 'Platform',
    license: 'AGPL-3.0',
    tagline: 'AI coworkers that run your work',
    description:
      'Pick or build an agent, connect your tools, and it works on its own machine around the clock. You bring the model through your own API key or subscription. Lumvika runs on your infrastructure from two public Docker images, and every workspace has every feature.',
    features: [
      'Agents with their own machine, browser and screen',
      'Connect the tools your team already uses',
      'Bring your own model: API key or subscription',
      'Self-host with Docker Compose, Postgres and S3-compatible storage',
      'Web app plus an iPhone app',
    ],
    links: [
      { label: 'View on GitHub', href: 'https://github.com/Nilovon/lumvika' },
      { label: 'Self-hosting guide', href: 'https://docs.lumvika.com/self-host/install' },
    ],
    stack: 'Next.js · React · Hono · Expo · PostgreSQL',
    slab: { bg: '#2347D6', fg: '#FFFFFF', side: '#1A35A3', edge: 0x0f1f66 },
  },
  {
    id: 'bucketkit',
    name: 'BucketKit',
    kind: 'SDK',
    license: 'Open source',
    tagline: 'Typesafe S3 uploads for Node.js and React',
    description:
      'Handles S3-compatible file uploads with types across the whole pipeline, from presigned URLs on the server to progress tracking in React.',
    features: [
      'Type safety from server to client',
      'React hooks for progress, drag and drop and validation',
      'Works with AWS S3, MinIO, R2 and other S3-compatible storage',
      'Zero dependencies in the core package',
    ],
    links: [{ label: 'bucketkit.nilovon.com', href: 'https://bucketkit.nilovon.com/' }],
    stack: 'TypeScript · React · Node.js',
    slab: { bg: '#FFFFFF', fg: '#151514', side: '#D9D8D3', edge: 0x151514 },
  },
  {
    id: 'hcloud',
    name: 'hcloud-js',
    kind: 'SDK',
    license: 'Open source',
    tagline: 'Typesafe Hetzner Cloud SDK',
    description:
      'Manage servers, networks, firewalls and every other Hetzner Cloud resource from TypeScript, with autocompletion for each call.',
    features: [
      'Covers the full Hetzner Cloud API',
      'Errors show up in your editor, not in production',
      'Made for infrastructure scripts and CI pipelines',
    ],
    links: [{ label: 'hcloud-js.nilovon.com', href: 'https://hcloud-js.nilovon.com/' }],
    stack: 'TypeScript · Hetzner Cloud',
    slab: { bg: '#151514', fg: '#F4F3EF', side: '#0B0B0A', edge: 0xf4f3ef },
  },
];

export const pad = (n: number) => String(n).padStart(2, '0');
