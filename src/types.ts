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
  icon?: string; // Added icon field
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
  { id: 'zombie', name: 'Zombie', type: 'bad', icon: 'https://minecraft.wiki/images/thumb/Zombie_JE3_BE2.png/200px-Zombie_JE3_BE2.png', description: 'Drops weapons/armor, emeralds, healing.', sound: 'https://minecraft.wiki/images/Zombie_say1.ogg' },
  { id: 'spider', name: 'Spider', type: 'bad', icon: 'https://minecraft.wiki/images/thumb/Spider_JE4_BE3.png/200px-Spider_JE4_BE3.png', description: 'Drops weapons/armor, emeralds, healing.', sound: 'https://minecraft.wiki/images/Spider_say1.ogg' },
  { id: 'creeper', name: 'Creeper', type: 'bad', icon: 'https://upload.wikimedia.org/wikipedia/en/4/49/Creeper_%28Minecraft%29.png', description: 'Drops weapons/armor, emeralds, healing.', sound: 'https://minecraft.wiki/images/Creeper_fuse.ogg' },
  { id: 'pillager', name: 'Pillager', type: 'bad', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/1/1b/Pillager_JE2.png/revision/latest?cb=20220612181538', description: 'Drops weapons/armor, emeralds, healing.', sound: 'https://minecraft.wiki/images/Skeleton_say1.ogg' },
  { id: 'zoglin', name: 'Zoglin', type: 'bad', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e3/Zoglin.png/revision/latest?cb=20220530015046', description: 'Drops weapons/armor, emeralds, healing.', sound: 'https://minecraft.wiki/images/Zoglin_say1.ogg' },
  { id: 'ravager', name: 'Ravager', type: 'bad', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/a/a3/Ravager_JE1.png/revision/latest/scale-to-width-down/1200?cb=20210120025723', description: 'Drops weapons/armor, emeralds, healing.', sound: 'https://minecraft.wiki/images/Ravager_say1.ogg' },
  { id: 'warden', name: 'Warden', type: 'bad', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/7/7f/Warden_Layers.png/revision/latest/scale-to-width-down/250?cb=20230320041641', description: 'Drops netherite, diamonds, emeralds, healing.', sound: 'https://minecraft.wiki/images/Warden_idle1.ogg' },
  { id: 'ender_dragon', name: 'Ender Dragon', type: 'bad', icon: 'https://static.wikia.nocookie.net/dragons/images/f/fe/Enderdragonboss.png/revision/latest/thumbnail/width/360/height/450?cb=20170915064049', description: 'Drops netherite, diamonds, emeralds, healing.', sound: 'https://minecraft.wiki/images/Ender_Dragon_growl1.ogg' },
  // Good Characters
  { id: 'steve', name: 'Steve', type: 'good', icon: 'https://static.wikia.nocookie.net/vsdebating/images/e/ed/MinecraftStevePromoArt.png/revision/latest/scale-to-width-down/400?cb=20221015175441', description: 'Gives healing and weapons/armor.' },
  { id: 'alex', name: 'Alex', type: 'good', icon: 'https://minecraft.wiki/images/thumb/Alex_%28slim%29_JE3.png/150px-Alex_%28slim%29_JE3.png?baaf0', description: 'Gives healing and potions.' },
  { id: 'villager', name: 'Villager', type: 'good', icon: 'https://minecraft.wiki/images/thumb/Panicked_Villager.gif/230px-Panicked_Villager.gif?c7f6d', description: 'Gives emeralds.' },
  { id: 'iron_golem', name: 'Iron Golem', type: 'good', icon: 'https://minecraft.wiki/images/thumb/Iron_Golem_JE2_BE2.png/200px-Iron_Golem_JE2_BE2.png', description: 'Gives iron.' },
  // Blocks
  { id: 'wood_block', name: 'Wood Block', type: 'block', resource: 'wood', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/0/0a/Oak_Wood_%28UD%29_JE2.png/revision/latest?cb=20190403033224', description: 'Drops wood.' },
  { id: 'gold_block', name: 'Gold Block', type: 'block', resource: 'gold', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/7/72/Block_of_Gold_JE6_BE3.png/revision/latest?cb=20200226013525', description: 'Drops gold.' },
  { id: 'iron_block', name: 'Iron Block', type: 'block', resource: 'iron', icon: 'https://minecraft.wiki/images/thumb/Block_of_Iron_JE4_BE3.png/200px-Block_of_Iron_JE4_BE3.png', description: 'Drops iron.' },
  { id: 'diamond_block', name: 'Diamond Block', type: 'block', resource: 'diamond', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/c/c8/Block_of_Diamond_JE5_BE3.png/revision/latest/thumbnail/width/360/height/360?cb=20200226013851', description: 'Drops diamonds.' },
  { id: 'emerald_block', name: 'Emerald Block', type: 'block', resource: 'emerald', icon: 'https://minecraft.wiki/images/thumb/Block_of_Emerald_JE4_BE3.png/200px-Block_of_Emerald_JE4_BE3.png', description: 'Drops emeralds.' },
  // Decorative Blocks
  { id: 'dirt_block', name: 'Dirt Block', type: 'block', icon: 'https://minecraft.wiki/images/thumb/Dirt_JE2_BE2.png/200px-Dirt_JE2_BE2.png', description: 'May drop weapons/armor, emeralds.' },
  { id: 'grass_block', name: 'Grass Block', type: 'block', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/1/17/Grass_Block_%28graphics_fast%29_JE3.png/revision/latest?cb=20200831093828', description: 'May drop weapons/armor, emeralds.' },
  { id: 'snow_block', name: 'Snow Block', type: 'block', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/6/66/Snow_Block_JE1_BE1.png/revision/latest?cb=20200903061334', description: 'May drop weapons/armor, emeralds.' },
  { id: 'sand_block', name: 'Sand Block', type: 'block', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/7/71/Sand_JE5_BE3.png/revision/latest/scale-to-width/360?cb=20240724192202', description: 'May drop weapons/armor, emeralds.' },
  // Special Items
  { id: 'chest', name: 'Treasure Chest', type: 'chest', icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/7/72/Chest_%28S%29_JE2.png/revision/latest?cb=20191230024542', description: 'A mysterious chest! Contains powerful loot.' },
  { id: 'pitfall', name: 'Cliff', type: 'pitfall', icon: 'https://minecraft.wiki/images/thumb/Stone_JE5_BE3.png/200px-Stone_JE5_BE3.png', description: 'A dangerous cliff! You will lose HP if you fall off.' },
];

export const SOUNDS = {
  crit: 'https://assets.mixkit.co/active_storage/sfx/1476/1476.mp3', // Critical hit sound
  spin: 'https://sounds.sfxengine.com/sound-effects/se_xf5zsermlz5iucg3.wav', // Dice roll sound
  win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Win chime
  hit: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Impact sound
  mine: 'https://sounds.sfxengine.com/ground-shaking-rock-smash-zgisbxko.wav', // Mining sound
  break: 'https://sounds.sfxengine.com/ground-shaking-rock-smash-zgisbxko.wav', // Breaking sound
  negative: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Whoosh/Negative
  attack: 'https://www.myinstants.com/media/sounds/woosh_s21KzKN.mp3', // Sword swing
  defeat: 'https://assets.mixkit.co/active_storage/sfx/1999/1999.wav', // Enemy defeated (final blow)
  drink: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Potion drink
  playerHit: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Enemy hit player
  miss: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Enemy missed player
  chaching: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3', // Banking sound
  jackpot: 'https://assets.mixkit.co/active_storage/sfx/1934/1934.wav', // Jackpot victory sound
  zombie: 'https://assets.mixkit.co/active_storage/sfx/297/297.wav',
  spider: 'https://minecraft.wiki/images/Spider_say1.ogg',
  spiderAttack: 'https://assets.mixkit.co/active_storage/sfx/2428/2428.wav',
  creeper: 'https://minecraft.wiki/images/Creeper_fuse.ogg',
  pillager: 'https://minecraft.wiki/images/Skeleton_say1.ogg',
  ravager: 'https://minecraft.wiki/images/transcoded/Ravager_roar4.ogg/Ravager_roar4.ogg.mp3',
  ravagerDeath: 'https://minecraft.wiki/images/transcoded/Ravager_death2.ogg/Ravager_death2.ogg.mp3',
  raid: 'https://assets.mixkit.co/active_storage/sfx/713/713.wav',
  warden: 'https://minecraft.wiki/images/Warden_idle1.ogg',
  wardenWarning: 'https://minecraft.wiki/images/Warden_emerge1.ogg',
  dragon: 'https://minecraft.wiki/images/Ender_Dragon_growl1.ogg',
  dragonWarning: 'https://minecraft.wiki/images/Ender_Dragon_roar1.ogg',
  death: 'https://assets.mixkit.co/active_storage/sfx/3168/3168.wav', // Game Over
  hurt: 'https://minecraft.wiki/images/Hurt_flesh1.ogg', // Minecraft Hurt
  menuOpen: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Subtle menu sound
  tabSelect: 'https://assets.mixkit.co/active_storage/sfx/1809/1809.wav',
  criticalHit: 'https://assets.mixkit.co/active_storage/sfx/2155/2155.mp3',
  firework: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  explosion: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
};

export const WEAPONS: Item[] = [
  { id: 'fist', name: 'Fist', type: 'weapon', value: 1, tier: 'none', icon: '🤜' },
  { id: 'wood_sword', name: 'Wooden Sword', type: 'weapon', value: 3, tier: 'wood', cost: { wood: 5 }, icon: 'https://minecraft.wiki/images/thumb/Wooden_Sword_JE2_BE2.png/150px-Wooden_Sword_JE2_BE2.png' },
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', value: 5, tier: 'iron', cost: { iron: 5 }, icon: 'https://minecraft.wiki/images/thumb/Iron_Sword_JE2_BE2.png/150px-Iron_Sword_JE2_BE2.png' },
  { id: 'gold_sword', name: 'Gold Sword', type: 'weapon', value: 7, tier: 'gold', cost: { gold: 5 }, icon: 'https://minecraft.wiki/images/thumb/Golden_Sword_JE3_BE2.png/150px-Golden_Sword_JE3_BE2.png' },
  { id: 'diamond_sword', name: 'Diamond Sword', type: 'weapon', value: 10, tier: 'diamond', cost: { diamond: 5 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Sword_JE3_BE3.png/150px-Diamond_Sword_JE3_BE3.png' },
  { id: 'netherite_sword', name: 'Netherite Sword', type: 'weapon', value: 30, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Diamond_Sword_JE3_BE3.png/150px-Diamond_Sword_JE3_BE3.png' },
];

export const ARMOR: Item[] = [
  // Wood Tier (Leather)
  { id: 'wood_helmet', name: 'Wooden Helmet', type: 'armor', slot: 'helmet', value: 1, tier: 'wood', cost: { wood: 2 }, icon: 'https://minecraft.wiki/images/thumb/Leather_Cap_JE4_BE2.png/150px-Leather_Cap_JE4_BE2.png' },
  { id: 'wood_boots', name: 'Wooden Boots', type: 'armor', slot: 'boots', value: 1, tier: 'wood', cost: { wood: 2 }, icon: 'https://minecraft.wiki/images/thumb/Leather_Boots_JE2_BE2.png/150px-Leather_Boots_JE2_BE2.png' },
  { id: 'wood_leggings', name: 'Wooden Leggings', type: 'armor', slot: 'leggings', value: 2, tier: 'wood', cost: { wood: 4 }, icon: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/0/06/Leather_Pants_JE4_BE2.png/revision/latest?cb=20200218001832' },
  { id: 'wood_chestplate', name: 'Wooden Chestplate', type: 'armor', slot: 'chestplate', value: 3, tier: 'wood', cost: { wood: 5 }, icon: 'https://minecraft.wiki/images/Leather_Tunic_JE4_BE2.png' },
  // Iron Tier
  { id: 'iron_helmet', name: 'Iron Helmet', type: 'armor', slot: 'helmet', value: 3, tier: 'iron', cost: { iron: 3 }, icon: 'https://minecraft.wiki/images/Iron_Helmet_JE2_BE2.png' },
  { id: 'iron_boots', name: 'Iron Boots', type: 'armor', slot: 'boots', value: 2, tier: 'iron', cost: { iron: 2 }, icon: 'https://minecraft.wiki/images/Iron_Boots_JE2_BE2.png' },
  { id: 'iron_leggings', name: 'Iron Leggings', type: 'armor', slot: 'leggings', value: 4, tier: 'iron', cost: { iron: 4 }, icon: 'https://minecraft.wiki/images/Iron_Leggings_JE2_BE2.png' },
  { id: 'iron_chestplate', name: 'Iron Chestplate', type: 'armor', slot: 'chestplate', value: 5, tier: 'iron', cost: { iron: 5 }, icon: 'https://minecraft.wiki/images/Iron_Chestplate_JE2_BE2.png' },
  // Gold Tier
  { id: 'gold_helmet', name: 'Gold Helmet', type: 'armor', slot: 'helmet', value: 4, tier: 'gold', cost: { gold: 3 }, icon: 'https://minecraft.wiki/images/Golden_Helmet_JE2_BE2.png' },
  { id: 'gold_boots', name: 'Gold Boots', type: 'armor', slot: 'boots', value: 3, tier: 'gold', cost: { gold: 2 }, icon: 'https://minecraft.wiki/images/Golden_Boots_JE2_BE2.png' },
  { id: 'gold_leggings', name: 'Gold Leggings', type: 'armor', slot: 'leggings', value: 5, tier: 'gold', cost: { gold: 4 }, icon: 'https://minecraft.wiki/images/Golden_Leggings_JE2_BE2.png' },
  { id: 'gold_chestplate', name: 'Gold Chestplate', type: 'armor', slot: 'chestplate', value: 7, tier: 'gold', cost: { gold: 5 }, icon: 'https://minecraft.wiki/images/Golden_Chestplate_JE2_BE2.png' },
  // Diamond Tier
  { id: 'diamond_helmet', name: 'Diamond Helmet', type: 'armor', slot: 'helmet', value: 5, tier: 'diamond', cost: { diamond: 3 }, icon: 'https://minecraft.wiki/images/thumb/Diamond_Helmet_JE2_BE2.png/160px-Diamond_Helmet_JE2_BE2.png?a4954' },
  { id: 'diamond_boots', name: 'Diamond Boots', type: 'armor', slot: 'boots', value: 4, tier: 'diamond', cost: { diamond: 2 }, icon: 'https://minecraft.wiki/images/Diamond_Boots_JE2_BE2.png' },
  { id: 'diamond_leggings', name: 'Diamond Leggings', type: 'armor', slot: 'leggings', value: 6, tier: 'diamond', cost: { diamond: 4 }, icon: 'https://minecraft.wiki/images/Diamond_Leggings_JE2_BE2.png' },
  { id: 'diamond_chestplate', name: 'Diamond Chestplate', type: 'armor', slot: 'chestplate', value: 9, tier: 'diamond', cost: { diamond: 5 }, icon: 'https://minecraft.wiki/images/Diamond_Chestplate_JE3_BE2.png' },
  // Netherite Tier
  { id: 'netherite_helmet', name: 'Netherite Helmet', type: 'armor', slot: 'helmet', value: 12, tier: 'netherite', icon: 'https://minecraft.wiki/images/thumb/Diamond_Helmet_JE2_BE2.png/160px-Diamond_Helmet_JE2_BE2.png?a4954' },
  { id: 'netherite_boots', name: 'Netherite Boots', type: 'armor', slot: 'boots', value: 12, tier: 'netherite', icon: 'https://minecraft.wiki/images/Diamond_Boots_JE2_BE2.png' },
  { id: 'netherite_leggings', name: 'Netherite Leggings', type: 'armor', slot: 'leggings', value: 18, tier: 'netherite', icon: 'https://minecraft.wiki/images/Diamond_Leggings_JE2_BE2.png' },
  { id: 'netherite_chestplate', name: 'Netherite Chestplate', type: 'armor', slot: 'chestplate', value: 27, tier: 'netherite', icon: 'https://minecraft.wiki/images/Diamond_Chestplate_JE3_BE2.png' },
];

export const SHOP_ITEMS: Item[] = [
  { id: 'health_potion', name: 'Health Potion', type: 'potion', value: 10, tier: 'none', emeraldCost: 5 },
  { id: 'iron_sword_shop', name: 'Iron Sword', type: 'weapon', value: 5, tier: 'iron', emeraldCost: 10, icon: 'https://minecraft.wiki/images/thumb/Iron_Sword_JE2_BE2.png/150px-Iron_Sword_JE2_BE2.png' },
  { id: 'diamond_sword_shop', name: 'Diamond Sword', type: 'weapon', value: 10, tier: 'diamond', emeraldCost: 20, icon: 'https://minecraft.wiki/images/thumb/Diamond_Sword_JE3_BE3.png/150px-Diamond_Sword_JE3_BE3.png' },
  // Armor Shop
  { id: 'iron_chestplate_shop', name: 'Iron Chestplate', type: 'armor', slot: 'chestplate', value: 3, tier: 'iron', emeraldCost: 15, icon: 'https://minecraft.wiki/images/thumb/Iron_Chestplate_JE2_BE2.png/150px-Iron_Chestplate_JE2_BE2.png' },
  { id: 'diamond_chestplate_shop', name: 'Diamond Chestplate', type: 'armor', slot: 'chestplate', value: 8, tier: 'diamond', emeraldCost: 20, icon: 'https://minecraft.wiki/images/thumb/Diamond_Chestplate_JE3_BE2.png/150px-Diamond_Chestplate_JE3_BE2.png' },
];
