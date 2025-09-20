const { execSync } = require('child_process');

console.log('🔍 Checking database connection...\n');

try {
  // Check if Docker container is running
  console.log('📦 Checking Docker container status...');
  const containerStatus = execSync('docker-compose ps postgres', { encoding: 'utf8' });
  
  if (containerStatus.includes('Up')) {
    console.log('✅ PostgreSQL container is running');
  } else {
    console.log('❌ PostgreSQL container is not running');
    console.log('Run: npm run docker:up');
    process.exit(1);
  }

  // Test database connection using Prisma
  console.log('🔌 Testing database connection...');
  execSync('npx prisma db pull --print', { stdio: 'pipe' });
  console.log('✅ Database connection successful');

  console.log('\n🎉 Database is ready!');
  console.log('You can now run: npm run prisma:migrate');
  
} catch (error) {
  console.error('❌ Database connection failed');
  console.log('\nTroubleshooting steps:');
  console.log('1. Start PostgreSQL: npm run docker:up');
  console.log('2. Wait for container to be ready (check logs: npm run docker:logs)');
  console.log('3. Verify DATABASE_URL in .env file');
  console.log('4. Try again: npm run check:db');
  process.exit(1);
}