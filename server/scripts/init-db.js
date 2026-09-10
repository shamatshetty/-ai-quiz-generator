import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
const serverDir = path.resolve(__dirname, '..');

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('=============================================');
  console.log('🔄 [DB Sync] Initializing database at startup...');

  const rawUrl = (process.env.DATABASE_URL || '').trim();
  const isPostgres = rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://');

  let schema = fs.readFileSync(schemaPath, 'utf8');
  const desiredProvider = isPostgres ? 'postgresql' : 'sqlite';
  
  if (isPostgres) {
    schema = schema.replace(/provider\s*=\s*"[^"]+"/, 'provider = "postgresql"');
    schema = schema.replace(/url\s*=\s*[^\n]+/, 'url      = env("DATABASE_URL")');
  } else {
    schema = schema.replace(/provider\s*=\s*"[^"]+"/, 'provider = "sqlite"');
    schema = schema.replace(/url\s*=\s*[^\n]+/, 'url      = env("DATABASE_URL")');
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = 'file:./dev.db';
    }
  }
  fs.writeFileSync(schemaPath, schema, 'utf8');

  console.log(`🔌 [DB Sync] Target provider: ${desiredProvider}`);

  // 1. Run prisma db push with safety timeout
  try {
    console.log('🚀 [DB Sync] Pushing schema to database (non-interactive, timeout 30s)...');
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: serverDir,
      stdio: 'inherit',
      timeout: 30000,
      env: {
        ...process.env,
        DATABASE_URL: isPostgres ? rawUrl : (process.env.DATABASE_URL || 'file:./dev.db')
      }
    });
    console.log('✅ [DB Sync] Schema successfully synchronized with database!');
  } catch (err) {
    console.warn('⚠️ [DB Sync Warning] prisma db push timed out or encountered an issue:', err.message);
    console.warn('⚠️ Continuing server launch anyway so service remains online.');
    return;
  }

  // 2. Check if database needs initial seeding
  try {
    const { default: prisma } = await import('../src/prisma.js');
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('🌱 [DB Sync] Fresh database detected (0 users). Seeding starter quizzes and demo accounts...');
      execSync('node prisma/seed.js', {
        cwd: serverDir,
        stdio: 'inherit',
        timeout: 30000,
        env: {
          ...process.env,
          DATABASE_URL: isPostgres ? rawUrl : (process.env.DATABASE_URL || 'file:./dev.db')
        }
      });
      console.log('✅ [DB Sync] Seeding completed successfully!');
    } else {
      console.log(`📊 [DB Sync] Database already initialized with ${userCount} user(s). Preserving existing data.`);
    }
  } catch (seedErr) {
    console.warn('⚠️ [DB Sync Warning] Seeding check skipped:', seedErr.message);
  }
  console.log('=============================================');
}

// Run if called directly as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase().catch((err) => {
    console.error('Fatal DB Init error:', err);
    process.exit(1);
  });
}
