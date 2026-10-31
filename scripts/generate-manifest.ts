import fs from 'fs';
import path from 'path';

const SCENARIOS_DIR = path.join(process.cwd(), 'data', 'scenarios');
const OUTPUT_DATA = path.join(process.cwd(), 'data', 'content-manifest.json');
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_PUBLIC = path.join(PUBLIC_DATA_DIR, 'content-manifest.json');

interface ContentManifest {
  generated_at: string;
  scenarios: Record<string, { version: number }>;
}

async function generateManifest() {
  console.log(`Scanning scenarios in ${SCENARIOS_DIR}...`);
  
  if (!fs.existsSync(SCENARIOS_DIR)) {
    console.error(`Directory not found: ${SCENARIOS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SCENARIOS_DIR).filter(f => f.endsWith('.json'));
  const manifest: ContentManifest = {
    generated_at: new Date().toISOString(),
    scenarios: {}
  };

  for (const file of files) {
    const filePath = path.join(SCENARIOS_DIR, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const slug = path.basename(file, '.json');
      // Fallback to version 1 if not explicitly set
      const version = content.content_version || 1;
      
      manifest.scenarios[slug] = { version };
      console.log(`- ${slug}: v${version}`);
    } catch (e) {
      console.error(`Error parsing ${file}:`, e);
    }
  }

  const jsonOut = JSON.stringify(manifest, null, 2);

  // Write to data/content-manifest.json (as per expected output)
  fs.writeFileSync(OUTPUT_DATA, jsonOut, 'utf-8');
  console.log(`\nWrote manifest to: ${OUTPUT_DATA}`);

  // Write to public/data/content-manifest.json (so it can be fetched by the client via /data/content-manifest.json)
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_PUBLIC, jsonOut, 'utf-8');
  console.log(`Wrote manifest to: ${OUTPUT_PUBLIC}`);
}

generateManifest().catch(err => {
  console.error('Fatal error generating manifest:', err);
  process.exit(1);
});
