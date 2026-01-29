// Load environment variables from .env.test if it exists
const fs = require('fs');
const path = require('path');

const envTestPath = path.resolve(__dirname, '.env.test');

if (fs.existsSync(envTestPath)) {
  const envConfig = fs.readFileSync(envTestPath, 'utf8');
  const envVars = envConfig.split('\n').filter(line => line && !line.startsWith('#'));
  
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      process.env[key.trim()] = value;
    }
  });
  
  console.log('✓ Loaded environment variables from .env.test');
} else {
  console.warn('⚠ .env.test file not found. Tests may be skipped.');
  console.warn('  Copy .env.test.example to .env.test and configure your Supabase credentials.');
}
