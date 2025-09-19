const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying project setup...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
  },
  {
    name: 'Prisma schema exists',
    check: () => fs.existsSync('prisma/schema.prisma'),
  },
  {
    name: 'Environment file exists',
    check: () => fs.existsSync('.env'),
  },
  {
    name: 'Main application file exists',
    check: () => fs.existsSync('src/main.ts'),
  },
  {
    name: 'App module exists',
    check: () => fs.existsSync('src/app.module.ts'),
  },
  {
    name: 'Prisma service exists',
    check: () => fs.existsSync('src/database/prisma.service.ts'),
  },
  {
    name: 'Auth module exists',
    check: () => fs.existsSync('src/modules/auth/auth.module.ts'),
  },
  {
    name: 'Transactions module exists',
    check: () => fs.existsSync('src/modules/transactions/transactions.module.ts'),
  },
  {
    name: 'Budgets module exists',
    check: () => fs.existsSync('src/modules/budgets/budgets.module.ts'),
  },
  {
    name: 'Groups module exists',
    check: () => fs.existsSync('src/modules/groups/groups.module.ts'),
  },
  {
    name: 'TypeScript config exists',
    check: () => fs.existsSync('tsconfig.json'),
  },
  {
    name: 'NestJS CLI config exists',
    check: () => fs.existsSync('nest-cli.json'),
  },
];

let allPassed = true;

checks.forEach((check) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!passed) allPassed = false;
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Project setup is complete.');
  console.log('\nNext steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Set up database: Update DATABASE_URL in .env');
  console.log('3. Generate Prisma client: npm run prisma:generate');
  console.log('4. Run migrations: npm run init:migration');
  console.log('5. Start development server: npm run start:dev');
} else {
  console.log('❌ Some checks failed. Please review the setup.');
  process.exit(1);
}