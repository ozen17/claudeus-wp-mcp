import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const TIER_PRICES: Record<SubscriptionTier, { price: number; maxSites: number; maxRequests: number }> = {
  FREE: { price: 0, maxSites: 1, maxRequests: 50 },
  PRO: { price: 29, maxSites: 5, maxRequests: 500 },
  ENTERPRISE: { price: 99, maxSites: 999, maxRequests: 999999 },
};

export class SubscriptionService {
  /**
   * Get user subscription
   */
  async getSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      throw new AppError('Subscription not found', 404);
    }

    return {
      ...user.subscription,
      pricing: TIER_PRICES[user.subscription.tier],
    };
  }

  /**
   * Upgrade subscription plan
   */
  async upgradePlan(
    userId: string,
    tier: 'PRO' | 'ENTERPRISE',
    paymentMethodId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      throw new AppError('User or subscription not found', 404);
    }

    // Get tier config
    const config = TIER_PRICES[tier];

    // Create or update Stripe subscription
    let stripeSubscription;

    if (!user.subscription.stripeCustomerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Claudeus WordPress AI Assistant - ${tier}`,
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: config.price * 100,
            },
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update subscription
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          tier,
          status: 'ACTIVE',
          stripeCustomerId: customer.id,
          stripeSubscriptionId: stripeSubscription.id,
          maxSites: config.maxSites,
          maxRequests: config.maxRequests,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
    } else {
      // Update existing subscription
      if (user.subscription.stripeSubscriptionId) {
        stripeSubscription = await stripe.subscriptions.update(
          user.subscription.stripeSubscriptionId,
          {
            items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `Claudeus WordPress AI Assistant - ${tier}`,
                  },
                  recurring: {
                    interval: 'month',
                  },
                  unit_amount: config.price * 100,
                },
              },
            ],
          }
        );

        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            tier,
            status: 'ACTIVE',
            maxSites: config.maxSites,
            maxRequests: config.maxRequests,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        });
      }
    }

    return {
      message: `Subscription upgraded to ${tier}`,
      tier,
      pricing: config,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      throw new AppError('Subscription not found', 404);
    }

    if (user.subscription.stripeSubscriptionId) {
      // Cancel at period end
      await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }
}
