import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Maps web lucide-style kebab names to MaterialCommunityIcons */
const NAME_MAP: Record<string, IconName> = {
  briefcase: 'briefcase-outline',
  'shopping-cart': 'cart-outline',
  car: 'car-outline',
  'arrow-right-left': 'swap-horizontal',
  utensils: 'silverware-fork-knife',
  laptop: 'laptop',
  'shopping-bag': 'shopping-outline',
  zap: 'lightning-bolt-outline',
  ticket: 'ticket-outline',
  'heart-pulse': 'heart-pulse',
  'book-open': 'book-open-page-variant',
  send: 'send',
  download: 'download',
  plus: 'plus',
  wallet: 'wallet-outline',
  'help-circle': 'help-circle-outline',
  bell: 'bell-outline',
  filter: 'filter-variant',
  mail: 'email-outline',
  lock: 'lock-outline',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  user: 'account-outline',
  'chevron-right': 'chevron-right',
  moon: 'weather-night',
  sun: 'white-balance-sunny',
  globe: 'earth',
  shield: 'shield-outline',
  logout: 'logout',
  check: 'check',
  'arrow-right': 'arrow-right',
  share: 'share-variant-outline',
  copy: 'content-copy',
  x: 'close',
  trendingup: 'trending-up',
  trendingdown: 'trending-down',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  search: 'magnify',
  tag: 'tag-outline',
  'alert-circle': 'alert-circle-outline',
  users: 'account-multiple-outline',
  'cash': 'cash',
  fingerprint: 'fingerprint',
};

function toKey(name: string): string {
  return name.replace(/-/g, '').toLowerCase();
}

export function DynamicIcon({
  name,
  size = 24,
  color,
}: {
  name: string;
  size?: number;
  color: string;
}) {
  const mapped = NAME_MAP[name] ?? NAME_MAP[toKey(name)] ?? ('help-circle-outline' as IconName);
  return <MaterialCommunityIcons name={mapped} size={size} color={color} />;
}
