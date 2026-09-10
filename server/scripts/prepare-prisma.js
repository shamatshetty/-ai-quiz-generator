import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
const serverDir = path.resolve(__dirname, '..');

export function preparePrisma() {
  console.log('----------------------------------------------------');
  console.log('🛠️  [QuizPop Build] Configuring Prisma schema & client...');
  
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  const isPostgres = rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://');
  
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  if (isPostgres) {
    console.log('🐘 Target Database: PostgreSQL detected from DATABASE_URL');
    schema = schema.replace(/provider\s*=\s*"[^"]+"/, 'provider = "postgresql"');
    schema = schema.replace(/url\s*=\s*[^\n]+/, 'url      = env("DATABASE_URL")');
  } else {
    console.log('🗄️  Target Database: SQLite (local / self-contained)');
    schema = schema.replace(/provider\s*=\s*"[^"]+"/, 'provider = "sqlite"');
    schema = schema.replace(/url\s*=\s*[^\n]+/, 'url      = env("DATABASE_URL")');
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = 'file:./dev.db';
    }
  }
  
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log(`📝 Updated ${path.basename(schemaPath)} provider: ${isPostgres ? 'postgresql' : 'sqlite'}`);
  
  console.log('⚡ Generating Prisma Client...');
  try {
    execSync('npx prisma generate', {
      cwd: serverDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: isPostgres ? rawUrl : (process.env.DATABASE_URL || 'file:./dev.db')
      }
    });
    console.log('✅ Prisma Client successfully generated.');
  } catch (err) {
    console.error('❌ Failed to run prisma generate:', err.message);
    process.exit(1);
  }
  console.log('----------------------------------------------------');
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  preparePrisma();
}
