const { execSync } = require('child_process');

console.log('🚀 Setting up database...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Database setup completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure PostgreSQL is running');
  console.log('2. Update DATABASE_URL in .env file');
  console.log('3. Run: npm run prisma:migrate');
  console.log('4. Run: npm run start:dev');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}