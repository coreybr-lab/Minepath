import { LucideIcon, Sword, Shield, Zap, Heart, Pickaxe, Gem, Coins, Box, User, Ghost, Skull, Info } from 'lucide-react';

export type ResourceType = 'gold' | 'iron' | 'diamond' | 'emerald' | 'elytra' | 'wood';

export interface Resources {
  gold: number;
  iron: number;
  diamond: number;
  emerald: number;
  elytra: number;
  wood: number;
}

export type ItemType = 'weapon' | 'armor' | 'potion';
export type ArmorSlot = 'helmet' | 'chestplate' | 'leggings' | 'boots' | 'none';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  slot?: ArmorSlot;
  value: number; // Damage for weapons, defense for armor, heal for potions
  cost?: Partial<Resources>;
  emeraldCost?: number;
  tier: 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'netherite' | 'none';
  icon: string; // Added icon field
}

export type CharacterType = 'good' | 'bad' | 'block' | 'chest' | 'pitfall';

export interface SlotItem {
  id: string;
  name: string;
  type: CharacterType;
  resource?: ResourceType;
  icon: string; // URL
  description: string;
  sound?: string; // Sound URL
}

export const SLOT_ITEMS: SlotItem[] = [
  // Bad Characters
  { id: 'zombie', name: 'Zombie', type: 'bad', icon: 'https://minecraft.wiki/images/thumb/Zombie_JE3_BE2.png/150px-Zombie_JE3_BE2.png', description: 'Undead mob. Common enemy.', sound: 'https://minecraft.wiki/images/Zombie_say1.ogg' },
  { id: 'spider', name: 'Spider', type: 'bad', icon: 'https://minecraft.wiki/images/thumb/Spider_JE4_BE3.png/150px-Spider_JE4_BE3.png', description: 'Fast crawling mob. Watch out!', sound: 'https://minecraft.wiki/images/Spider_say1.ogg' },
  { id: 'creeper', name: 'Creeper', type: 'bad', icon: 'https://minecraft.wiki/images/thumb/Creeper_JE2_BE1.png/150px-Creeper_JE2_BE1.png', description: 'Explosive mob. Dangerous in battles!', sound: 'https://minecraft.wiki/images/Creeper_fuse.ogg' },
  { id: 'pillager', name: 'Pillager', type: 'bad', icon: '/assets/images/pillager.png', description: 'Ranged raider. Drops emeralds.', sound: 'https://minecraft.wiki/images/Skeleton_say1.ogg' },
  { id: 'zoglin', name: 'Zoglin', type: 'bad', icon: '/assets/images/zoglin.png', description: 'Undead hoglin. Very aggressive.', sound: 'https://minecraft.wiki/images/Zoglin_say1.ogg' },
  { id: 'ravager', name: 'Ravager', type: 'bad', icon: '/assets/images/ravager.png', description: 'Beast of the raid. High health.', sound: 'https://minecraft.wiki/images/Ravager_say1.ogg' },
  { id: 'warden', name: 'Warden', type: 'bad', icon: '/assets/images/warden.png', description: 'Blind guardian of the deep. Extremely powerful.', sound: 'https://minecraft.wiki/images/Warden_idle1.ogg' },
  { id: 'ender_dragon', name: 'Ender Dragon', type: 'bad', icon: '/assets/images/ender_dragon.png', description: 'The final boss. Good luck.', sound: 'https://minecraft.wiki/images/Ender_Dragon_growl1.ogg' },
  // Good Characters
  { id: 'steve', name: 'Steve', type: 'good', icon: '/assets/images/steve.png', description: 'The hero. Grants rare items.' },
  { id: 'alex', name: 'Alex', type: 'good', icon: '/assets/images/alex.png', description: 'The explorer. Grants rare items.' },
  { id: 'villager', name: 'Villager', type: 'good', icon: '/assets/images/villager.png', description: 'Friendly trader. Grants emeralds.' },
  { id: 'iron_golem', name: 'Iron Golem', type: 'good', icon: '/assets/images/iron_golem.png', description: 'Protector. Grants iron blocks.' },
  // Blocks
  { id: 'wood_block', name: 'Wood Block', type: 'block', resource: 'wood', icon: '/assets/images/wood_block.png', description: 'Mine for Wood. Essential for basic crafting.' },
  { id: 'gold_block', name: 'Gold Block', type: 'block', resource: 'gold', icon: '/assets/images/gold_block.png', description: 'Mine for Gold Coins. Used for crafting.' },
  { id: 'iron_block', name: 'Iron Block', type: 'block', resource: 'iron', icon: '/assets/images/iron_block.png', description: 'Mine for Iron Ingots. Used for crafting.' },
  { id: 'diamond_block', name: 'Diamond Block', type: 'block', resource: 'diamond', icon: '/assets/images/diamond_block.png', description: 'Mine for Diamonds. Best for crafting.' },
  { id: 'emerald_block', name: 'Emerald Block', type: 'block', resource: 'emerald', icon: '/assets/images/emerald_block.png', description: 'Mine for Emeralds. Used in the Shop.' },
  // Decorative Blocks
  { id: 'dirt_block', name: 'Dirt Block', type: 'block', icon: '/assets/images/dirt_block.png', description: 'Common block. May contain hidden loot!' },
  { id: 'grass_block', name: 'Grass Block', type: 'block', icon: '/assets/images/grass_block.png', description: 'Surface block. May contain hidden loot!' },
  { id: 'snow_block', name: 'Snow Block', type: 'block', icon: '/assets/images/snow_block.png', description: 'Cold block. May contain hidden loot!' },
  { id: 'sand_block', name: 'Sand Block', type: 'block', icon: '/assets/images/sand_block.png', description: 'Desert block. May contain hidden loot!' },
  // Special Items
  { id: 'chest', name: 'Treasure Chest', type: 'chest', icon: '/assets/images/chest.png', description: 'A mysterious chest! Contains powerful loot.' },
  { id: 'pitfall', name: 'Pitfall', type: 'pitfall', icon: 'https://minecraft.wiki/images/Void_JE3_BE2.png', description: 'A dangerous trap! You will lose HP if you fall in.' },
];

