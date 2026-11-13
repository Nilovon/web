# Nilovon Web

Source for [nilovon.com](https://nilovon.com), the website of Nilovon, a small software studio from Germany. We build self-hostable tools and typesafe SDKs in TypeScript, all open source.

The site is a single page built with [Astro](https://astro.build). An interactive [three.js](https://threejs.org) scene in the hero shows the products as an exploded stack of 3D slabs.

## Products

| Product | Type | Status |
| --- | --- | --- |
| [Lumvika](https://github.com/Nilovon/lumvika) | AI coworkers that run your work, self-hostable | Open source (AGPL-3.0) |
| [BucketKit](https://bucketkit.nilovon.com/) | Typesafe S3 uploads for Node.js and React | Open source |
| [hcloud-js](https://hcloud-js.nilovon.com/) | Typesafe Hetzner Cloud SDK | Open source |

Product data lives in [`src/data/products.ts`](src/data/products.ts). The hero stage, the 3D scene and the products section all read from this file, so a new product only needs a new entry there.

## Getting started

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro -- <cmd>` | Run Astro CLI commands such as `astro check` |

## Project structure

```text
src/
├── components/   Page sections (Nav, Hero, Products, Principles, Contact)
├── data/         Product definitions
├── layouts/      Base layout with global styles and design tokens
├── pages/        index.astro
└── scripts/      three.js scene
public/           Static assets
```

## Contact

Questions, ideas or contributions: [hello@nilovon.com](mailto:hello@nilovon.com) or open an issue on [GitHub](https://github.com/Nilovon).
