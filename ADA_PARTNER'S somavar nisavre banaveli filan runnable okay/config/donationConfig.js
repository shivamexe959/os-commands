// ============================================================
// ADA Algorithm Lab — Donation Configuration
// CHANGE ONLY THIS FILE to update payment details.
// ============================================================
export const DONATION_CONFIG = {
  developerName:  'Shivam Joshi',
  upiId:          'IT IS FREE BUDDY',               // <-- change this
  upiName:        'ADA Algorithm Lab',           // <-- change this
  qrImageUrl:     'assets/qr/donation-qr.png',  // <-- replace QR image
  buyMeCoffeeUrl: 'https://buymeacoffee.com/joshi.shivam12507',

  currency: '₹',
  amounts: [49, 99, 199, 499],                  // quick-select amounts

  monthlyGoal:   5000,                          // ₹ monthly target
  lifetimeGoal:  50000,                         // ₹ lifetime target

  thankYouMessage: 'Thank you for supporting ADA Algorithm Lab! Your generosity keeps this free for all students. 🙏',

  // XP reward for donating
  xpReward: 500,
  badgeReward: 'supporter'
};
