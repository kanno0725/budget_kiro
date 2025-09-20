const { execSync } = require('child_process');

console.log('🚀 Initializing database migration...');

try {
  console.log('📦 Creating initial migration...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  
  console.log('✅ Migration initialization completed!');
  console.log('');
  console.log('Database schema has been applied to your database.');
  console.log('You can now start the development server with: npm run start:dev');
} catch (error) {
  console.error('❌ Migration initialization failed:', error.message);
  console.log('');
  console.log('Make sure:');
  console.log('1. PostgreSQL is running');
  console.log('2. DATABASE_URL in .env is correct');
  console.log('3. Database exists and is accessible');
  process.exit(1);
}