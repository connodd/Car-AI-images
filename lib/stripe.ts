import Stripe from 'stripe';
export const stripe=()=>new Stripe(process.env.STRIPE_SECRET_KEY!);
export function priceFor(mode:string){if(mode==='professional')return process.env.STRIPE_PRICE_PROFESSIONAL!;if(mode==='rollers')return process.env.STRIPE_PRICE_ROLLERS!;if(mode==='wheels')return process.env.STRIPE_PRICE_WHEELS!;throw new Error('INVALID_MODE')}
