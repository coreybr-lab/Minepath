/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield, 
  Zap,
  Heart, 
  Pickaxe, 
  Gem, 
  Coins, 
  ShoppingBag, 
  Hammer, 
  Play, 
  RotateCcw,
  ChevronRight,
  Info,
  X,
  Box,
  User,
  Save,
  Download,
  CircleHelp,
  Maximize
} from 'lucide-react';
import { 
  Resources, 
  Item, 
  SlotItem, 
  SLOT_ITEMS, 
  WEAPONS, 
  ARMOR, 
  SHOP_ITEMS,
  ResourceType,
  SOUNDS,
  ArmorSlot
} from './types';

type GameState = 'start' | 'main' | 'battle' | 'shop' | 'crafting' | 'gameover' | 'inventory' | 'glossary';
interface Notification {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  resourceType: ResourceType;
}

const START_ITEM: SlotItem = {
  id: 'start',
  name: 'Ready?',
  type: 'good',
  icon: '❓',
  description: 'Press ROLL to start your adventure!'
};

export default function App() {
  // --- Player State ---
  const [hp, setHp] = useState(20);
  const [level, setLevel] = useState(1);
  const maxHp = 20 + (level - 1);
  const [hpHighlight, setHpHighlight] = useState(false);
  const [resources, setResources] = useState<Resources>({
    gold: 0,
    iron: 0,
    diamond: 0,
    emerald: 0,
    elytra: 0,
    wood: 0
  });
  const [weapon, setWeapon] = useState<Item>(WEAPONS[0]);
  const [armor, setArmor] = useState<Record<ArmorSlot, Item>>({
    helmet: { id: 'none', name: 'None', type: 'armor', slot: 'helmet', value: 0, tier: 'none', icon: '' },
    chestplate: { id: 'none', name: 'None', type: 'armor', slot: 'chestplate', value: 0, tier: 'none', icon: '' },
    leggings: { id: 'none', name: 'None', type: 'armor', slot: 'leggings', value: 0, tier: 'none', icon: '' },
    boots: { id: 'none', name: 'None', type: 'armor', slot: 'boots', value: 0, tier: 'none', icon: '' },
    none: { id: 'none', name: 'None', type: 'armor', slot: 'none', value: 0, tier: 'none', icon: '' }
  });
  const [potions, setPotions] = useState(0);
  const [playerName, setPlayerName] = useState<string>('');
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{ title: string, message: string, onConfirm: () => void }>({
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- Game Flow State ---
  const [gameState, setGameState] = useState<GameState>('start');
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingBattle, setPendingBattle] = useState(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const [reels, setReels] = useState<SlotItem[]>([START_ITEM, START_ITEM, START_ITEM]);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [slotBlockHealth, setSlotBlockHealth] = useState<number>(0);
  const [onScreenBlocks, setOnScreenBlocks] = useState<{ id: number, type: SlotItem, x: number, y: number, health: number, maxHealth: number }[]>([]);
  const [message, setMessage] = useState<string>('');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaStatus, setPwaStatus] = useState<'checking' | 'ready' | 'installed' | 'unavailable' | 'ios' | 'waiting'>('checking');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Real-time Combat State ---
  const [playerCooldown, setPlayerCooldown] = useState(0);
  const [enemyCooldown, setEnemyCooldown] = useState(0);
  const [showSlash, setShowSlash] = useState(false);
  const [slashDirection, setSlashDirection] = useState<'left' | 'right' | 'x'>('left');
  const [showDamageFlash, setShowDamageFlash] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    const checkPwa = () => {
      if (isStandalone) {
        setPwaStatus('installed');
      } else if (deferredPrompt) {
        setPwaStatus('ready');
      } else if (isIOS) {
        setPwaStatus('ios');
      } else {
        // If not standalone, not ios, and no prompt, we might be in a browser but not yet ready
        // Or we might be in an iframe.
        // We'll let the timeouts handle the transition to 'waiting' and 'unavailable'
      }
    };

    checkPwa();
    
    // If still checking, wait longer before giving up
    const timer = setTimeout(() => {
      if (pwaStatus === 'checking') {
        if (isIOS) setPwaStatus('ios');
        else if (deferredPrompt) setPwaStatus('ready');
        else if (isStandalone) setPwaStatus('installed');
        else setPwaStatus('waiting');
      }
    }, 5000); // Reduced to 5 seconds for faster feedback

    // Final timeout to show "unavailable" if it really takes too long
    const finalTimer = setTimeout(() => {
      if (pwaStatus === 'waiting' && !deferredPrompt && !isStandalone) {
        setPwaStatus('unavailable');
      }
    }, 20000); // 20 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(finalTimer);
    };
  }, [deferredPrompt, pwaStatus]);
  
  // --- Battle State ---
  const [enemy, setEnemy] = useState<{ name: string, hp: number, maxHp: number, minAtk: number, maxAtk: number, missChance: number, icon: string } | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  // --- Refs ---
  const blockIdCounter = useRef(0);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Spin sound effect
    if (isSpinning) {
      const audio = new Audio(SOUNDS.spin);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {});
      spinAudioRef.current = audio;
    } else {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
        spinAudioRef.current = null;
      }
    }
  }, [isSpinning]);

  useEffect(() => {
    // Cleanup spin audio on unmount
    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const handlePrompt = (e: any) => {
      console.log('beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      console.log('App was installed');
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }
    console.log('Triggering install prompt...');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // --- Helpers ---
  const playSound = (url: string, volume: number = 0.4) => {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {}); // Ignore autoplay errors
  };

  const addMessage = (msg: string) => {
    setMessage(msg);
    setActionLog(prev => [msg, ...prev].slice(0, 50)); // Keep last 50 events
  };

  const triggerHpHighlight = () => {
    setHpHighlight(true);
    setTimeout(() => setHpHighlight(false), 1000);
  };

  const isBetter = (newItem: Item, currentItem: Item) => {
    return newItem.value > currentItem.value;
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setIsNameModalOpen(false);
    if (name.toLowerCase() === 'cannon') {
      // Give Netherite gear
      const netheriteSword = WEAPONS.find(w => w.id === 'netherite_sword');
      if (netheriteSword) setWeapon(netheriteSword);
      
      const nHelmet = ARMOR.find(a => a.id === 'netherite_helmet');
      const nChest = ARMOR.find(a => a.id === 'netherite_chestplate');
      const nLegs = ARMOR.find(a => a.id === 'netherite_leggings');
      const nBoots = ARMOR.find(a => a.id === 'netherite_boots');
      
      if (nHelmet && nChest && nLegs && nBoots) {
        setArmor({
          helmet: nHelmet,
          chestplate: nChest,
          leggings: nLegs,
          boots: nBoots,
          none: { id: 'none', name: 'None', type: 'armor', slot: 'none', value: 0, tier: 'none' }
        });
      }
      addMessage('CANNON MODE ACTIVATED: Netherite Gear Equipped!');
      playSound(SOUNDS.win);
    } else {
      addMessage(`Welcome, ${name}!`);
    }
  };

  const getTotalDefense = useCallback(() => {
    return armor.helmet.value + armor.chestplate.value + armor.leggings.value + armor.boots.value;
  }, [armor]);

  const saveGame = () => {
    const gameStateData = {
      hp,
      resources,
      weapon,
      armor,
      potions,
      level,
      playerName
    };
    localStorage.setItem('minepath_save', JSON.stringify(gameStateData));
    addMessage('Game Saved!');
  };

  const loadGame = () => {
    const savedData = localStorage.getItem('minepath_save') || localStorage.getItem('mineslot_rogue_save');
    if (savedData) {
      const data = JSON.parse(savedData);
      setHp(data.hp);
      setResources(data.resources);
      setWeapon(data.weapon);
      setArmor(data.armor);
      setPotions(data.potions);
      setLevel(data.level);
      if (data.playerName) setPlayerName(data.playerName);
      setGameState('main');
      setReels([START_ITEM, START_ITEM, START_ITEM]);
      setSelectedReelIndex(null);
      addMessage('Game Loaded!');
    } else {
      addMessage('No save found!');
    }
  };

  const resetGame = () => {
    setHp(20);
    setResources({ gold: 0, iron: 0, diamond: 0, emerald: 0, elytra: 0, wood: 0 });
    setWeapon(WEAPONS[0]);
    setArmor({
      helmet: { id: 'none', name: 'None', type: 'armor', slot: 'helmet', value: 0, tier: 'none' },
      chestplate: { id: 'none', name: 'None', type: 'armor', slot: 'chestplate', value: 0, tier: 'none' },
      leggings: { id: 'none', name: 'None', type: 'armor', slot: 'leggings', value: 0, tier: 'none' },
      boots: { id: 'none', name: 'None', type: 'armor', slot: 'boots', value: 0, tier: 'none' },
      none: { id: 'none', name: 'None', type: 'armor', slot: 'none', value: 0, tier: 'none' }
    });
    setPotions(0);
    setLevel(1);
    setGameState('main');
    setOnScreenBlocks([]);
    setBattleLog([]);
    setSlotBlockHealth(0);
    setReels([START_ITEM, START_ITEM, START_ITEM]);
    setSelectedReelIndex(null);
  };

  // --- Slot Machine Logic ---
  const getWeightedRandomItem = (excludeEnemies = false): SlotItem => {
    // 5% chance for a Treasure Chest (1/20)
    if (Math.random() < 0.05) {
      return SLOT_ITEMS.find(i => i.id === 'chest') || SLOT_ITEMS[0];
    }

    // 5% chance for a Pitfall (1/20)
    if (Math.random() < 0.05 + (level * 0.005)) {
      return SLOT_ITEMS.find(i => i.id === 'pitfall') || SLOT_ITEMS[0];
    }

    const mobs = SLOT_ITEMS.filter(i => i.type === 'bad');
    const goodGuys = SLOT_ITEMS.filter(i => i.type === 'good');
    const blocks = SLOT_ITEMS.filter(i => i.type === 'block');
    
    // Reduced enemy frequency before level 8
    const baseCharChance = level < 8 ? 0.4 : 0.6;
    const charChance = excludeEnemies ? 0.2 : Math.min(0.95, baseCharChance + (level * 0.015));
    const isChar = Math.random() < charChance;
    
    if (isChar) {
      // Reduced mob weight before level 8
      const baseMobWeight = level < 8 ? 0.5 : 0.75;
      const mobWeight = excludeEnemies ? 0 : Math.min(1.0, baseMobWeight + (level * 0.02));
      const isMob = Math.random() < mobWeight;
      
      if (isMob) {
        // Enemy Progression
        const getMob = (name: string) => mobs.find(m => m.name === name) || mobs[0];
        
        const roll = Math.random();
        
        if (level < 5) {
          return roll < 0.6 ? getMob('Zombie') : getMob('Spider');
        }
        if (level < 10) {
          if (roll < 0.4) return getMob('Zombie');
          if (roll < 0.8) return getMob('Spider');
          return getMob('Creeper');
        }
        if (level < 15) {
          if (roll < 0.3) return getMob('Spider');
          if (roll < 0.6) return getMob('Creeper');
          if (roll < 0.9) return getMob('Pillager');
          return getMob('Zombie');
        }
        if (level < 20) {
          if (roll < 0.3) return getMob('Creeper');
          if (roll < 0.6) return getMob('Pillager');
          if (roll < 0.9) return getMob('Zoglin');
          return getMob('Spider');
        }
        if (level < 25) {
          if (roll < 0.3) return getMob('Pillager');
          if (roll < 0.6) return getMob('Zoglin');
          if (roll < 0.9) return getMob('Ravager');
          return getMob('Creeper');
        }
        if (level < 35) {
          if (roll < 0.4) return getMob('Zoglin');
          if (roll < 0.7) return getMob('Ravager');
          if (roll < 0.95) return getMob('Warden');
          return getMob('Pillager');
        }
        // End game levels
        if (roll < 0.4) return getMob('Ravager');
        if (roll < 0.7) return getMob('Warden');
        if (roll < 0.9) return getMob('Ender Dragon');
        return getMob('Zoglin');
      } else {
        // Select a random good guy
        return goodGuys[Math.floor(Math.random() * goodGuys.length)];
      }
    } else {
      // Weighted block selection based on level
      const roll = Math.random();
      if (level < 5) {
        // Mostly wood, dirt, grass
        if (roll < 0.3) return blocks.find(b => b.id === 'wood_block') || blocks[0];
        if (roll < 0.6) return blocks.find(b => b.name === 'Dirt Block') || blocks[0];
        if (roll < 0.8) return blocks.find(b => b.name === 'Grass Block') || blocks[1];
        if (roll < 0.95) return blocks.find(b => b.name === 'Snow Block') || blocks[2];
        return blocks.find(b => b.name === 'Iron Block') || blocks[3];
      }
      if (level < 10) {
        if (roll < 0.2) return blocks.find(b => b.id === 'wood_block') || blocks[0];
        if (roll < 0.4) return blocks.find(b => b.name === 'Sand Block') || blocks[3];
        if (roll < 0.7) return blocks.find(b => b.name === 'Iron Block') || blocks[2];
        if (roll < 0.9) return blocks.find(b => b.name === 'Gold Block') || blocks[3];
        return blocks.find(b => b.name === 'Dirt Block') || blocks[0];
      }
      if (roll < 0.2) return blocks.find(b => b.name === 'Iron Block') || blocks[2];
      if (roll < 0.5) return blocks.find(b => b.name === 'Gold Block') || blocks[3];
      if (roll < 0.8) return blocks.find(b => b.name === 'Diamond Block') || blocks[4];
      return blocks.find(b => b.name === 'Emerald Block') || blocks[5];
    }
  };

  const replaceReelItem = (index: number) => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSpinningReels(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });

    const isEnemy = reels[index].type === 'bad';
    const newItem = getWeightedRandomItem(isEnemy);

    // Spin animation for the single reel
    const spinInterval = setInterval(() => {
      setReels(prev => {
        const next = [...prev];
        next[index] = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        return next;
      });
    }, 60);

    setTimeout(() => {
      clearInterval(spinInterval);
      setReels(prev => {
        const next = [...prev];
        next[index] = newItem;
        return next;
      });
      setSpinningReels(prev => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
      setIsSpinning(false);
      playSound(SOUNDS.hit);
      setSelectedReelIndex(null);
      
      // Level up and heal
      const newLevel = level + 1;
      const newMaxHp = 20 + (newLevel - 1);
      setLevel(newLevel);
      setHp(prev => Math.min(newMaxHp, prev + 1));
      
      if (newLevel === 20) {
        setIsWinModalOpen(true);
      }
    }, 1000); // 1 second spin for single re-roll
  };

  const roll = () => {
    if (isSpinning || gameState !== 'main') return;
    
    setIsSpinning(true);
    setPendingBattle(false);
    setSpinningReels([true, true, true]);
    setSlotBlockHealth(0); // Reset slot block health
    setSelectedReelIndex(null);
    setMessage(''); // Clear previous message
    
    const finalItems = [getWeightedRandomItem(), getWeightedRandomItem(), getWeightedRandomItem()];
    
    // More dramatic shuffling: faster and more frequent updates
    const spinInterval = setInterval(() => {
      setReels(prev => prev.map((item, i) => {
        if (spinningReels[i]) {
          // Flash random items from the pool
          return SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        }
        return item;
      }));
    }, 60); // Faster shuffle (60ms instead of 100ms)

    // Staggered stop with dramatic pauses
    // Stop reel 1
    setTimeout(() => {
      setSpinningReels([false, true, true]);
      setReels(prev => [finalItems[0], prev[1], prev[2]]);
      playSound(SOUNDS.hit); // Add a "clunk" sound when it lands
    }, 1200); // Longer spin for more drama

    // Stop reel 2
    setTimeout(() => {
      setSpinningReels([false, false, true]);
      setReels(prev => [prev[0], finalItems[1], prev[2]]);
      playSound(SOUNDS.hit);
    }, 2000);

    // Stop reel 3
    setTimeout(() => {
      clearInterval(spinInterval);
      setSpinningReels([false, false, false]);
      setReels(finalItems);
      setIsSpinning(false);
      playSound(SOUNDS.hit);
      setMessage(`Level ${level}: Choose your path!`);
      checkResult(finalItems);
    }, 2800);
  };

  const checkResult = (result: SlotItem[]) => {
    const allBad = result.every(item => item.type === 'bad');
    const allGood = result.every(item => item.type === 'good');
    
    // Also spawn some random blocks in the mining area for variety
    if (!allBad && !allGood && Math.random() > 0.5) {
      spawnBlock();
    }

    if (allBad) {
      addMessage("JACKPOT! All mobs! Click them to battle!");
    } else if (allGood) {
      playSound(SOUNDS.win, 0.28);
      receiveRandomItem();
    }
  };

  // --- Interaction Logic ---
  const handleReelClick = (index: number) => {
    if (isSpinning || selectedReelIndex !== null) return;
    
    const item = reels[index];
    setSelectedReelIndex(index);
    setPendingBattle(false);
    setSlotBlockHealth(0);
    
    if (item.type === 'block') {
      playSound(SOUNDS.mine, 0.28);
      // Blocks break in 2-5 hits depending on type
      let health = 3;
      if (item.id.includes('dirt') || item.id.includes('grass') || item.id.includes('sand') || item.id.includes('snow') || item.id.includes('wood')) {
        health = 2;
      } else if (item.id.includes('iron')) {
        health = 3;
      } else if (item.id.includes('gold')) {
        health = 4;
      } else if (item.id.includes('diamond') || item.id.includes('emerald')) {
        health = 5;
      }
      setSlotBlockHealth(health);
      setMessage(`Mining ${item.name}...`);
    } else if (item.type === 'bad') {
      if (item.sound) playSound(item.sound);
      setPendingBattle(true);
      setMessage(`A wild ${item.name} appeared! Prepare for battle!`);
    } else if (item.type === 'good' && item.id !== 'start') {
      handleAllyInteraction(index);
    } else if (item.type === 'chest') {
      openChest(index);
    } else if (item.type === 'pitfall') {
      playSound(SOUNDS.negative);
      const damage = 2 + Math.floor(level / 5);
      setHp(prev => Math.max(0, prev - damage));
      triggerHpHighlight();
      addMessage(`Ouch! Fell into a pitfall! Lost ${damage} HP.`);
      
      // Pitfalls no longer require mining, just re-roll
      setSlotBlockHealth(0);
      setMessage(`Fell in! Spin to move on!`);
    }
  };

  const openChest = (index: number) => {
    if (isSpinning) return;
    
    playSound(SOUNDS.win, 0.28);
    
    // Powerful items: Diamond gear, Elytra, etc.
    const powerfulItems = [
      ...WEAPONS.filter(w => w.tier === 'diamond' || w.tier === 'gold'),
      ...ARMOR.filter(a => a.tier === 'diamond' || a.tier === 'gold'),
      { id: 'elytra', name: 'Elytra', type: 'special', value: 1, tier: 'none' }
    ];
    
    const roll = Math.random();
    if (roll < 0.4) {
      // Give a powerful item
      const item = powerfulItems[Math.floor(Math.random() * powerfulItems.length)];
      if (item.id === 'elytra') {
        setResources(prev => ({ ...prev, elytra: prev.elytra + 1 }));
        addMessage('TREASURE! Found an Elytra!');
      } else if (item.type === 'weapon') {
        if (isBetter(item as Item, weapon)) {
          setWeapon(item as Item);
          addMessage(`TREASURE! Found ${item.name}!`);
        } else {
          addMessage(`Found ${item.name}, but your ${weapon.name} is better.`);
        }
      } else if (item.type === 'armor') {
        const armorItem = item as any;
        if (armorItem.slot) {
          if (isBetter(armorItem, armor[armorItem.slot as ArmorSlot])) {
            setArmor(prev => ({ ...prev, [armorItem.slot]: armorItem }));
            addMessage(`TREASURE! Found ${item.name}!`);
          } else {
            addMessage(`Found ${item.name}, but your current ${armor[armorItem.slot as ArmorSlot].name} is better.`);
          }
        }
      }
    } else {
      // Give a lot of resources
      const gold = 10 + Math.floor(Math.random() * 20);
      const diamonds = 2 + Math.floor(Math.random() * 5);
      const emeralds = 5 + Math.floor(Math.random() * 10);
      const iron = 10 + Math.floor(Math.random() * 15);
      const wood = 15 + Math.floor(Math.random() * 20);
      
      collectResource('gold', gold, false, 0);
      collectResource('diamond', diamonds, false, 400);
      collectResource('emerald', emeralds, false, 800);
      collectResource('iron', iron, false, 1200);
      collectResource('wood', wood, false, 1600);
      
      addMessage(`TREASURE! Found resources!`);
    }
    
    // No longer auto-replacing, user will click button to re-roll
  };

  const minePathBlock = () => {
    if (isSpinning || slotBlockHealth <= 0 || selectedReelIndex === null) return;

    const block = reels[selectedReelIndex];
    if (block.type !== 'block' && block.type !== 'pitfall') return;

    if (slotBlockHealth > 1) {
      playSound(SOUNDS.mine, 0.28); // Mining sound
      setSlotBlockHealth(prev => prev - 1);
    } else {
      if (block.type === 'block') {
        if (block.resource) {
          playSound(SOUNDS.break, 0.28);
          const amount = block.id === 'wood_block' ? (1 + Math.floor(Math.random() * 3)) : (1 + Math.floor(level / 10));
          collectResource(block.resource, amount);
        } else {
          handleDecorativeBlockLoot();
        }
      } else if (block.type === 'pitfall') {
        playSound(SOUNDS.break, 0.28);
        addMessage('Climbed out of the pitfall!');
      }
      
      setSlotBlockHealth(0);
      if (selectedReelIndex !== null) {
        replaceReelItem(selectedReelIndex);
      }
    }
  };

  const spawnSpecificBlock = (type: SlotItem, x: number, y: number) => {
    const health = 3; // All minable blocks take 3 hits
    const newBlock = {
      id: blockIdCounter.current++,
      type,
      x,
      y,
      health,
      maxHealth: health
    };
    setOnScreenBlocks(prev => [...prev, newBlock]);
  };

  const spawnBlock = () => {
    const blocks = SLOT_ITEMS.filter(i => i.type === 'block');
    const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];
    spawnSpecificBlock(randomBlock, Math.random() * 80 + 10, Math.random() * 40 + 30);
  };

  const mineBlock = (id: number) => {
    const block = onScreenBlocks.find(b => b.id === id);
    if (!block) return;

    if (block.health > 1) {
      // Still breaking
      playSound(SOUNDS.mine, 0.28); // Mining sound
      setOnScreenBlocks(prev => prev.map(b => 
        b.id === id ? { ...b, health: b.health - 1 } : b
      ));
    } else {
      if (block.type.resource) {
        playSound(SOUNDS.break, 0.28);
        collectResource(block.type.resource, 1);
      } else {
        handleDecorativeBlockLoot();
      }
      setOnScreenBlocks(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleDecorativeBlockLoot = () => {
    const roll = Math.random();
    if (roll < 0.2) {
      playSound(SOUNDS.break, 0.28);
      collectResource('iron', 1);
    } else if (roll < 0.4) {
      playSound(SOUNDS.break, 0.28);
      collectResource('gold', 1);
    } else if (roll < 0.6) {
      playSound(SOUNDS.break, 0.28);
      collectResource('wood', 2);
    } else if (roll < 0.7) {
      playSound(SOUNDS.break, 0.28);
      setPotions(prev => prev + 1);
      addMessage('Found a Health Potion in the block!');
    } else if (roll < 0.8) {
      playSound(SOUNDS.break, 0.28);
      const woodArmor = ARMOR.filter(a => a.tier === 'wood');
      const piece = woodArmor[Math.floor(Math.random() * woodArmor.length)];
      if (piece.slot && piece.value > armor[piece.slot].value) {
        setArmor(prev => ({ ...prev, [piece.slot!]: piece }));
        addMessage(`Found ${piece.name} in the block!`);
      } else {
        addMessage(`Found ${piece.name}, but your current armor is better.`);
      }
    } else {
      playSound(SOUNDS.negative);
      addMessage('The block was empty.');
    }
  };

  const collectResource = (type: ResourceType, amount: number, showLog: boolean = true, delay: number = 0) => {
    if (amount <= 0) return;
    
    // Update resources immediately for HUD feedback
    setResources(prev => ({ ...prev, [type]: prev[type] + amount }));
    
    // Stagger the visual notification
    setTimeout(() => {
      const colors: Record<ResourceType, string> = {
        wood: '#fbbf24', // Amber-400
        iron: '#f3f4f6', // Gray-100
        gold: '#fde047', // Yellow-300
        diamond: '#93c5fd', // Blue-300
        emerald: '#6ee7b7', // Emerald-300
        elytra: '#d8b4fe' // Purple-300
      };

      const newNotification: Notification = {
        id: Math.random(),
        text: `+${amount} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        color: colors[type],
        x: 50, // Center of the screen
        y: 50,
        resourceType: type
      };

      setNotifications(prev => [...prev, newNotification]);
      playSound(SOUNDS.chaching, 0.28);
      if (showLog) {
        addMessage(`Gained ${amount} ${type}!`);
      }

      // Remove notification after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 3000);
    }, delay);
  };

  const handleAllyInteraction = (index?: number) => {
    const char = index !== undefined ? reels[index] : null;
    if (isSpinning || !char || char.type !== 'good' || char.id === 'start') return;
    
    playSound(SOUNDS.win, 0.28);
    const roll = Math.random();
    let rewardMsg = '';

    if (char.name === 'Steve' || char.name === 'Alex') {
      if (roll < 0.3) {
        collectResource('diamond', 1, false);
        rewardMsg = `${char.name} gave you a Diamond!`;
      } else if (roll < 0.6) {
        collectResource('iron', 3, false);
        rewardMsg = `${char.name} gave you 3 Iron Ingots!`;
      } else {
        setHp(prev => Math.min(maxHp, prev + 5));
        rewardMsg = `${char.name} healed you for 5 HP!`;
      }
    } else if (char.name === 'Villager') {
      const emeralds = Math.floor(Math.random() * 3) + 1;
      collectResource('emerald', emeralds, false);
      rewardMsg = `The Villager traded you ${emeralds} Emeralds!`;
    } else if (char.name === 'Iron Golem') {
      collectResource('iron', 5, false);
      rewardMsg = `The Iron Golem protected you and gave 5 Iron!`;
    }

    addMessage(rewardMsg);
    setSlotBlockHealth(0);
    // No longer auto-replacing, user will click button to re-roll
  };

  // --- Battle Logic ---
  const startBattle = (enemyType: SlotItem) => {
    playSound(SOUNDS.hit);
    
    // Base stats for mobs
    let baseHp = 20;
    let minAtk = 1;
    let maxAtk = 2;
    let missChance = 0.5; // Default 50% miss
    
    if (enemyType.name === 'Zombie') { baseHp = 8; minAtk = 1; maxAtk = 2; missChance = 0.5; }
    else if (enemyType.name === 'Spider') { baseHp = 6; minAtk = 1; maxAtk = 2; missChance = 0.45; }
    else if (enemyType.name === 'Creeper') { baseHp = 8; minAtk = 1; maxAtk = 3; missChance = 0.4; }
    else if (enemyType.name === 'Pillager') { baseHp = 24; minAtk = 2; maxAtk = 3; missChance = 0.35; }
    else if (enemyType.name === 'Zoglin') { baseHp = 40; minAtk = 4; maxAtk = 5; missChance = 0.3; }
    else if (enemyType.name === 'Ravager') { baseHp = 100; minAtk = 5; maxAtk = 7; missChance = 0.25; }
    else if (enemyType.name === 'Warden') { baseHp = 250; minAtk = 5; maxAtk = 10; missChance = 0.25; }
    else if (enemyType.name === 'Ender Dragon') { baseHp = 500; minAtk = 5; maxAtk = 15; missChance = 0.2; }
    
    const hpScale = 1 + (level * 0.05);
    const atkScale = 1 + (level * 0.02);
    
    const newEnemy = {
      name: enemyType.name,
      hp: Math.floor(baseHp * hpScale),
      maxHp: 0,
      minAtk: Math.floor(minAtk * atkScale),
      maxAtk: Math.floor(maxAtk * atkScale),
      missChance: missChance,
      icon: enemyType.icon,
    };
    newEnemy.maxHp = newEnemy.hp;
    setEnemy(newEnemy as any);
    setBattleLog([`A wild ${newEnemy.name} appeared (Level ${level})!`]);
    setGameState('battle');
    setPlayerCooldown(0);
    setEnemyCooldown(getEnemyAttackSpeed(newEnemy.name));
  };

  const getPlayerAttackSpeed = () => {
    switch (weapon.tier) {
      case 'wood': return 1000;
      case 'iron': return 800;
      case 'gold': return 600;
      case 'diamond': return 400;
      case 'netherite': return 200;
      default: return 1200; // Fist
    }
  };

  const getEnemyAttackSpeed = (name: string) => {
    switch (name) {
      case 'Zombie': return 3200;
      case 'Spider': return 2400;
      case 'Creeper': return 6000;
      case 'Pillager': return 4000;
      case 'Zoglin': return 2800;
      case 'Ravager': return 8000;
      case 'Warden': return 12000;
      case 'Ender Dragon': return 16000;
      default: return 4000;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'battle' && enemy && hp > 0 && enemy.hp > 0) {
      interval = setInterval(() => {
        setPlayerCooldown(prev => Math.max(0, prev - 100));
        setEnemyCooldown(prev => {
          if (prev <= 100) {
            enemyAttack();
            return getEnemyAttackSpeed(enemy.name);
          }
          return prev - 100;
        });
      }, 100);
    } else {
      setPlayerCooldown(0);
      setEnemyCooldown(0);
    }
    return () => clearInterval(interval);
  }, [gameState, enemy, hp]);

  const playerAttack = () => {
    if (!enemy || playerCooldown > 0) return;
    
    playSound(SOUNDS.attack);
    setSlashDirection(prev => prev === 'left' ? 'right' : 'left');
    setShowSlash(true);
    setTimeout(() => setShowSlash(false), 300);
    
    const damage = weapon.value;
    const newEnemyHp = Math.max(0, enemy.hp - damage);
    setEnemy({ ...enemy, hp: newEnemyHp });
    setBattleLog(prev => [`You hit ${enemy.name} for ${damage} damage!`, ...prev]);
    
    setPlayerCooldown(getPlayerAttackSpeed());
    
    if (newEnemyHp <= 0) {
      setSlashDirection('x');
      setShowSlash(true);
      playSound(SOUNDS.win, 0.28);
      
      // Random Loot Logic based on enemy type
      let lootMsg = '';
      const roll = Math.random();
      
      if (enemy.name === 'Zombie' || enemy.name === 'Spider') {
        if (roll < 0.6) {
          collectResource('gold', 1, false);
          lootMsg = 'gained 1 gold';
        } else {
          lootMsg = 'gained nothing';
        }
      } else if (enemy.name === 'Creeper') {
        if (roll < 0.5) {
          collectResource('iron', 1, false);
          lootMsg = 'gained 1 iron';
        } else {
          lootMsg = 'gained nothing';
        }
      } else if (enemy.name === 'Pillager') {
        if (roll < 0.4) {
          collectResource('emerald', 1, false);
          lootMsg = 'gained 1 emerald';
        } else if (roll < 0.6) {
          collectResource('diamond', 1, false);
          lootMsg = 'gained 1 diamond';
        } else {
          lootMsg = 'gained nothing';
        }
      } else if (enemy.name === 'Zoglin') {
        if (roll < 0.7) {
          collectResource('gold', 2, false);
          lootMsg = 'gained 2 gold';
        } else {
          lootMsg = 'gained nothing';
        }
      } else if (enemy.name === 'Ravager') {
        collectResource('iron', 2, false, 0);
        collectResource('emerald', 1, false, 400);
        if (roll < 0.2) {
          collectResource('elytra', 1, false, 800);
          lootMsg = 'gained 2 iron, 1 emerald, and an elytra';
        } else {
          lootMsg = 'gained 2 iron and 1 emerald';
        }
      } else if (enemy.name === 'Warden') {
        collectResource('diamond', 2, false, 0);
        collectResource('emerald', 2, false, 400);
        if (roll < 0.4) {
          collectResource('elytra', 1, false, 800);
          lootMsg = 'gained 2 diamonds, 2 emeralds, and an elytra';
        } else {
          lootMsg = 'gained 2 diamonds and 2 emeralds';
        }
      } else if (enemy.name === 'Ender Dragon') {
        collectResource('diamond', 5, false, 0);
        collectResource('emerald', 5, false, 400);
        collectResource('elytra', 1, false, 800);
        setPotions(prev => prev + 3);
        lootMsg = 'gained 5 diamonds, 5 emeralds, 3 potions, and an elytra';
      } else {
        // Fallback for other mobs
        if (roll < 0.5) {
          collectResource('iron', 1, false);
          lootMsg = 'gained 1 iron';
        } else {
          lootMsg = 'gained nothing';
        }
      }

      const finalLootMsg = `${enemy.name} Defeated - ${lootMsg}`;
      setMessage(finalLootMsg);
      setBattleLog(prev => [finalLootMsg, ...prev]);
      
      setTimeout(() => {
        setGameState('main');
        setEnemy(null);
        setShowSlash(false);
        if (selectedReelIndex !== null) {
          replaceReelItem(selectedReelIndex);
        }
      }, 2000);
    }
  };

  const enemyAttack = () => {
    if (!enemy) return;
    
    // Check for miss
    if (Math.random() < enemy.missChance) {
      playSound(SOUNDS.miss);
      setBattleLog(prev => [`${enemy.name} missed their attack!`, ...prev]);
      return;
    }

    // Play enemy-specific sound
    if (enemy.name === 'Zombie') playSound(SOUNDS.zombie);
    else if (enemy.name === 'Spider') playSound(SOUNDS.spider);
    else if (enemy.name === 'Creeper') playSound(SOUNDS.creeper);
    else if (enemy.name === 'Pillager') playSound(SOUNDS.pillager);
    else if (enemy.name === 'Ravager') playSound(SOUNDS.ravager);
    else if (enemy.name === 'Warden') playSound(SOUNDS.warden);
    else if (enemy.name === 'Ender Dragon') playSound(SOUNDS.dragon);
    else playSound(SOUNDS.playerHit);

    setShowDamageFlash(true);
    setTimeout(() => setShowDamageFlash(false), 200);
    
    const rawDamage = Math.floor(Math.random() * (enemy.maxAtk - enemy.minAtk + 1)) + enemy.minAtk;
    const damage = Math.max(1, rawDamage - getTotalDefense());
    const newHp = Math.max(0, hp - damage);
    setHp(newHp);
    setBattleLog(prev => [`${enemy.name} hits you for ${damage} damage!`, ...prev]);
    
    if (newHp <= 0) {
      setGameState('gameover');
      playSound(SOUNDS.negative);
    } else {
      triggerHpHighlight();
    }
  };

  const usePotion = () => {
    if (potions > 0 && hp < maxHp) {
      playSound(SOUNDS.drink);
      const heal = 10;
      setHp(prev => Math.min(maxHp, prev + heal));
      setPotions(prev => prev - 1);
      triggerHpHighlight();
      setBattleLog(prev => [`Used potion! Healed ${heal} HP.`, ...prev]);
    }
  };

  // --- Item Logic ---
  const receiveRandomItem = () => {
    const possibleItems = [...WEAPONS.slice(1), ...ARMOR];
    const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    if (item.type === 'weapon') {
      if (item.value > weapon.value) {
        setWeapon(item);
        addMessage(`Found a better weapon: ${item.name}!`);
      } else {
        addMessage(`Found ${item.name}, but your current weapon is better.`);
      }
    } else if (item.type === 'armor' && item.slot) {
      if (item.value > armor[item.slot].value) {
        setArmor(prev => ({ ...prev, [item.slot!]: item }));
        addMessage(`Found better ${item.slot}: ${item.name}!`);
      } else {
        addMessage(`Found ${item.name}, but your current ${item.slot} is better.`);
      }
    }
  };

  // --- Shop & Crafting ---
  const buyItem = (item: Item) => {
    if (item.emeraldCost && resources.emerald >= item.emeraldCost) {
      if (item.type === 'weapon') {
        if (!isBetter(item, weapon)) {
          addMessage(`Your ${weapon.name} is already better or equal!`);
          return;
        }
        setWeapon(item);
      } else if (item.type === 'armor' && item.slot) {
        if (!isBetter(item, armor[item.slot as ArmorSlot])) {
          addMessage(`Your ${armor[item.slot as ArmorSlot].name} is already better or equal!`);
          return;
        }
        setArmor(prev => ({ ...prev, [item.slot!]: item }));
      } else if (item.type === 'potion') {
        setPotions(prev => prev + 1);
      }
      
      playSound(SOUNDS.win, 0.28);
      setResources(prev => ({ ...prev, emerald: prev.emerald - (item.emeraldCost || 0) }));
      addMessage(`Bought ${item.name}!`);
    } else {
      addMessage('Not enough emeralds!');
    }
  };

  const craftItem = (item: Item) => {
    const canCraft = Object.entries(item.cost || {}).every(([res, amount]) => resources[res as ResourceType] >= amount);
    
    if (canCraft) {
      if (item.type === 'weapon') {
        if (!isBetter(item, weapon)) {
          addMessage(`Your ${weapon.name} is already better or equal!`);
          return;
        }
        setWeapon(item);
      } else if (item.type === 'armor' && item.slot) {
        if (!isBetter(item, armor[item.slot as ArmorSlot])) {
          addMessage(`Your ${armor[item.slot as ArmorSlot].name} is already better or equal!`);
          return;
        }
        setArmor(prev => ({ ...prev, [item.slot!]: item }));
      }

      playSound(SOUNDS.win, 0.28);
      const newResources = { ...resources };
      Object.entries(item.cost || {}).forEach(([res, amount]) => {
        newResources[res as ResourceType] -= amount;
      });
      setResources(newResources);
      
      addMessage(`Crafted ${item.name}!`);
    } else {
      addMessage('Not enough resources!');
    }
  };

  // --- Render Helpers ---
  const skipRoll = () => {
    if (resources.elytra > 0 && !isSpinning && gameState === 'main') {
      setResources(prev => ({ ...prev, elytra: prev.elytra - 1 }));
      addMessage('Used Elytra to skip!');
      roll();
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'wood': return 'text-amber-800'; // Brown
      case 'iron': return 'text-stone-400'; // Grey
      case 'gold': return 'text-yellow-500'; // Gold
      case 'diamond': return 'text-blue-400'; // Blue
      case 'netherite': return 'text-purple-500';
      default: return 'text-white';
    }
  };

  const renderHeader = () => {
    if (gameState === 'battle') {
      return (
        <div className="bg-stone-900 border-b-4 border-black text-white font-sans p-2 flex items-center justify-between gap-3 relative z-[60]">
          <div className="flex items-center gap-2 bg-black px-3 py-1 rounded-xl border-2 border-stone-700 flex-1 shadow-[0_4px_0_rgba(0,0,0,0.5)]">
            <motion.div animate={hpHighlight ? { scale: [1, 1.2, 1] } : {}}>
              <Heart className="text-red-500 fill-red-500 drop-shadow-sm" size={20} />
            </motion.div>
            <span className="text-xl font-bold drop-shadow-md">{hp}/{maxHp}</span>
          </div>
          <div className="px-3 py-1 bg-emerald-950 rounded-xl border-2 border-emerald-700 text-sm text-emerald-400 font-black uppercase flex-1 text-center font-mono shadow-[0_4px_0_rgba(0,0,0,0.5)]">
            LVL {level}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-stone-900 border-b-4 border-black text-white font-sans p-4 relative z-[60]">
        {/* Row 1: Status & Save/Load */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            onClick={() => setIsNameModalOpen(true)}
            className="flex items-center gap-2 bg-black px-3 py-2 rounded-2xl border-2 border-stone-700 flex-1 cursor-pointer hover:bg-stone-800/50 transition-colors shadow-[0_4px_0_rgba(0,0,0,0.5)]"
          >
            <motion.div
              animate={hpHighlight ? { scale: [1, 1.3, 1], color: ['#ef4444', '#ffffff', '#ef4444'] } : {}}
            >
              <Heart className="text-red-500 fill-red-500 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]" size={28} />
            </motion.div>
            <div className="flex flex-col">
              <span className={`text-3xl font-bold leading-none ${hpHighlight ? 'text-red-400' : 'text-white'} drop-shadow-md`}>{hp}/{maxHp}</span>
              {playerName && <span className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter truncate max-w-[80px]">{playerName}</span>}
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-950 rounded-2xl border-2 border-emerald-700 text-lg text-emerald-400 font-black uppercase tracking-widest flex-1 text-center font-mono shadow-[0_4px_0_rgba(0,0,0,0.5)]">
            LVL {level}
          </div>
          <div className="flex gap-2">
            <button onClick={saveGame} className="p-2 bg-blue-800 hover:bg-blue-700 border-b-4 border-blue-950 rounded-xl active:translate-y-0.5 transition-all shadow-lg">
              <Save size={24} />
            </button>
            <button onClick={loadGame} className="p-2 bg-amber-800 hover:bg-amber-700 border-b-4 border-amber-950 rounded-xl active:translate-y-0.5 transition-all shadow-lg">
              <Download size={24} />
            </button>
          </div>
        </div>

        {/* Row 2: Navigation Buttons */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setGameState('glossary')} className="p-3 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex justify-center shadow-md">
            <Info size={28} />
          </button>
          <button onClick={() => setGameState('inventory')} className="p-3 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex justify-center shadow-md">
            <User size={28} />
          </button>
          <button onClick={() => setGameState('crafting')} className="p-3 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex justify-center shadow-md">
            <Hammer size={28} />
          </button>
          <button onClick={() => setGameState('shop')} className="p-3 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex justify-center shadow-md">
            <ShoppingBag size={28} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Resources Row */}
          <div className="grid grid-cols-5 gap-1">
            {[
              { type: 'wood', icon: 'input_file_5.png', value: resources.wood },
              { type: 'iron', icon: 'https://minecraft.wiki/images/Iron_Ingot_JE3_BE2.png', value: resources.iron },
              { type: 'gold', icon: 'https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png', value: resources.gold },
              { type: 'diamond', icon: 'https://minecraft.wiki/images/Diamond_JE3_BE3.png', value: resources.diamond },
              { type: 'emerald', icon: 'https://minecraft.wiki/images/Emerald_JE3_BE3.png', value: resources.emerald }
            ].map((res) => (
              <div key={res.type} className="flex items-center gap-1 bg-black/60 backdrop-blur-sm p-2 rounded-xl border-2 border-stone-700/50 shadow-inner relative overflow-hidden group">
                <img src={res.icon} className="w-5 h-5 object-contain drop-shadow-sm relative z-10" referrerPolicy="no-referrer" />
                <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] relative z-10">{res.value}</span>
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-2xl border-2 border-stone-700/50 shadow-inner">
              <Sword className="text-red-400 drop-shadow-sm" size={24} />
              <span className="text-white font-black text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{weapon.value} Damage</span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-2xl border-2 border-stone-700/50 shadow-inner">
              <Shield className="text-blue-300 drop-shadow-sm" size={24} />
              <span className="text-white font-black text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{getTotalDefense()} Armour</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActionLog = () => (
    <div className="w-full mt-2">
      <div className="bg-black/40 backdrop-blur-md border-2 border-stone-800/50 rounded-xl p-2 h-20 overflow-y-auto space-y-1 shadow-inner scrollbar-hide pointer-events-auto">
        <AnimatePresence initial={false}>
          {actionLog.slice(0, 5).map((log, i) => (
            <motion.div
              key={`${log}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1 - i * 0.2, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-[10px] font-bold font-mono text-stone-300 flex items-center gap-2"
            >
              <div className="w-1 h-1 bg-emerald-500 rounded-full" />
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderFloatingNotifications = () => (
    <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: [0, -100, -150, -200],
              scale: [0.5, 1.5, 1.2, 1]
            }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute font-black text-3xl flex flex-col items-center pointer-events-none"
            style={{ 
              color: n.color,
              textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
              left: `${n.x}%`,
              top: '50%',
              zIndex: 1000
            }}
          >
            {n.text}
            <motion.div
              animate={{ 
                y: [0, -400],
                x: [0, (20 - n.x) * 5], // Approximate target for resource bar
                opacity: [1, 0],
                scale: [1, 0.5]
              }}
              transition={{ delay: 2, duration: 1 }}
            >
              {/* Small icon flying to HUD */}
              <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm" />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderInventory = () => (
    <div className="flex-1 flex flex-col p-4 bg-stone-900 font-sans min-h-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl text-white border-l-4 border-blue-500 pl-3 font-mono font-black uppercase tracking-tighter">Inventory</h2>
        <button onClick={() => setGameState('main')} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1">
        {/* Equipped Items Section */}
        <div>
          <h3 className="text-blue-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-blue-900/30 pb-1">Equipped Gear</h3>
          <div className="bg-black p-4 border-b-4 border-stone-950 rounded-3xl border-2 border-stone-800/50 flex justify-center items-center">
            <div className="flex gap-2 sm:gap-3">
              <InventorySlot item={weapon} label="Weapon" icon={<Sword size={24} />} />
              <InventorySlot item={armor.helmet} label="Helmet" icon={<Shield size={24} />} />
              <InventorySlot item={armor.chestplate} label="Chest" icon={<Shield size={24} />} />
              <InventorySlot item={armor.leggings} label="Legs" icon={<Shield size={24} />} />
              <InventorySlot item={armor.boots} label="Feet" icon={<Shield size={24} />} />
            </div>
          </div>
        </div>

        {/* Consumables Section */}
        <div>
          <h3 className="text-pink-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-pink-900/30 pb-1">Consumables</h3>
          <div className="grid grid-cols-1 gap-3">
            <div 
              onClick={usePotion}
              className={`bg-black p-4 border-b-4 border-stone-950 rounded-2xl border-2 border-stone-800/50 flex justify-between items-center transition-all active:translate-y-1 active:border-b-0 cursor-pointer hover:bg-stone-900/50 ${potions === 0 ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-950/30 border-2 border-pink-900/50 rounded-xl flex items-center justify-center text-pink-500 shadow-inner">
                  <Heart size={28} fill="currentColor" className={potions > 0 ? "animate-pulse" : ""} />
                </div>
                <div>
                  <div className="text-white font-bold">Health Potion</div>
                  <div className="text-stone-500 text-[10px] uppercase font-black tracking-widest">Restores 10 HP</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white font-mono">x{potions}</span>
                <button 
                  disabled={potions === 0 || hp >= maxHp}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:bg-stone-800 text-white font-black rounded-lg text-xs uppercase tracking-widest border-b-4 border-pink-800 active:border-b-0 transition-all"
                >
                  USE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const InventorySlot = ({ item, label, icon }: { item: Item, label: string, icon: React.ReactNode }) => {
    const isEmpty = item.tier === 'none';
    
    return (
      <div className="flex flex-col items-center gap-1 group">
        <div className={`w-16 h-16 bg-stone-900 border-2 border-stone-700 rounded-2xl flex items-center justify-center text-3xl shadow-xl relative overflow-hidden transition-colors ${!isEmpty ? 'group-hover:border-emerald-500/50' : 'opacity-20'}`}>
          {!isEmpty && (
            <div className={getTierColor(item.tier)}>
              {icon}
              <div className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] font-black text-stone-400 border-tl border-stone-800">
                T{item.tier}
              </div>
            </div>
          )}
        </div>
        <span className="text-[8px] text-stone-500 uppercase font-black tracking-widest">{label}</span>
      </div>
    );
  };

  const renderGlossary = () => (
    <div className="flex-1 flex flex-col p-4 bg-stone-900 font-sans min-h-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl text-white border-l-4 border-emerald-500 pl-3 font-mono font-black">GLOSSARY</h2>
        <button onClick={() => setGameState('main')} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-8 pr-1">
        {/* Mobs */}
        <div>
          <h3 className="text-red-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-red-900/30 pb-1">Hostile Mobs</h3>
          <div className="grid grid-cols-1 gap-3">
            {SLOT_ITEMS.filter(i => i.type === 'bad').map(mob => (
              <div key={mob.id} className="bg-black p-3 border-b-4 border-stone-950 rounded-2xl border-2 border-stone-800/50 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg border-2 border-stone-700 bg-stone-900 flex items-center justify-center overflow-hidden">
                  {mob.icon.startsWith('http') || mob.icon.startsWith('input_file_') ? (
                    <img src={mob.icon} alt={mob.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                  ) : (
                    <span className="text-2xl">{mob.icon}</span>
                  )}
                </div>
                <div>
                  <div className="text-white font-bold">{mob.name}</div>
                  <div className="text-stone-400 text-xs leading-tight font-medium">{mob.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blocks */}
        <div>
          <h3 className="text-blue-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-blue-900/30 pb-1">Blocks & Resources</h3>
          <div className="grid grid-cols-1 gap-3">
            {SLOT_ITEMS.filter(i => i.type === 'block').map(block => (
              <div key={block.id} className="bg-black p-3 border-b-4 border-stone-950 rounded-2xl border-2 border-stone-800/50 flex gap-4 items-center">
                <div className="w-12 h-12 bg-stone-900 border-2 border-stone-700 rounded-lg flex items-center justify-center text-3xl overflow-hidden">
                  {block.icon.startsWith('http') || block.icon.startsWith('input_file_') ? (
                    <img src={block.icon} alt={block.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                  ) : (
                    block.icon
                  )}
                </div>
                <div>
                  <div className="text-white font-bold">{block.name}</div>
                  <div className="text-stone-400 text-xs leading-tight font-medium">{block.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Good Characters */}
        <div>
          <h3 className="text-emerald-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-emerald-900/30 pb-1">Friendly Faces</h3>
          <div className="grid grid-cols-1 gap-3">
            {SLOT_ITEMS.filter(i => i.type === 'good').map(char => (
              <div key={char.id} className="bg-black p-3 border-b-4 border-stone-950 rounded-2xl border-2 border-stone-800/50 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg border-2 border-stone-700 bg-stone-900 flex items-center justify-center overflow-hidden">
                  {char.icon.startsWith('http') || char.icon.startsWith('input_file_') ? (
                    <img src={char.icon} alt={char.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                  ) : (
                    <span className="text-2xl">{char.icon}</span>
                  )}
                </div>
                <div>
                  <div className="text-white font-bold">{char.name}</div>
                  <div className="text-stone-400 text-xs leading-tight font-medium">{char.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Screens ---
  if (gameState === 'start') {
    return (
      <div className="h-[100dvh] bg-stone-900 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-12"
        >
          {/* Clever Logo Graphic */}
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                y: [0, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <Pickaxe size={120} className="text-emerald-500 drop-shadow-[0_8px_0_rgba(0,0,0,0.5)]" />
            </motion.div>
            
            {/* Mystery Choices (Question Marks) */}
            <div className="absolute -bottom-4 -left-8 flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  className="bg-stone-800 p-2 rounded-lg border-2 border-stone-700 shadow-xl"
                >
                  <CircleHelp size={32} className="text-emerald-400" />
                </motion.div>
              ))}
            </div>
            
            {/* Decorative Sparkles */}
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="absolute -top-4 -right-4 text-emerald-300"
            >
              <Zap size={32} fill="currentColor" />
            </motion.div>
          </div>

          <div className="space-y-8">
            <h1 className="text-7xl font-black tracking-tighter text-white drop-shadow-[0_6px_0_rgba(16,185,129,1)] font-mono">
              MINEPATH
            </h1>
            <div className="space-y-6">
              <p className="text-stone-400 max-w-xs mx-auto text-lg leading-relaxed font-bold">
                Mystery Adventure. <br/>
                <span className="text-emerald-500 font-bold">Spin. Choose. Survive.</span>
              </p>
              <button 
                onClick={() => setGameState('main')}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 border-b-8 border-emerald-800 rounded-2xl text-3xl font-black flex items-center justify-center gap-3 transition-all active:translate-y-2 active:border-b-0 shadow-2xl"
              >
                <Play fill="currentColor" size={32} /> START GAME
              </button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleFullScreen}
                className="w-full py-4 bg-stone-900 border-2 border-stone-800 rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition-all shadow-xl text-stone-300"
              >
                <Maximize size={24} /> {isFullscreen ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN'}
              </motion.button>
              
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="h-[100dvh] bg-stone-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-8"
        >
          <h1 className="text-6xl font-black text-red-600 drop-shadow-[0_4px_0_rgba(0,0,0,1)] font-mono">
            YOU DIED
          </h1>
          <p className="text-stone-500 font-bold">Your inventory and progress were lost.</p>
          <button 
            onClick={resetGame}
            className="w-full py-4 bg-stone-800 hover:bg-stone-700 border-b-8 border-stone-900 rounded-xl text-2xl font-black flex items-center justify-center gap-2 transition-all active:translate-y-2 active:border-b-0"
          >
            <RotateCcw /> TRY AGAIN
          </button>
        </motion.div>
      </div>
    );
  }

  const renderConfirmModal = () => (
    <AnimatePresence>
      {isConfirmModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-stone-900 border-4 border-stone-700 p-6 rounded-xl max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-black text-emerald-500 mb-4 flex items-center gap-2">
              <Info className="text-emerald-500" />
              {confirmModalConfig.title}
            </h2>
            <p className="text-stone-300 mb-8 leading-relaxed">
              {confirmModalConfig.message}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-lg border-b-4 border-stone-950 active:border-b-0 active:translate-y-1 transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  setIsConfirmModalOpen(false);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                CONFIRM
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderNameModal = () => (
    <AnimatePresence>
      {isNameModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-stone-900 border-4 border-stone-950 rounded-2xl p-6 w-full max-w-sm space-y-6 shadow-2xl font-mono"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-white font-bold tracking-tighter uppercase">Enter Player Name</h2>
              <button onClick={() => setIsNameModalOpen(false)} className="text-stone-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Your Name..."
                className="w-full bg-stone-800 border-2 border-stone-700 rounded-xl p-4 text-white text-xl focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSubmit((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <p className="text-stone-500 text-xs">Enter your name to personalize your adventure.</p>
              <button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Your Name..."]') as HTMLInputElement;
                  handleNameSubmit(input.value);
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 rounded-xl text-white font-bold text-lg transition-transform active:translate-y-1"
              >
                CONFIRM
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderWinModal = () => (
    <AnimatePresence>
      {isWinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-stone-900 border-4 border-emerald-500 rounded-3xl p-8 w-full max-w-md space-y-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] font-mono text-center relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full" />

            <div className="space-y-4 relative z-10">
              <div className="flex justify-center">
                <div className="bg-emerald-500 p-4 rounded-full shadow-lg shadow-emerald-900/50">
                  <Gem size={48} className="text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">VICTORY!</h2>
              <div className="h-1 w-24 bg-emerald-500 mx-auto rounded-full" />
              <p className="text-stone-300 text-lg leading-relaxed">
                Congratulations, <span className="text-emerald-400 font-bold">{playerName || 'Adventurer'}</span>! 
                You've reached <span className="text-emerald-400 font-bold italic">Level 20</span> and conquered the MinePath.
              </p>
              <p className="text-stone-500 text-sm italic">
                The world is yours, but the adventure doesn't have to end here.
              </p>
            </div>

            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => setIsWinModalOpen(false)}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 border-b-6 border-emerald-800 rounded-2xl text-white font-black text-xl transition-all active:translate-y-1 active:border-b-0 shadow-xl uppercase tracking-widest"
              >
                Continue Journey
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold rounded-xl transition-colors uppercase text-sm tracking-widest"
              >
                Restart Game
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="h-[100dvh] bg-stone-900 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden select-none">
      {renderHeader()}
      {renderConfirmModal()}
      {renderNameModal()}
      {renderWinModal()}
      
      <main className="flex-1 relative flex flex-col overflow-hidden min-h-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')]">
        {renderFloatingNotifications()}
        
        {/* Main Game Screen */}
        {gameState === 'main' && (
          <div className="h-full flex flex-col p-4 space-y-2 bg-stone-900/50">
            {/* Message Banner Area - Now in flow between header and reels */}
            <div className="h-14 flex items-center justify-center relative shrink-0">
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div 
                    key="message-banner"
                    initial={{ y: -10, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -10, opacity: 0, scale: 0.95 }}
                    className="w-full flex justify-center z-50"
                  >
                    <div className="bg-black/90 text-white px-4 py-2 rounded-xl border-2 border-emerald-500 text-sm font-black font-mono shadow-[0_0_20px_rgba(16,185,129,0.4)] text-center max-w-[95%] leading-tight">
                      {message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Triple Reel Display */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="grid grid-cols-3 gap-2 w-full max-w-lg">
                {reels.map((item, idx) => (
                  <motion.div 
                    key={`${idx}-${item.id}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: selectedReelIndex === null || selectedReelIndex === idx ? 1 : 0.8, 
                      opacity: selectedReelIndex === null || selectedReelIndex === idx ? 1 : 0.4 
                    }}
                    whileHover={!isSpinning && selectedReelIndex === null ? { scale: 1.05 } : {}}
                    whileTap={!isSpinning && selectedReelIndex === null ? { scale: 0.95 } : {}}
                    onClick={() => handleReelClick(idx)}
                    className={`aspect-square bg-stone-800 rounded-2xl border-4 border-stone-950 flex flex-col items-center justify-center shadow-xl overflow-hidden relative ${
                      !isSpinning && selectedReelIndex === null ? 'cursor-pointer' : 'cursor-default'
                    } ${selectedReelIndex === idx ? 'ring-4 ring-emerald-500 border-emerald-400' : ''} ${
                      !isSpinning && item.type === 'bad' ? 'shadow-[0_0_20px_rgba(220,38,38,0.5)] border-red-900/50' : 
                      !isSpinning && item.type === 'good' && item.id !== 'start' ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)] border-emerald-900/50' : 
                      !isSpinning && item.type === 'pitfall' ? 'shadow-[0_0_20px_rgba(0,0,0,0.8)] border-black' : ''
                    }`}
                  >
                    {/* Item Icon */}
                    <div className="relative z-10 flex flex-col items-center p-2">
                      <motion.div
                        key={`${idx}-${item.id}`}
                        animate={isSpinning && spinningReels[idx] ? {
                          y: [0, -15, 15, 0],
                          filter: ["blur(0px)", "blur(6px)", "blur(0px)"],
                          scale: [1, 0.85, 1.15, 1]
                        } : {}}
                        transition={isSpinning && spinningReels[idx] ? {
                          duration: 0.08,
                          repeat: Infinity,
                          ease: "linear"
                        } : {}}
                        className="flex flex-col items-center"
                      >
                        {item.icon.startsWith('http') || item.icon.startsWith('input_file_') ? (
                          <img 
                            src={item.icon} 
                            alt={item.name} 
                            className={`w-20 h-20 object-contain drop-shadow-lg ${isSpinning && spinningReels[idx] ? 'opacity-40' : 'opacity-100'}`}
                            style={{ imageRendering: 'pixelated' }}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = document.getElementById(`fallback-${idx}`);
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span className="text-6xl drop-shadow-lg">{item.icon}</span>
                        )}
                        
                        {/* Fallback Emoji */}
                        <div 
                          id={`fallback-${idx}`} 
                          style={{ display: 'none' }}
                          className="text-6xl drop-shadow-lg"
                        >
                          {item.type === 'bad' ? '👾' : item.type === 'good' ? '👤' : '🧱'}
                        </div>
                      </motion.div>
                      
                      <div className="mt-2 bg-black/70 px-2 py-1 rounded text-white font-black text-[10px] uppercase tracking-tighter border border-white/20 text-center">
                        {isSpinning && spinningReels[idx] ? '???' : item.name}
                      </div>
                    </div>

                    {/* Cracks Overlay */}
                    {!isSpinning && selectedReelIndex === idx && slotBlockHealth > 0 && item.type === 'block' && slotBlockHealth < (3 + Math.floor(level / 5)) && (
                      <div 
                        className="absolute inset-0 z-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/broken-noise.png')] opacity-80"
                        style={{ 
                          filter: `contrast(${200 - (slotBlockHealth / (3 + Math.floor(level / 5))) * 100}%)`,
                          mixBlendMode: 'multiply'
                        }}
                      />
                    )}

                    {/* Health Bar */}
                    {!isSpinning && selectedReelIndex === idx && slotBlockHealth > 0 && (item.type === 'block' || item.type === 'pitfall') && (
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-stone-900 z-30">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-200"
                          style={{ width: `${(slotBlockHealth / (item.type === 'block' ? (item.id.includes('dirt') || item.id.includes('grass') || item.id.includes('sand') || item.id.includes('snow') ? 2 : item.id.includes('iron') ? 3 : item.id.includes('gold') ? 4 : 5) : 3)) * 100}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="w-full max-w-sm space-y-4">
                <button 
                  onClick={
                    pendingBattle && selectedReelIndex !== null 
                      ? () => startBattle(reels[selectedReelIndex]) 
                      : selectedReelIndex !== null && slotBlockHealth > 0 && (reels[selectedReelIndex].type === 'block' || reels[selectedReelIndex].type === 'pitfall')
                        ? minePathBlock 
                        : selectedReelIndex !== null && (reels[selectedReelIndex].type === 'chest' || reels[selectedReelIndex].type === 'good' || reels[selectedReelIndex].type === 'pitfall')
                          ? () => replaceReelItem(selectedReelIndex)
                          : roll
                  }
                  disabled={isSpinning || (reels[0].id !== 'start' && selectedReelIndex === null)}
                  className={`w-full py-6 rounded-2xl text-2xl font-black border-b-[8px] transition-all active:translate-y-2 shadow-xl uppercase tracking-wider ${
                    isSpinning || (reels[0].id !== 'start' && selectedReelIndex === null)
                    ? 'bg-stone-600 border-stone-800 text-stone-400 opacity-50 cursor-not-allowed' 
                    : pendingBattle ? 'bg-red-600 hover:bg-red-500 border-red-800 text-white' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800 text-white'
                  }`}
                >
                  {isSpinning 
                    ? 'SPINNING...' 
                    : pendingBattle 
                      ? 'ATTACK!' 
                      : slotBlockHealth > 0 
                        ? 'MINE IT!' 
                        : selectedReelIndex !== null && (reels[selectedReelIndex].type === 'chest' || reels[selectedReelIndex].type === 'good' || reels[selectedReelIndex].type === 'pitfall')
                          ? 'RE-ROLL'
                          : (reels[0].id !== 'start' && selectedReelIndex === null) 
                            ? 'CHOOSE A PATH' 
                            : 'SPIN!'}
                </button>

                {resources.elytra > 0 && !isSpinning && selectedReelIndex === null && (
                  <button 
                    onClick={skipRoll}
                    className="w-full py-3 rounded-xl text-lg font-black bg-purple-600 hover:bg-purple-500 border-b-6 border-purple-800 text-white transition-all active:translate-y-1 shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Zap size={18} /> SKIP ROLL (1 Elytra)
                  </button>
                )}
                
                <p className="text-center text-stone-400 font-black text-sm uppercase tracking-widest drop-shadow-sm">
                  {isSpinning ? 'Rolling the dice...' : selectedReelIndex === null ? 'Choose one of three paths!' : slotBlockHealth > 0 ? 'Tap the block to mine!' : 'Wait for the event...'}
                </p>

                {renderActionLog()}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Screen */}
        {gameState === 'inventory' && renderInventory()}

        {/* Glossary Screen */}
        {gameState === 'glossary' && renderGlossary()}

        {/* Battle Screen */}
        {gameState === 'battle' && enemy && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col pt-12 p-4 space-y-8 bg-stone-900/90 min-h-0 font-sans relative"
          >
            {/* Damage Flash Overlay */}
            <AnimatePresence>
              {showDamageFlash && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 border-[20px] border-red-600/50 pointer-events-none shadow-[inset_0_0_100px_rgba(220,38,38,0.5)]"
                />
              )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="flex items-center justify-center gap-6 w-full">
                <div 
                  onClick={playerAttack}
                  className={`relative w-64 h-64 bg-black border-4 border-stone-950 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 ${playerCooldown > 0 ? 'opacity-80' : 'hover:border-red-500 hover:shadow-red-900/20'}`}
                >
                  {enemy.icon.startsWith('http') || enemy.icon.startsWith('input_file_') ? (
                    <img 
                      src={enemy.icon} 
                      alt={enemy.name} 
                      className="w-full h-full object-cover" 
                      style={{ imageRendering: 'pixelated' }}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const span = document.createElement('span');
                          span.className = 'text-6xl';
                          span.innerText = '👾';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-8xl">{enemy.icon}</span>
                  )}

                  {/* Slash Effect */}
                  <AnimatePresence>
                    {showSlash && (
                      <motion.div 
                        initial={{ opacity: 0, pathLength: 0 }}
                        animate={{ opacity: 1, pathLength: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center"
                      >
                        <svg viewBox="0 0 100 100" className="w-full h-full text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,1)]">
                          {slashDirection === 'left' && (
                            <motion.path 
                              d="M 10 10 L 90 90" 
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="10"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                            />
                          )}
                          {slashDirection === 'right' && (
                            <motion.path 
                              d="M 90 10 L 10 90" 
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="10"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                            />
                          )}
                          {slashDirection === 'x' && (
                            <motion.path 
                              d="M 10 10 L 90 90 M 90 10 L 10 90" 
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="10"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                            />
                          )}
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Player Cooldown Overlay on Enemy Image */}
                  <motion.div 
                    className="absolute inset-0 bg-red-900/30 z-20 pointer-events-none origin-bottom"
                    animate={{ scaleY: playerCooldown / getPlayerAttackSpeed() }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                  
                  {/* Tap to Attack Hint */}
                  {playerCooldown === 0 && (
                    <div className="absolute bottom-4 inset-x-0 text-center">
                      <span className="bg-red-600 text-white text-xs font-black px-4 py-1 rounded-full animate-pulse uppercase tracking-widest shadow-lg">Tap to Attack</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={usePotion}
                  disabled={potions === 0}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-pink-700 hover:bg-pink-600 disabled:bg-stone-800 border-b-8 border-pink-900 rounded-2xl font-black text-xs transition-all active:translate-y-2 active:border-b-0 shadow-xl h-64 w-28"
                >
                  <Heart size={40} className={potions > 0 ? "animate-bounce" : ""} />
                  <span className="uppercase tracking-widest">Potion</span>
                  <span className="text-2xl">({potions})</span>
                </button>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-2xl text-white font-black uppercase tracking-tighter italic">
                  <span>{enemy.name}</span>
                  <span className="font-mono">{enemy.hp}/{enemy.maxHp} HP</span>
                </div>
                <div className="w-full h-8 bg-black rounded-full overflow-hidden border-4 border-stone-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    className="h-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                  />
                </div>
                {/* Enemy Cooldown Bar */}
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(enemyCooldown / getEnemyAttackSpeed(enemy.name)) * 100}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="h-32 bg-black/80 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-2 border-2 border-stone-800 shadow-inner shrink-0">
              {battleLog.slice(0, 5).map((log, i) => (
                <div key={i} className={i === 0 ? "text-white font-bold flex items-center gap-2" : "text-stone-500 flex items-center gap-2"}>
                  <div className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-stone-700'}`} />
                  {log}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Shop Screen */}
        {gameState === 'shop' && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 flex flex-col p-4 bg-stone-900 min-h-0 font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-white font-mono border-l-4 border-emerald-500 pl-3">VILLAGER SHOP</h2>
              <button onClick={() => setGameState('main')} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
              {SHOP_ITEMS.map(item => {
                const levelReq = item.tier === 'iron' ? 5 : item.tier === 'gold' ? 10 : item.tier === 'diamond' ? 20 : 0;
                const isLocked = level < levelReq;
                const currentItem = item.type === 'weapon' ? weapon : item.slot ? armor[item.slot as ArmorSlot] : null;
                const isInferior = currentItem && !isBetter(item, currentItem);
                const isDisabled = isLocked || isInferior;

                return (
                  <div key={item.id} className={`bg-black p-4 rounded-2xl border-2 border-stone-800 flex justify-between items-center shadow-xl ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-stone-900 rounded-xl border border-stone-700 shadow-inner">
                        {item.type === 'weapon' ? <Sword className="text-stone-300" /> : item.type === 'armor' ? <Shield className="text-stone-300" /> : <Heart className="text-pink-400" />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{item.name}</div>
                        <div className="text-stone-400 text-xs font-medium">
                          {isLocked ? `Unlocks at Level ${levelReq}` : isInferior ? 'Current gear is better' : `+${item.value} ${item.type === 'potion' ? 'Heal' : item.type === 'weapon' ? 'Damage' : 'Defense'}`}
                          {!isLocked && item.slot && <span className="ml-2 opacity-50 font-bold">({item.slot})</span>}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => !isDisabled && buyItem(item)}
                      disabled={isDisabled}
                      className={`px-5 py-3 rounded-xl font-black text-white flex items-center gap-2 border-b-4 transition-all active:translate-y-1 active:border-b-0 ${
                        isDisabled ? 'bg-stone-700 border-stone-900' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800 shadow-lg'
                      }`}
                    >
                      {item.type === 'potion' ? <Heart size={16} /> : <Gem size={16} />} <span className="font-mono">{item.emeraldCost}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Crafting Screen */}
        {gameState === 'crafting' && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 flex flex-col p-4 bg-stone-900 min-h-0 font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-white font-mono border-l-4 border-amber-500 pl-3">CRAFTING TABLE</h2>
              <button onClick={() => setGameState('main')} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
              {([...WEAPONS.slice(1), ...ARMOR] as any[])
                .filter(item => item.tier !== 'netherite')
                .sort((a, b) => {
                  const tiers = ['wood', 'iron', 'gold', 'diamond'];
                  return tiers.indexOf(a.tier) - tiers.indexOf(b.tier);
                })
                .map((item: any) => {
                const canCraft = Object.entries(item.cost || {}).every(([res, amount]) => resources[res as ResourceType] >= amount);
                const isEquipped = weapon.id === item.id || (Object.values(armor) as any[]).some(a => a.id === item.id);
                const currentItem = item.type === 'weapon' ? weapon : item.slot ? armor[item.slot as ArmorSlot] : null;
                const isInferior = currentItem && !isBetter(item, currentItem);
                const isDisabled = isEquipped || !canCraft || isInferior;
                
                return (
                  <div key={item.id} className={`bg-black p-4 rounded-2xl border-2 border-stone-800 flex justify-between items-center shadow-xl ${isEquipped ? 'border-emerald-500/50 bg-emerald-950/20' : isInferior ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-stone-900 rounded-xl border border-stone-700 shadow-inner ${getTierColor(item.tier)}`}>
                        {item.type === 'weapon' ? <Sword size={24} /> : <Shield size={24} />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{item.name}</div>
                        <div className="text-stone-400 text-xs font-medium mb-2">
                          {isInferior ? 'Current gear is better' : `+${item.value} ${item.type === 'weapon' ? 'Damage' : 'Defense'} ${item.slot ? `(${item.slot})` : ''}`}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(item.cost || {}).map(([res, amount]) => (
                            <div key={res} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-black border ${resources[res as ResourceType] >= amount ? 'bg-stone-900 border-stone-700 text-white' : 'bg-red-950/30 border-red-900 text-red-400'}`}>
                              <img 
                                src={
                                  res === 'wood' ? '/assets/images/wood_block.png' :
                                  res === 'iron' ? 'https://minecraft.wiki/images/Iron_Ingot_JE3_BE2.png' :
                                  res === 'gold' ? 'https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png' :
                                  res === 'diamond' ? 'https://minecraft.wiki/images/Diamond_JE3_BE3.png' :
                                  'https://minecraft.wiki/images/Emerald_JE3_BE3.png'
                                } 
                                className="w-5 h-5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <span className="font-mono">{amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => !isDisabled && craftItem(item)}
                      disabled={isDisabled}
                      className={`px-5 py-3 rounded-xl font-black text-white border-b-4 transition-all active:translate-y-1 active:border-b-0 ${
                        isEquipped ? 'bg-stone-700 border-stone-900' : isInferior ? 'bg-stone-800 border-stone-950 opacity-50' : canCraft ? 'bg-amber-600 hover:bg-amber-500 border-amber-800 shadow-lg' : 'bg-stone-800 border-stone-950 opacity-50'
                      }`}
                    >
                      {isEquipped ? 'EQUIPPED' : isInferior ? 'INFERIOR' : 'CRAFT'}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
