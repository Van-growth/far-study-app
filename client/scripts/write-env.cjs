// Render Static Site에서 process.env → .env 파일로 변환
// Vite는 .env 파일에서 VITE_* 변수를 읽어 빌드에 주입
const fs = require('fs');

const VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_URL',
];

const lines = VARS
  .filter((key) => process.env[key])
  .map((key) => `${key}=${process.env[key]}`);

if (lines.length > 0) {
  fs.writeFileSync('.env', lines.join('\n') + '\n');
  console.log(`[write-env] ✅ .env created with ${lines.length} vars:`);
  lines.forEach((l) => {
    const [k, v] = l.split('=');
    console.log(`  ${k} = ${v.slice(0, 20)}...`);
  });
} else {
  console.log('[write-env] ⚠️  No VITE_ env vars in process.env (local dev uses .env file directly)');
}
