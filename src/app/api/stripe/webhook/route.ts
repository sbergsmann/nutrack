
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { updateUserPlan } from '@/lib/data';
import { initializeApp, getApps, App, cert } from "firebase-admin/app";

if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!))
    });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      throw new Error('Webhook secret or signature is missing.');
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.client_reference_id || !session.metadata?.plan) {
            throw new Error('Missing metadata from checkout session');
        }

        const userId = session.client_reference_id;
        const plan = session.metadata.plan as 'Monthly' | 'Yearly';

        const firestore = getFirestore();
        await updateUserPlan(firestore, userId, plan);

        console.log(`✅ User ${userId} subscribed to ${plan} plan.`);
        break;
      }
      default: {
        // console.log(`Unhandled event type: ${event.type}`);
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Webhook handler failed.', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
