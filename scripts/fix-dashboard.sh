#!/bin/bash
# FILE: /opt/jol/git/jol-hub/scripts/fix-dashboard.sh

echo "=== JOL Admin Dashboard Recovery ==="

# Navigate to correct directory
DASHBOARD_DIR="/opt/jol/git/jol-hub/frontend/apps/admin-dashboard"
cd "$DASHBOARD_DIR" || { echo "ERROR: Directory not found"; exit 1; }

echo "[1/7] Current directory: $(pwd)"

echo "[2/7] Installing missing TypeScript dependencies..."
pnpm add -D typescript @types/node @types/react @types/react-dom

echo "[3/7] Installing missing project dependencies..."
pnpm install

echo "[4/7] Creating tsconfig.json if missing..."
if [ ! -f "tsconfig.json" ]; then
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
  echo "  Created tsconfig.json"
fi

echo "[5/7] Creating next-env.d.ts if missing..."
if [ ! -f "next-env.d.ts" ]; then
  echo '/// <reference types="next" />' > next-env.d.ts
  echo '/// <reference types="next/image-types/global" />' >> next-env.d.ts
  echo "  Created next-env.d.ts"
fi

echo "[6/7] Running TypeScript check..."
npx tsc --noEmit 2>&1 | tee /tmp/ts-errors.txt | head -20
ERROR_COUNT=$(grep -c "error TS" /tmp/ts-errors.txt 2>/dev/null || echo "0")
echo "  Found $ERROR_COUNT TypeScript errors"

if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "[6.5/7] Applying automated fixes..."
  # Run the fix script from earlier
  bash scripts/fix-typescript-errors.sh 2>/dev/null || echo "  Fix script not found, manual fixes needed"
fi

echo "[7/7] Build test..."
pnpm build 2>&1 | tail -20

echo ""
echo "=== Recovery Complete ==="
echo "To start development server:"
echo "  cd $DASHBOARD_DIR"
echo "  pnpm dev"
echo ""
echo "Access at: http://localhost:3000"