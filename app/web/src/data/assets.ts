export const assetPath = (path: string): string => `/assets/${path}`;

export const logoAssets = {
  main: assetPath("v2/logo/main_logo.png"),
  newBadge: assetPath("v2/logo/new_badge.png"),
  startBadge: assetPath("v2/logo/start_badge.png"),
  goalBadge: assetPath("v2/logo/goal_badge.png"),
  winnerBanner: assetPath("v2/logo/winner_banner.png"),
};

export const effectAssets = {
  electricSparkBlue: assetPath("v2/effects/electric_spark_blue.png"),
  boostTrailBlue: assetPath("v2/effects/boost_trail_blue.png"),
  confettiAll: assetPath("v2/effects/confetti_all.png"),
  medalFirst: assetPath("v2/effects/medal_1st.png"),
};

export const kartSprites = {
  default: assetPath("v2/karts/blue_up.png"),
  blue: assetPath("v2/karts/blue_up.png"),
  blueBoost: assetPath("v2/karts/blue_boost.png"),
  blueDamage: assetPath("v2/karts/blue_damage.png"),
  pink: assetPath("v2/karts/pink_up.png"),
  pinkBoost: assetPath("v2/karts/pink_boost.png"),
  green: assetPath("v2/karts/green_up.png"),
  greenBoost: assetPath("v2/karts/green_boost.png"),
  yellow: assetPath("v2/karts/yellow_up.png"),
  yellowBoost: assetPath("v2/karts/yellow_boost.png"),
} as const;

export type KartSpriteKey = keyof typeof kartSprites;