export const SOUNDS = {
  spin: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Dice roll sound
  win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Win chime
  hit: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Impact sound
  mine: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Mining sound (reusing spin for now)
  break: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Breaking sound
  negative: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Whoosh/Negative
  attack: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Sword swing
  drink: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Potion drink
  playerHit: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Enemy hit player
  miss: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Enemy missed player
  chaching: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3', // Banking sound
  zombie: 'https://minecraft.wiki/images/Zombie_say1.ogg',
  spider: 'https://minecraft.wiki/images/Spider_say1.ogg',
  creeper: 'https://minecraft.wiki/images/Creeper_fuse.ogg',
  pillager: 'https://minecraft.wiki/images/Skeleton_say1.ogg',
  ravager: 'https://minecraft.wiki/images/Ravager_say1.ogg',
  warden: 'https://minecraft.wiki/images/Warden_idle1.ogg',
  dragon: 'https://minecraft.wiki/images/Ender_Dragon_growl1.ogg',
};

export const WEAPONS: Item[] = [
  { id: 'fist', name: 'Fist', type: 'weapon', value: 1, tier: 'none', icon: 'https://minecraft.wiki/images/thumb/Wooden_Sword_JE2_BE2.png/150px-Wooden_Sword_JE2_BE2.png' },
  { id: 'wood_sword', name: 'Wooden Sword', type: 'weapon', value: 2, tier: 'wood', cost: { wood: 3 }, icon: 'https://minecraft.wiki/images/thumb/Wooden_Sword_JE2_BE2.png/150px-Wooden_Sword_JE2_BE2.png' },
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', value: 5, tier: 'iron', cost: { iron: 3 }, icon: 'https://minecraft.wiki/images/thumb/Iron_Sword_JE2_BE2.png/150px-Iron_Sword_JE2_BE2.png' },
  { id: 'gold_sword', name: 'Gold Sword', type: 'weapon', value: 7, tier: 'gold', cost: { gold: 3 }, icon: 'https://minecraft.wiki/images/thumb/Golden_Sword_JE3_BE2.png/150px-Golden_Sword_JE3_BE2.png' },
  { id: 'diamond_sword', name: 'Diamond Sword', type: 'weapon', value: 10, tier: 'diamond', cost: { diamond: 3 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Sword_JE3_BE2.png/150px-Diamond_Sword_JE3_BE2.png' },
  { id: 'netherite_sword', name: 'Netherite Sword', type: 'weapon', value: 13, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Netherite_Sword_JE2_BE2.png/150px-Netherite_Sword_JE2_BE2.png' },
];

export const ARMOR: Item[] = [
  // Wood Tier (Leather)
  { id: 'wood_helmet', name: 'Wooden Helmet', type: 'armor', slot: 'helmet', value: 1, tier: 'wood', cost: { wood: 2 }, icon: 'https://minecraft.wiki/images/thumb/Leather_Cap_JE4_BE2.png/150px-Leather_Cap_JE4_BE2.png' },
  { id: 'wood_boots', name: 'Wooden Boots', type: 'armor', slot: 'boots', value: 1, tier: 'wood', cost: { wood: 2 }, icon: 'https://minecraft.wiki/images/thumb/Leather_Boots_JE2_BE2.png/150px-Leather_Boots_JE2_BE2.png' },
  { id: 'wood_leggings', name: 'Wooden Leggings', type: 'armor', slot: 'leggings', value: 1, tier: 'wood', cost: { wood: 3 }, icon: 'https://minecraft.wiki/images/thumb/Leather_Pants_JE2_BE2.png/150px-Leather_Pants_JE2_BE2.png' },
  { id: 'wood_chestplate', name: 'Wooden Chestplate', type: 'armor', slot: 'chestplate', value: 2, tier: 'wood', cost: { wood: 4 }, icon: 'https://minecraft.wiki/images/thumb/Leather_Tunic_JE4_BE2.png/150px-Leather_Tunic_JE4_BE2.png' },
  // Iron Tier
  { id: 'iron_helmet', name: 'Iron Helmet', type: 'armor', slot: 'helmet', value: 1, tier: 'iron', cost: { iron: 2 }, icon: 'https://minecraft.wiki/images/thumb/Iron_Helmet_JE2_BE2.png/150px-Iron_Helmet_JE2_BE2.png' },
  { id: 'iron_boots', name: 'Iron Boots', type: 'armor', slot: 'boots', value: 1, tier: 'iron', cost: { iron: 2 }, icon: 'https://minecraft.wiki/images/thumb/Iron_Boots_JE2_BE2.png/150px-Iron_Boots_JE2_BE2.png' },
  { id: 'iron_leggings', name: 'Iron Leggings', type: 'armor', slot: 'leggings', value: 2, tier: 'iron', cost: { iron: 3 }, icon: 'https://minecraft.wiki/images/thumb/Iron_Leggings_JE2_BE2.png/150px-Iron_Leggings_JE2_BE2.png' },
  { id: 'iron_chestplate', name: 'Iron Chestplate', type: 'armor', slot: 'chestplate', value: 3, tier: 'iron', cost: { iron: 4 }, icon: 'https://minecraft.wiki/images/thumb/Iron_Chestplate_JE2_BE2.png/150px-Iron_Chestplate_JE2_BE2.png' },
  // Gold Tier
  { id: 'gold_helmet', name: 'Gold Helmet', type: 'armor', slot: 'helmet', value: 2, tier: 'gold', cost: { gold: 2 }, icon: 'https://minecraft.wiki/images/thumb/Golden_Helmet_JE2_BE2.png/150px-Golden_Helmet_JE2_BE2.png' },
  { id: 'gold_boots', name: 'Gold Boots', type: 'armor', slot: 'boots', value: 2, tier: 'gold', cost: { gold: 2 }, icon: 'https://minecraft.wiki/images/thumb/Golden_Boots_JE2_BE2.png/150px-Golden_Boots_JE2_BE2.png' },
  { id: 'gold_leggings', name: 'Gold Leggings', type: 'armor', slot: 'leggings', value: 3, tier: 'gold', cost: { gold: 3 }, icon: 'https://minecraft.wiki/images/thumb/Golden_Leggings_JE2_BE2.png/150px-Golden_Leggings_JE2_BE2.png' },
  { id: 'gold_chestplate', name: 'Gold Chestplate', type: 'armor', slot: 'chestplate', value: 5, tier: 'gold', cost: { gold: 4 }, icon: 'https://minecraft.wiki/images/thumb/Golden_Chestplate_JE2_BE2.png/150px-Golden_Chestplate_JE2_BE2.png' },
  // Diamond Tier
  { id: 'diamond_helmet', name: 'Diamond Helmet', type: 'armor', slot: 'helmet', value: 3, tier: 'diamond', cost: { diamond: 2 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Helmet_JE3_BE2.png/150px-Diamond_Helmet_JE3_BE2.png' },
  { id: 'diamond_boots', name: 'Diamond Boots', type: 'armor', slot: 'boots', value: 3, tier: 'diamond', cost: { diamond: 2 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Boots_JE2_BE2.png/150px-Diamond_Boots_JE2_BE2.png' },
  { id: 'diamond_leggings', name: 'Diamond Leggings', type: 'armor', slot: 'leggings', value: 5, tier: 'diamond', cost: { diamond: 3 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Leggings_JE2_BE2.png/150px-Diamond_Leggings_JE2_BE2.png' },
  { id: 'diamond_chestplate', name: 'Diamond Chestplate', type: 'armor', slot: 'chestplate', value: 8, tier: 'diamond', cost: { diamond: 4 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Chestplate_JE3_BE2.png/150px-Diamond_Chestplate_JE3_BE2.png' },
  // Netherite Tier
  { id: 'netherite_helmet', name: 'Netherite Helmet', type: 'armor', slot: 'helmet', value: 4, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Netherite_Helmet_JE2_BE2.png/150px-Netherite_Helmet_JE2_BE2.png' },
  { id: 'netherite_boots', name: 'Netherite Boots', type: 'armor', slot: 'boots', value: 4, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Netherite_Boots_JE2_BE2.png/150px-Netherite_Boots_JE2_BE2.png' },
  { id: 'netherite_leggings', name: 'Netherite Leggings', type: 'armor', slot: 'leggings', value: 6, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Netherite_Leggings_JE2_BE2.png/150px-Netherite_Leggings_JE2_BE2.png' },
  { id: 'netherite_chestplate', name: 'Netherite Chestplate', type: 'armor', slot: 'chestplate', value: 10, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Netherite_Chestplate_JE2_BE2.png/150px-Netherite_Chestplate_JE2_BE2.png' },
];

export const SHOP_ITEMS: Item[] = [
  { id: 'health_potion', name: 'Health Potion', type: 'potion', value: 10, tier: 'none', emeraldCost: 5, icon: 'https://minecraft.wiki/images/thumb/Regeneration_Potion_JE2_BE2.png/150px-Regeneration_Potion_JE2_BE2.png' },
  { id: 'iron_sword_shop', name: 'Iron Sword', type: 'weapon', value: 5, tier: 'iron', emeraldCost: 15, icon: 'https://minecraft.wiki/images/thumb/Iron_Sword_JE2_BE2.png/150px-Iron_Sword_JE2_BE2.png' },
  { id: 'diamond_sword_shop', name: 'Diamond Sword', type: 'weapon', value: 10, tier: 'diamond', emeraldCost: 40, icon: 'https://minecraft.wiki/images/thumb/Diamond_Sword_JE3_BE2.png/150px-Diamond_Sword_JE3_BE2.png' },
  // Armor Shop
  { id: 'iron_chestplate_shop', name: 'Iron Chestplate', type: 'armor', slot: 'chestplate', value: 3, tier: 'iron', emeraldCost: 20, icon: 'https://minecraft.wiki/images/thumb/Iron_Chestplate_JE2_BE2.png/150px-Iron_Chestplate_JE2_BE2.png' },
  { id: 'diamond_chestplate_shop', name: 'Diamond Chestplate', type: 'armor', slot: 'chestplate', value: 8, tier: 'diamond', emeraldCost: 60, icon: 'https://minecraft.wiki/images/thumb/Diamond_Chestplate_JE3_BE2.png/150px-Diamond_Chestplate_JE3_BE2.png' },
];
