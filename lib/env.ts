const serverRequired=[
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PROFESSIONAL',
  'STRIPE_PRICE_ROLLERS',
  'STRIPE_PRICE_WHEELS',
  'STRIPE_PRICE_UNLIMITED'
] as const;

export function requireEnv(name:typeof serverRequired[number]){
  const value=process.env[name];
  if(!value)throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function validateServerEnv(){
  for(const name of serverRequired)requireEnv(name);
}
