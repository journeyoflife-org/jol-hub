# JOL-HUB Enterprise Monorepo

**Journey Of Life** - 400,000 websites for religious institutions across 27 EU countries.

## Quick Start

```bash
# Clone with sparse checkout (recommended for developers)
git clone --filter=blob:none --no-checkout git@github.com:journeyoflife-org/jol-hub.git
cd jol-hub
git sparse-checkout init --cone
git sparse-checkout set backend/django frontend/react countries/lt
git checkout main

