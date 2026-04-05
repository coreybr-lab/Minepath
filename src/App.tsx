/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Maximize,
  RefreshCw,
  Volume2,
  VolumeX
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

type GameState = 'start' | 'main' | 'battle' | 'shop' | 'crafting' | 'gameover' | 'inventory' | 'glossary' | 'boss_warning';
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

interface FireworkBurstProps {
  key?: any;
  x: string;
  y: string;
  color: string;
  delay: number;
}

const FireworkBurst = ({ x, y, color, delay }: FireworkBurstProps) => {
  const particles = 24;
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      {/* Core Flash */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, delay }}
        className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        style={{ backgroundColor: color }}
      />
      
      {/* Burst Particles */}
      {[...Array(particles)].map((_, i) => {
        const angle = (i / particles) * Math.PI * 2;
        const distance = 100 + Math.random() * 150;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ 
              x: tx, 
              y: ty + 50, // Gravity effect
              scale: [1, 1.5, 0],
              opacity: [1, 1, 0]
            }}
            transition={{ 
              duration: 1.5 + Math.random(), 
              delay, 
              ease: "easeOut" 
            }}
            className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
              imageRendering: 'pixelated'
            }}
          />
        );
      })}
    </div>
  );
};

const RaidVictoryEffect = () => {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#ffa500'];
  const bursts = 12;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden bg-black/20">
      {/* Big Center Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-white blur-[150px]"
      />

      {/* Multiple Bursts */}
      {[...Array(bursts)].map((_, i) => (
        <FireworkBurst
          key={i}
          x={`${15 + Math.random() * 70}%`}
          y={`${15 + Math.random() * 60}%`}
          color={colors[Math.floor(Math.random() * colors.length)]}
          delay={i * 0.3}
        />
      ))}

      {/* Screen Shake / Flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.2, repeat: 3, repeatDelay: 0.8 }}
        className="absolute inset-0 bg-white pointer-events-none"
      />

      {/* Victory Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -10 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center"
        >
          <h2 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_0_rgba(16,185,129,1)] uppercase">
            VICTORY
          </h2>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-3xl md:text-4xl font-black text-emerald-400 drop-shadow-lg mt-4"
          >
            RAID DEFEATED!
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default function App() {
  // --- Player State ---
  const [hp, setHp] = useState(20);
  const [level, setLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isJackpotActive, setIsJackpotActive] = useState(false);
  const [defeatedJackpotIndices, setDefeatedJackpotIndices] = useState<number[]>([]);
  const [isCannonMode, setIsCannonMode] = useState(false);
  const maxHp = isCannonMode ? 120 + (level * 2) : 20 + (level * 2);
  const [hpHighlight, setHpHighlight] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [enemyFlash, setEnemyFlash] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [nextCritThreshold, setNextCritThreshold] = useState(4);
  const [showCritShake, setShowCritShake] = useState(false);
  const [rainEffect, setRainEffect] = useState<'iron' | 'gold' | 'diamond' | 'emerald' | 'potion' | 'wood' | null>(null);
  const [rollCount, setRollCount] = useState(0);
  const [commonBlocksMined, setCommonBlocksMined] = useState(0);
  const [resources, setResources] = useState<Resources>({
    gold: 0,
    iron: 0,
    diamond: 0,
    emerald: 0,
    elytra: 0,
    wood: 0
  });
  const [potions, setPotions] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({ 'fist': 1 });
  const [shopItems, setShopItems] = useState<Item[]>([]);

  const refreshShop = useCallback(() => {
    const allPossibleItems = [...WEAPONS, ...ARMOR].filter(i => 
      i.id !== 'fist' && 
      i.tier !== 'netherite' && 
      i.tier !== 'none' &&
      !i.id.includes('elytra')
    );
    
    // Randomly pick 3 items
    const shuffled = [...allPossibleItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(item => {
      let cost = 5;
      if (item.tier === 'diamond') cost = 10;
      else if (item.tier === 'gold') cost = 8;
      else if (item.tier === 'iron') cost = 4;
      else if (item.tier === 'wood') cost = 2;
      return { ...item, emeraldCost: cost };
    });
    
    const healthPotion = { ...SHOP_ITEMS.find(i => i.id === 'health_potion')!, emeraldCost: 5 };
    setShopItems([healthPotion, ...selected]);
  }, []);

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);
  const [playerName, setPlayerName] = useState<string>('Player Name');
  const [highScores, setHighScores] = useState<{name: string, level: number}[]>(() => {
    const saved = localStorage.getItem('spincraft_highscores') || localStorage.getItem('minespin_highscores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [pendingBoss, setPendingBoss] = useState<'warden' | 'ender_dragon' | null>(null);
  const [lastWardenLevel, setLastWardenLevel] = useState(-100);
  const [lastEnderDragonLevel, setLastEnderDragonLevel] = useState(-100);
  const [lastBossLevel, setLastBossLevel] = useState(-100);
  const [extraLootCount, setExtraLootCount] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{ title: string, message: string, onConfirm: () => void }>({
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- Game Flow State ---
  const [gameState, setGameState] = useState<GameState>('start');
  const [deathMessage, setDeathMessage] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingBattle, setPendingBattle] = useState(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
  const [reels, setReels] = useState<SlotItem[]>([START_ITEM, START_ITEM, START_ITEM]);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [slotBlockHealth, setSlotBlockHealth] = useState<number>(0);
  const [roundCompleted, setRoundCompleted] = useState<boolean>(true);
  const [ambushChance, setAmbushChance] = useState<number>(0.05 + Math.random() * 0.1);
  const [isAmbush, setIsAmbush] = useState<boolean>(false);
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
  const [isCritSlash, setIsCritSlash] = useState(false);
  const [slashDirection, setSlashDirection] = useState<'left' | 'right' | 'x'>('left');
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [showCritStrobe, setShowCritStrobe] = useState(false);
  const [showRaidAlert, setShowRaidAlert] = useState(false);
  const [showSmokeEffect, setShowSmokeEffect] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showMissed, setShowMissed] = useState(false);
  const [showMineThemAll, setShowMineThemAll] = useState(false);
  const [potionFlash, setPotionFlash] = useState(false);
  const [collectedItems, setCollectedItems] = useState<{ id: number, icon: string, x: number, y: number, arcX: number }[]>([]);

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
  const battleLootRef = useRef<Record<string, number>>({});
  const [damageNumbers, setDamageNumbers] = useState<{ id: number, damage: number, x: number, y: number, isCritical?: boolean }[]>([]);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const missTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Spin sound effect
    if (isSpinning && !isMuted) {
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
  }, [isSpinning, isMuted]);

  useEffect(() => {
    // Cleanup spin audio on unmount
    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }
      if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
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

  useEffect(() => {
    if (gameState === 'boss_warning') {
      playSound(SOUNDS.negative);
      if (pendingBoss === 'warden') setTimeout(() => playSound(SOUNDS.wardenWarning), 500);
      else if (pendingBoss === 'ender_dragon') setTimeout(() => playSound(SOUNDS.dragonWarning), 500);
    } else if (gameState === 'shop' || gameState === 'crafting' || gameState === 'inventory') {
      playSound(SOUNDS.menuOpen, 0.3);
    }
  }, [gameState, pendingBoss]);

  useEffect(() => {
    if (gameState !== 'battle') {
      setShowMissed(false);
      if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
    }
  }, [gameState]);

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
    if (isMuted) return;
    const audio = new Audio(url);
    audio.volume = volume * 0.8;
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

  const triggerItemCollection = (itemId: string) => {
    const item = [...WEAPONS, ...ARMOR, ...SHOP_ITEMS, ...SLOT_ITEMS].find(i => i.id === itemId);
    if (!item || !item.icon) return;

    const id = Math.random();
    // Start at gold icon (middle of resource bar)
    const x = 50; 
    const y = 18;
    const arcX = 50 + (Math.random() - 0.5) * 20;
    
    setCollectedItems(prev => [...prev, { id, icon: item.icon!, x, y, arcX }]);
    setTimeout(() => {
      setCollectedItems(prev => prev.filter(i => i.id !== id));
    }, 3000);
  };

  const triggerPotionCollection = () => {
    const id = Math.random();
    // Start at gold icon (middle of resource bar)
    const x = 50; 
    const y = 18;
    const arcX = 50 + (Math.random() - 0.5) * 20;
    const icon = 'heart-icon';
    
    setCollectedItems(prev => [...prev, { id, icon, x, y, arcX }]);
    setPotionFlash(true);
    setTimeout(() => setPotionFlash(false), 1000);
    setTimeout(() => {
      setCollectedItems(prev => prev.filter(i => i.id !== id));
    }, 3000);
  };

  const addPotion = (amount: number = 1) => {
    setPotions(prev => prev + amount);
    for (let i = 0; i < amount; i++) {
      setTimeout(() => triggerPotionCollection(), i * 200);
    }
  };

  const handleNameSubmit = (name: string) => {
    const finalName = name.trim() === '' ? 'Player Name' : name;
    const oldName = playerName;
    setPlayerName(finalName);
    setIsNameModalOpen(false);
    
    const cannonNames = ['cannon', '67', 'lucas', 'owen'];
    const isCannonName = cannonNames.includes(finalName.toLowerCase());
    const isEnteringCannon = isCannonName && !isCannonMode;
    const isExitingCannon = !isCannonName && isCannonMode;

    if (isEnteringCannon) {
      setIsCannonMode(true);
      setHp(prev => prev + 100);
      setPotions(prev => prev + 100);
      setResources(prev => ({
        gold: prev.gold + 100,
        iron: prev.iron + 100,
        diamond: prev.diamond + 100,
        emerald: prev.emerald + 100,
        elytra: prev.elytra + 100,
        wood: prev.wood + 100
      }));
      
      // Give Netherite gear
      const netheriteSword = WEAPONS.find(w => w.id === 'netherite_sword');
      if (netheriteSword) {
        setInventory(prev => ({ ...prev, [netheriteSword.id]: 1 }));
        triggerItemCollection(netheriteSword.id);
      }
      
      const nHelmet = ARMOR.find(a => a.id === 'netherite_helmet');
      const nChest = ARMOR.find(a => a.id === 'netherite_chestplate');
      const nLegs = ARMOR.find(a => a.id === 'netherite_leggings');
      const nBoots = ARMOR.find(a => a.id === 'netherite_boots');
      
      if (nHelmet && nChest && nLegs && nBoots) {
        setInventory(prev => ({
          ...prev,
          [nHelmet.id]: 1,
          [nChest.id]: 1,
          [nLegs.id]: 1,
          [nBoots.id]: 1
        }));
        triggerItemCollection(nHelmet.id);
        triggerItemCollection(nChest.id);
        triggerItemCollection(nLegs.id);
        triggerItemCollection(nBoots.id);
      }
      addMessage(`${finalName.toUpperCase()} MODE ACTIVATED: +100 to all stats & Netherite Gear!`);
      playSound(SOUNDS.win);
    } else if (isExitingCannon) {
      setIsCannonMode(false);
      setHp(prev => Math.max(1, prev - 100));
      setPotions(prev => Math.max(0, prev - 100));
      setResources(prev => ({
        gold: Math.max(0, prev.gold - 100),
        iron: Math.max(0, prev.iron - 100),
        diamond: Math.max(0, prev.diamond - 100),
        emerald: Math.max(0, prev.emerald - 100),
        elytra: Math.max(0, prev.elytra - 100),
        wood: Math.max(0, prev.wood - 100)
      }));
      setInventory(prev => {
        const next = { ...prev };
        delete next['netherite_sword'];
        delete next['netherite_helmet'];
        delete next['netherite_chestplate'];
        delete next['netherite_leggings'];
        delete next['netherite_boots'];
        // Ensure fist remains if it was somehow removed
        if (Object.keys(next).length === 0) next['fist'] = 1;
        return next;
      });
      addMessage(`${oldName.toUpperCase()} MODE DEACTIVATED: -100 from all stats and Netherite gear removed.`);
    } else if (!isCannonName) {
      addMessage(`Welcome, ${finalName}!`);
    }
  };

  const getTotalDamage = useCallback(() => {
    let total = 0;
    Object.entries(inventory).forEach(([id, count]) => {
      const item = [...WEAPONS, ...ARMOR, ...SHOP_ITEMS].find(i => i.id === id);
      if (item && item.type === 'weapon') {
        total += item.value * (count as number);
      }
    });
    return isCannonMode ? 100 + total : Math.max(1, total);
  }, [inventory, isCannonMode]);

  const getTotalDefense = useCallback(() => {
    let total = 0;
    Object.entries(inventory).forEach(([id, count]) => {
      const item = [...WEAPONS, ...ARMOR, ...SHOP_ITEMS].find(i => i.id === id);
      if (item && item.type === 'armor') {
        total += item.value * (count as number);
      }
    });
    return isCannonMode ? 100 + total : total;
  }, [inventory, isCannonMode]);

  const canCraftAnything = useMemo(() => {
    return ([...WEAPONS.slice(1), ...ARMOR] as any[])
      .filter(item => item.tier !== 'netherite')
      .some(item => {
        if (!item.cost) return false;
        return Object.entries(item.cost).every(([res, amount]) => resources[res as ResourceType] >= (amount as number));
      });
  }, [resources]);

  const canAffordShopItem = useMemo(() => {
    return shopItems.some(item => (item.emeraldCost || 0) > 0 && resources.emerald >= (item.emeraldCost || 0));
  }, [shopItems, resources.emerald]);

  const getBestWeaponTier = useCallback(() => {
    const tiers = ['none', 'wood', 'iron', 'gold', 'diamond', 'netherite'];
    let bestTierIndex = 0;
    Object.keys(inventory).forEach(id => {
      const item = [...WEAPONS, ...SHOP_ITEMS].find(i => i.id === id);
      if (item && item.type === 'weapon') {
        const index = tiers.indexOf(item.tier);
        if (index > bestTierIndex) bestTierIndex = index;
      }
    });
    return tiers[bestTierIndex];
  }, [inventory]);

  const saveGame = () => {
    const gameStateData = {
      hp,
      resources,
      inventory,
      potions,
      level,
      playerName,
      isCannonMode,
      lastWardenLevel,
      lastEnderDragonLevel,
      lastBossLevel
    };
    localStorage.setItem('spincraft_save', JSON.stringify(gameStateData));
    addMessage('Game Saved!');
  };

  const loadGame = () => {
    const savedData = localStorage.getItem('spincraft_save') || localStorage.getItem('minespin_save') || localStorage.getItem('minepath_save') || localStorage.getItem('mineslot_rogue_save');
    if (savedData) {
      const data = JSON.parse(savedData);
      setHp(data.hp);
      setResources(data.resources);
      if (data.inventory) setInventory(data.inventory);
      setPotions(data.potions);
      setLevel(data.level);
      if (data.playerName) setPlayerName(data.playerName);
      if (data.isCannonMode) setIsCannonMode(data.isCannonMode);
      if (data.lastWardenLevel !== undefined) setLastWardenLevel(data.lastWardenLevel);
      if (data.lastEnderDragonLevel !== undefined) setLastEnderDragonLevel(data.lastEnderDragonLevel);
      if (data.lastBossLevel !== undefined) setLastBossLevel(data.lastBossLevel);
      setPendingBoss(null);
      setGameState('main');
      setReels([START_ITEM, START_ITEM, START_ITEM]);
      setSelectedReelIndex(null);
      refreshShop();
      addMessage('Game Loaded!');
    } else {
      addMessage('No save found!');
    }
  };

  const saveHighScore = () => {
    if (level > 0 && playerName) {
      setHighScores(prev => {
        const newScores = [...prev, { name: playerName, level }];
        newScores.sort((a, b) => b.level - a.level);
        const top3 = newScores.slice(0, 3);
        localStorage.setItem('spincraft_highscores', JSON.stringify(top3));
        return top3;
      });
    }
  };

  const resetGame = () => {
    saveHighScore();
    const initialMaxHp = isCannonMode ? 120 : 20;
    setHp(initialMaxHp);
    setResources({ gold: 0, iron: 0, diamond: 0, emerald: 0, elytra: 0, wood: 0 });
    setInventory({ 'fist': 1 });
    setPotions(0);
    setLevel(0);
    setLastWardenLevel(-100);
    setLastEnderDragonLevel(-100);
    setLastBossLevel(-100);
    setPendingBoss(null);
    setGameState('start');
    setOnScreenBlocks([]);
    setBattleLog([]);
    setSlotBlockHealth(0);
    setIsJackpotActive(false);
    setDefeatedJackpotIndices([]);
    setReels([START_ITEM, START_ITEM, START_ITEM]);
    setSelectedReelIndex(null);
    setRoundCompleted(true);
    setAmbushChance(0.05 + Math.random() * 0.1);
    setIsAmbush(false);
    refreshShop();
    setDeathMessage('');
    setEnemy(null);
    setPendingBattle(false);
    setIsSpinning(false);
    setActionLog(["Your adventure begins, spin to start!"]);
    setMessage("Your adventure begins, spin to start!");
  };

  // --- Slot Machine Logic ---
  const getWeightedRandomItem = (excludeEnemies = false): SlotItem => {
    // 3% chance for a Treasure Chest
    if (Math.random() < 0.03) {
      return SLOT_ITEMS.find(i => i.id === 'chest') || SLOT_ITEMS[0];
    }

    // 5% chance for a Pitfall
    if (Math.random() < 0.05 + (level * 0.005)) {
      return SLOT_ITEMS.find(i => i.id === 'pitfall') || SLOT_ITEMS[0];
    }

    const mobs = SLOT_ITEMS.filter(i => i.type === 'bad');
    const goodGuys = SLOT_ITEMS.filter(i => i.type === 'good');
    const blocks = SLOT_ITEMS.filter(i => i.type === 'block');
    
    // 10% chance for good guys (Steve, Alex, Villager, Iron Golem)
    const isGoodGuy = Math.random() < 0.10;
    if (isGoodGuy) {
      return goodGuys[Math.floor(Math.random() * goodGuys.length)];
    }

    // Now decide between enemy and block
    const baseMobWeight = level < 8 ? 0.3 : 0.5;
    const mobWeight = excludeEnemies ? 0 : Math.min(0.9, (baseMobWeight + (level * 0.015)) * 1.1);
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
        // Pillagers can appear now
        if (roll < 0.3) return getMob('Spider');
        if (roll < 0.6) return getMob('Creeper');
        if (roll < 0.9) return getMob('Pillager');
        return getMob('Zombie');
      }
      if (level < 20) {
        // Zoglin and Ravager can appear now
        if (roll < 0.3) return getMob('Creeper');
        if (roll < 0.5) return getMob('Pillager');
        if (roll < 0.7) return getMob('Zoglin');
        if (roll < 0.9) return getMob('Ravager');
        return getMob('Spider');
      }
      
      // Level 20-50
      if (level < 50) {
        if (roll < 0.10) return getMob('Creeper');
        if (roll < 0.44) return getMob('Pillager'); // 34%
        if (roll < 0.56) return getMob('Zoglin');
        if (roll < 0.90) return getMob('Ravager'); // 34%
        return getMob('Spider');
      }
      
      // Level 50+
      if (roll < 0.06) return getMob('Creeper');
      if (roll < 0.50) return getMob('Pillager'); // 44%
      if (roll < 0.56) return getMob('Zoglin');
      return getMob('Ravager'); // 44%
    } else {
      // Blocks
      const roll = Math.random();
      
      if (level >= 18) {
        // At level 18+, Diamond is 12% (doubled from 6%)
        if (roll < 0.34) {
          const commonBlocks = ['Dirt Block', 'Grass Block', 'Snow Block', 'Sand Block'];
          const randomCommon = commonBlocks[Math.floor(Math.random() * commonBlocks.length)];
          return blocks.find(b => b.name === randomCommon) || blocks[0];
        }
        if (roll < 0.54) return blocks.find(b => b.id === 'wood_block') || blocks[0];
        if (roll < 0.74) return blocks.find(b => b.name === 'Iron Block') || blocks[0];
        if (roll < 0.84) return blocks.find(b => b.name === 'Gold Block') || blocks[0];
        if (roll < 0.96) return blocks.find(b => b.name === 'Diamond Block') || blocks[0];
        return blocks.find(b => b.name === 'Emerald Block') || blocks[0];
      } else if (level >= 15) {
        // At level 15-17, Diamond is 6% (doubled from 3%)
        if (roll < 0.54) {
          const commonBlocks = ['Dirt Block', 'Grass Block', 'Snow Block', 'Sand Block'];
          const randomCommon = commonBlocks[Math.floor(Math.random() * commonBlocks.length)];
          return blocks.find(b => b.name === randomCommon) || blocks[0];
        }
        if (roll < 0.74) return blocks.find(b => b.id === 'wood_block') || blocks[0];
        if (roll < 0.84) return blocks.find(b => b.name === 'Iron Block') || blocks[0];
        if (roll < 0.89) return blocks.find(b => b.name === 'Gold Block') || blocks[0];
        if (roll < 0.95) return blocks.find(b => b.name === 'Diamond Block') || blocks[0];
        return blocks.find(b => b.name === 'Emerald Block') || blocks[0];
      } else {
        // Level < 15: 1% Diamond, 1% Emerald
        if (roll < 0.75) {
          const commonBlocks = ['Dirt Block', 'Grass Block', 'Snow Block', 'Sand Block'];
          const randomCommon = commonBlocks[Math.floor(Math.random() * commonBlocks.length)];
          return blocks.find(b => b.name === randomCommon) || blocks[0];
        }
        if (roll < 0.90) return blocks.find(b => b.id === 'wood_block') || blocks[0];
        if (roll < 0.97) return blocks.find(b => b.name === 'Iron Block') || blocks[0];
        if (roll < 0.98) {
          if (level < 10) return blocks.find(b => b.name === 'Iron Block') || blocks[0];
          return blocks.find(b => b.name === 'Gold Block') || blocks[0];
        }
        if (roll < 0.99) return blocks.find(b => b.name === 'Diamond Block') || blocks[0];
        return blocks.find(b => b.name === 'Emerald Block') || blocks[0];
      }
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
      const newMaxHp = isCannonMode ? 120 + (newLevel * 2) : 20 + (newLevel * 2);
      setLevel(newLevel);
      playSound(SOUNDS.chaching, 0.3);
      setHp(prev => Math.min(newMaxHp, prev + 2));
      refreshShop();
      
      if (newLevel === 20) {
        setPendingBoss('warden');
        setLastWardenLevel(newLevel);
        setLastBossLevel(newLevel);
        setGameState('boss_warning');
      } else if (newLevel === 30) {
        setPendingBoss('ender_dragon');
        setLastEnderDragonLevel(newLevel);
        setLastBossLevel(newLevel);
        setGameState('boss_warning');
      }
    }, 1000); // 1 second spin for single re-roll
  };

  const roll = () => {
    if (isSpinning || gameState !== 'main') return;
    
    setIsSpinning(true);
    setPendingBattle(false);
    setSpinningReels([true, true, true]);
    setSlotBlockHealth(0); // Reset slot block health
    setIsJackpotActive(false);
    setDefeatedJackpotIndices([]);
    setSelectedReelIndex(null);
    setRoundCompleted(false);
    setIsAmbush(false);
    setMessage(''); // Clear previous message
    setRollCount(prev => prev + 1);
    
    let finalItems = [getWeightedRandomItem(), getWeightedRandomItem(), getWeightedRandomItem()];
    
    // Jackpot logic (Force triple rolls based on probability)
    const jackpotRoll = Math.random();
    if (jackpotRoll < 0.002) { // 0.2% Emerald
      const item = SLOT_ITEMS.find(i => i.id === 'emerald_block')!;
      finalItems = [item, item, item];
    } else if (jackpotRoll < 0.004) { // 0.2% Diamond
      const item = SLOT_ITEMS.find(i => i.id === 'diamond_block')!;
      finalItems = [item, item, item];
    } else if (jackpotRoll < 0.006) { // 0.2% Gold
      const item = SLOT_ITEMS.find(i => i.id === 'gold_block')!;
      finalItems = [item, item, item];
    } else if (jackpotRoll < 0.008) { // 0.2% Iron
      const item = SLOT_ITEMS.find(i => i.id === 'iron_block')!;
      finalItems = [item, item, item];
    } else if (jackpotRoll < 0.01) { // 0.2% Wood (Total 1% chance for ANY resource jackpot)
      const item = SLOT_ITEMS.find(i => i.id === 'wood_block')!;
      finalItems = [item, item, item];
    }

    // Check for Ambush (3 enemies)
    if (Math.random() < ambushChance) {
      const mobs = SLOT_ITEMS.filter(i => i.type === 'bad');
      const getMob = (name: string) => mobs.find(m => m.name === name) || mobs[0];
      
      // Force 3 random enemies appropriate for the level
      finalItems = [
        getWeightedRandomItem(false),
        getWeightedRandomItem(false),
        getWeightedRandomItem(false)
      ].map(item => {
        if (item.type === 'bad') return item;
        // If it didn't roll a bad guy, force one using the level-appropriate weights
        let forcedMob;
        let safety = 0;
        do {
          forcedMob = getWeightedRandomItem(false);
          safety++;
        } while (forcedMob.type !== 'bad' && safety < 100);
        return forcedMob.type === 'bad' ? forcedMob : getMob('Zombie');
      });
    }
    
    // Use a local variable to track which reels are spinning to avoid stale closures in the interval
    const spinningRef = [true, true, true];
    
    // More dramatic shuffling: faster and more frequent updates
    const spinInterval = setInterval(() => {
      setReels(prev => prev.map((item, i) => {
        if (spinningRef[i]) {
          // Flash random items from the pool
          return SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        }
        return item;
      }));
    }, 60); // Faster shuffle (60ms instead of 100ms)

    // Staggered stop with dramatic pauses
    // Stop reel 1
    setTimeout(() => {
      spinningRef[0] = false;
      setSpinningReels([false, true, true]);
      setReels(prev => [finalItems[0], prev[1], prev[2]]);
      playSound(SOUNDS.hit); // Add a "clunk" sound when it lands
    }, 1200); // Longer spin for more drama

    // Stop reel 2
    setTimeout(() => {
      spinningRef[1] = false;
      setSpinningReels([false, false, true]);
      setReels(prev => [prev[0], finalItems[1], prev[2]]);
      playSound(SOUNDS.hit);
    }, 2000);

    // Stop reel 3
    setTimeout(() => {
      spinningRef[2] = false;
      clearInterval(spinInterval);
      setSpinningReels([false, false, false]);
      setReels(finalItems);
      setIsSpinning(false);
      
      const allBad = finalItems.every(item => item.type === 'bad');
      if (allBad) {
        setIsAmbush(true);
        playSound(SOUNDS.negative);
      } else {
        playSound(SOUNDS.hit);
      }
      
      // Level up and heal
      const newLevel = level + 1;
      const newMaxHp = isCannonMode ? 120 + (newLevel * 2) : 20 + (newLevel * 2);
      setLevel(newLevel);
      playSound(SOUNDS.chaching, 0.3);
      setHp(prev => Math.min(newMaxHp, prev + 2));
      refreshShop();
      
      // Boss spawn chance logic
      let bossTriggered = false;
      const bossCooldown = 10; // Minimum 10 levels between any boss events
      
      if (newLevel - lastBossLevel >= bossCooldown) {
        // Warden check
        if (newLevel >= 30 && newLevel - lastWardenLevel >= 30) {
          const wardenChance = Math.min(0.25, 0.05 + (newLevel - 30) * 0.025);
          if (Math.random() < wardenChance) {
            setPendingBoss('warden');
            setLastWardenLevel(newLevel);
            setLastBossLevel(newLevel);
            setGameState('boss_warning');
            bossTriggered = true;
          }
        }
        
        // Ender Dragon check (only if Warden didn't trigger)
        if (!bossTriggered && newLevel >= 50 && newLevel - lastEnderDragonLevel >= 50) {
          const dragonChance = Math.min(0.25, 0.05 + (newLevel - 50) * 0.025);
          if (Math.random() < dragonChance) {
            setPendingBoss('ender_dragon');
            setLastEnderDragonLevel(newLevel);
            setLastBossLevel(newLevel);
            setGameState('boss_warning');
            bossTriggered = true;
          }
        }
      }
      
      setMessage(`Level ${newLevel}: Choose your path!`);
      checkResult(finalItems);
    }, 2800);
  };

  const triggerDamageFlash = () => {
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 500);
  };

  const triggerRainEffect = (type: 'iron' | 'gold' | 'diamond' | 'emerald' | 'potion' | 'wood') => {
    setRainEffect(type);
    playSound(SOUNDS.win, 0.3);
    setTimeout(() => setRainEffect(null), 4000);
  };

  const triggerGameOver = (message: string) => {
    saveHighScore();
    setDeathMessage(message);
    // Delay game over screen by 2 seconds to show the final blow
    setTimeout(() => {
      playSound(SOUNDS.death);
      setGameState('gameover');
    }, 2000);
  };

  const checkResult = (result: SlotItem[]) => {
    const allBad = result.every(item => item.type === 'bad');
    const allGood = result.every(item => item.type === 'good');
    const allSame = result.every(item => item.id === result[0].id);
    
    // Triple roll rewards/penalties
    if (allSame) {
      const first = result[0];
      const rewardAmt = Math.floor(Math.random() * 18) + 3; // 3 to 20
      if (first.id === 'iron_block') {
        playSound(SOUNDS.jackpot);
        triggerRainEffect('iron');
        collectResource('iron', rewardAmt);
        addMessage(`IRON JACKPOT! +${rewardAmt} Iron Ingots!`);
      } else if (first.id === 'gold_block') {
        playSound(SOUNDS.jackpot);
        triggerRainEffect('gold');
        collectResource('gold', rewardAmt);
        addMessage(`GOLD JACKPOT! +${rewardAmt} Gold Coins!`);
      } else if (first.id === 'diamond_block') {
        playSound(SOUNDS.jackpot);
        triggerRainEffect('diamond');
        collectResource('diamond', rewardAmt);
        addMessage(`DIAMOND JACKPOT! +${rewardAmt} Diamonds!`);
      } else if (first.id === 'emerald_block') {
        playSound(SOUNDS.jackpot);
        triggerRainEffect('emerald');
        collectResource('emerald', rewardAmt);
        addMessage(`EMERALD JACKPOT! +${rewardAmt} Emeralds!`);
      } else if (first.id === 'wood_block') {
        playSound(SOUNDS.jackpot);
        triggerRainEffect('wood');
        collectResource('wood', rewardAmt);
        addMessage(`WOOD JACKPOT! +${rewardAmt} Wood!`);
      } else if (first.id === 'alex') {
        playSound(SOUNDS.jackpot);
        triggerRainEffect('potion');
        addPotion(rewardAmt);
        addMessage(`ALEX JACKPOT! +${rewardAmt} Health Potions!`);
      } else if (first.type === 'bad') {
        triggerDamageFlash();
        const newHp = Math.max(0, hp - 2);
        setHp(newHp);
        playSound(SOUNDS.playerHit);
        addMessage(`TRIPLE ${first.name.toUpperCase()}! Took 2 damage!`);
        if (newHp <= 0) {
          triggerGameOver(`Ambushed by triple ${first.name}s for 2 damage.`);
        }
      }
    }
    
    // Also spawn some random blocks in the mining area for variety
    if (!allBad && !allGood && Math.random() > 0.5) {
      spawnBlock();
    }

    const pillagerCount = result.filter(item => item.id === 'pillager').length;
    const ravagerCount = result.filter(item => item.id === 'ravager').length;
    const isRaid = pillagerCount === 2 && ravagerCount === 1;
    const isCommonBlock = result[0].id === 'dirt_block' || result[0].id === 'grass_block' || result[0].id === 'snow_block' || result[0].id === 'sand_block';

    if (allBad) {
      if (allSame) {
        setIsJackpotActive(true);
        setDefeatedJackpotIndices([]);
        addMessage("JACKPOT! Triple Mobs! Defeat them all!");
      } else if (isRaid) {
        setIsJackpotActive(true);
        setDefeatedJackpotIndices([]);
        triggerDamageFlash();
        setShowRaidAlert(true);
        setTimeout(() => setShowRaidAlert(false), 2500);
        playSound(SOUNDS.raid);
        addMessage("RAID! Defeat the Pillagers and Ravager!");
      }
    } else if (allGood) {
      if (allSame && result[0].id === 'chest') {
        setIsJackpotActive(true);
        setDefeatedJackpotIndices([]);
        playSound(SOUNDS.jackpot);
        addMessage("JACKPOT! Triple Chests! Open them all!");
      } else {
        playSound(SOUNDS.win, 0.28);
        receiveRandomItem();
      }
    } else if (allSame && isCommonBlock) {
      setIsJackpotActive(true);
      setDefeatedJackpotIndices([]);
      setSelectedReelIndex(0);
      setSlotBlockHealth(3);
      playSound(SOUNDS.jackpot);
      setShowMineThemAll(true);
      setTimeout(() => setShowMineThemAll(false), 3000);
      addMessage("JACKPOT! Triple Blocks! MINE THEM ALL!");
    }
  };

  // --- Interaction Logic ---
  const handleReelClick = (index: number) => {
    if (isSpinning || roundCompleted) return;
    
    // If already selected, allow mining/attacking by clicking again
    if (selectedReelIndex === index) {
      const item = reels[index];
      if (item.type === 'block' || item.type === 'pitfall') {
        spinCraftBlock();
        return;
      }
      if (item.type === 'bad' && pendingBattle) {
        startBattle(item);
        return;
      }
      return;
    }
    
    // If another reel is already selected, don't allow changing selection
    if (selectedReelIndex !== null) return;
    
    if (isJackpotActive && defeatedJackpotIndices.includes(index)) return;
    
    const item = reels[index];
    const isCommonBlockJackpot = isJackpotActive && (reels[0].id === 'dirt_block' || reels[0].id === 'grass_block' || reels[0].id === 'snow_block' || reels[0].id === 'sand_block') && reels.every(r => r.id === reels[0].id);

    if (isCommonBlockJackpot) {
      setSelectedReelIndex(index);
      setPendingBattle(false);
      if (slotBlockHealth <= 0) {
        setSlotBlockHealth(3); // Common blocks have 3 health
      }
      spinCraftBlock();
      return;
    }

    setSelectedReelIndex(index);
    setPendingBattle(false);
    setSlotBlockHealth(0);
    
    if (item.type === 'block') {
      playSound(SOUNDS.mine, 0.28);
      // Blocks break in 2-5 hits depending on type
      let health = 3;
      if (item.id.includes('dirt') || item.id.includes('grass') || item.id.includes('sand') || item.id.includes('snow') || item.id.includes('wood')) {
        health = 3;
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
      playSound(SOUNDS.hurt);
      const rawDamage = 2 + Math.floor(level / 5);
      const defense = getTotalDefense();
      const damage = Math.max(1, Math.ceil((rawDamage * rawDamage) / (rawDamage + defense)));
      const newHp = Math.max(0, hp - damage);
      setHp(newHp);
      triggerHpHighlight();
      addMessage(`Ouch! Fell off a cliff! Lost ${damage} HP.`);
      
      if (newHp <= 0) {
        triggerGameOver(`Fell off a cliff for ${damage} damage.`);
      }
      
      // Pitfalls no longer require mining, just re-roll
      setSlotBlockHealth(0);
      setRoundCompleted(true);
      setMessage(`Fell off! Spin to move on!`);
    }
  };

  const openChest = (index: number) => {
    if (isSpinning) return;
    
    playSound(SOUNDS.win, 0.28);
    
    const roll = Math.random();
    const maxResource = Math.max(1, Math.floor(level / 2));
    
    if (roll < 0.1) {
      // 10% chance: JACKPOT - All resources + Item + Potion
      const gold = Math.floor(Math.random() * 8) + 1; // 1-8
      const diamonds = Math.floor(Math.random() * 5) + 1; // 1-5
      const emeralds = Math.floor(Math.random() * 8) + 1; // 1-8
      const iron = Math.floor(Math.random() * 10) + 1; // 1-10
      const wood = Math.floor(Math.random() * 10) + 1; // 1-10
      
      collectResource('gold', gold, false, 0);
      collectResource('diamond', diamonds, false, 400);
      collectResource('emerald', emeralds, false, 800);
      collectResource('iron', iron, false, 1200);
      collectResource('wood', wood, false, 1600);
      
      receiveRandomItem();
      addPotion(1);
      
      addMessage(`JACKPOT CHEST! Found a massive haul!`);
    } else {
      // 90% chance: Mixed loot
      // 1. Random resources (always at least 1)
      const numResources = Math.floor(Math.random() * 2) + 1; // 1-2 types
      for (let i = 0; i < numResources; i++) {
        const resRoll = Math.random();
        let type: ResourceType = 'wood';
        if (resRoll < 0.05) type = 'diamond';
        else if (resRoll < 0.15) type = 'gold';
        else if (resRoll < 0.30) type = 'emerald';
        else if (resRoll < 0.65) type = 'iron';
        else type = 'wood';

        let maxAmt = 10;
        if (type === 'diamond') maxAmt = 5;
        else if (type === 'gold') maxAmt = 8;
        else if (type === 'emerald') maxAmt = 8;
        
        const amount = Math.floor(Math.random() * maxAmt) + 1;
        collectResource(type, amount, false, i * 400);
      }
      
      // 2. 30% chance for an item (weapon/armor)
      if (Math.random() < 0.3) {
        receiveRandomItem();
      }
      
      // 3. 20% chance for a potion
      if (Math.random() < 0.2) {
        addPotion(1);
        addMessage(`Found a Health Potion in the chest!`);
      }
      
      addMessage(`Opened the chest! Found some loot.`);
    }
    
    if (isJackpotActive) {
      const newDefeated = [...defeatedJackpotIndices, index];
      setDefeatedJackpotIndices(newDefeated);
      if (newDefeated.length === 3) {
        setIsJackpotActive(false);
        setRoundCompleted(true);
      }
    } else {
      setRoundCompleted(true);
    }
  };

  const spinCraftBlock = () => {
    if (isSpinning || slotBlockHealth <= 0 || selectedReelIndex === null) return;

    const block = reels[selectedReelIndex];
    if (block.type !== 'block' && block.type !== 'pitfall') return;

    if (slotBlockHealth > 1) {
      playSound(SOUNDS.mine, 0.28); // Mining sound
      setSlotBlockHealth(prev => prev - 1);
    } else {
      const isCommonBlockJackpot = isJackpotActive && (reels[0].id === 'dirt_block' || reels[0].id === 'grass_block' || reels[0].id === 'snow_block' || reels[0].id === 'sand_block') && reels.every(r => r.id === reels[0].id);

      if (isCommonBlockJackpot) {
        playSound(SOUNDS.break, 0.28);
        // Process all three blocks
        reels.forEach((b, i) => {
          handleDecorativeBlockLoot(b.id, i);
        });
        setIsJackpotActive(false);
        setSlotBlockHealth(0);
        setRoundCompleted(true);
        return;
      }

      if (block.type === 'block') {
        if (block.resource) {
          let amount = Math.floor(Math.random() * 2) + 2; // 2-3 resources
          let dropped = true;
          
          if (dropped) {
            playSound(SOUNDS.break, 0.28);
            collectResource(block.resource, amount);
          } else {
            playSound(SOUNDS.negative);
            addMessage(`The ${block.name} was empty.`);
          }
        } else {
          if (handleDecorativeBlockLoot(block.id, selectedReelIndex)) {
            return; // Chest spawned, don't finish round
          }
        }
      } else if (block.type === 'pitfall') {
        playSound(SOUNDS.break, 0.28);
        addMessage('Climbed out of the cliff!');
      }
      
      setSlotBlockHealth(0);
      setRoundCompleted(true);
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
        const amount = Math.floor(Math.random() * 2) + 2; // 2-3 resources
        collectResource(block.type.resource, amount);
      } else {
        handleDecorativeBlockLoot(block.type.id);
      }
      setOnScreenBlocks(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleDecorativeBlockLoot = (blockId: string, reelIndex?: number) => {
    const roll = Math.random();
    const newMinedCount = commonBlocksMined + 1;
    setCommonBlocksMined(newMinedCount);
    
    // 15% base chance for a chest, or guaranteed every 10 blocks
    const chestChance = 0.15;
    const forceChest = newMinedCount >= 10;
    
    if (reelIndex !== undefined && (roll < chestChance || forceChest)) {
      const chestItem = SLOT_ITEMS.find(i => i.id === 'chest')!;
      setReels(prev => {
        const next = [...prev];
        next[reelIndex] = chestItem;
        return next;
      });
      playSound(SOUNDS.chaching);
      addMessage('A hidden chest appeared!');
      setSlotBlockHealth(0);
      setSelectedReelIndex(null);
      setCommonBlocksMined(0); // Reset pity counter
      return true; // Chest spawned
    }
    
    // Basic blocks (snow, sand, dirt, grass) have 25% loot chance
    const emptyChance = 0.75;
    if (roll < emptyChance) {
      // Chance empty
      playSound(SOUNDS.negative);
      addMessage('The block was empty.');
      return false;
    }
    
    // 25% chance to drop something
    const lootRoll = Math.random();
    if (lootRoll < 0.4) {
      playSound(SOUNDS.break, 0.28);
      collectResource('emerald', 1);
    } else if (lootRoll < 0.7) {
      playSound(SOUNDS.break, 0.28);
      addPotion(1);
      addMessage('Found a Health Potion in the block!');
    } else {
      playSound(SOUNDS.break, 0.28);
      const possibleItems = [...WEAPONS.slice(1), ...ARMOR].filter(i => i.tier !== 'netherite');
      const piece = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      setInventory(prev => ({ ...prev, [piece.id]: (prev[piece.id] || 0) + 1 }));
      triggerItemCollection(piece.id);
      addMessage(`Found ${piece.name} in the block!`);
    }
    return false;
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
      if (char.name === 'Alex') {
        const healAmount = Math.floor(maxHp * 0.25);
        setHp(prev => Math.min(maxHp, prev + healAmount));
        rewardMsg = `Alex healed you for ${healAmount} HP (25%)!`;
        if (Math.random() < 0.5) {
          addPotion(1);
          rewardMsg += ` And gave you a Potion!`;
        }
      } else {
        setHp(prev => Math.min(maxHp, prev + 5));
        rewardMsg = `Steve healed you for 5 HP!`;
        
        let tier = 'wood';
        if (level >= 15) tier = 'diamond';
        else if (level >= 10) tier = 'gold';
        else if (level >= 5) tier = 'iron';
        
        const possibleItems = [...WEAPONS.slice(1), ...ARMOR].filter(i => i.tier === tier);
        if (possibleItems.length > 0) {
          const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
          setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
          triggerItemCollection(item.id);
          rewardMsg += ` And gave you a ${item.name}!`;
        }
      }
    } else if (char.name === 'Villager') {
      const emeralds = Math.floor(Math.random() * 3) + 1;
      collectResource('emerald', emeralds, false);
      rewardMsg = `The Villager traded you ${emeralds} Emeralds!`;
    } else if (char.name === 'Iron Golem') {
      const ironAmount = Math.floor(Math.random() * 6) + 2; // 2-7
      collectResource('iron', ironAmount, false);
      rewardMsg = `The Iron Golem protected you and gave ${ironAmount} Iron!`;
    }

    addMessage(rewardMsg);
    setSlotBlockHealth(0);
    setRoundCompleted(true);
  };

  // --- Battle Logic ---
  const getScaledEnemyStats = (name: string, currentLevel: number) => {
    let baseHp = 14;
    let minAtk = 0.8;
    let maxAtk = 1.6;
    let missChance = 0; // Default to 0, will be calculated based on defense for non-bosses
    
    if (name === 'Zombie') { baseHp = 6; minAtk = 0.8; maxAtk = 1.6; }
    else if (name === 'Spider') { baseHp = 5; minAtk = 0.8; maxAtk = 1.6; }
    else if (name === 'Creeper') { baseHp = 7.2; minAtk = 1.44; maxAtk = 2.88; }
    else if (name === 'Pillager') { baseHp = 17; minAtk = 2.4; maxAtk = 4; }
    else if (name === 'Zoglin') { baseHp = 31; minAtk = 3.2; maxAtk = 4.8; }
    else if (name === 'Ravager') { baseHp = 81; minAtk = 3.2; maxAtk = 4.8; }
    else if (name === 'Warden') { baseHp = 147; minAtk = 5.6; maxAtk = 8.8; }
    else if (name === 'Ender Dragon') { baseHp = 420; minAtk = 48; maxAtk = 67.2; }

    if (name !== 'Ender Dragon') {
      baseHp = Math.floor(baseHp * 1.1);
    }
    
    const hpScale = 1 + (currentLevel * 0.38 * 1.2); // Increased by 20%
    const atkScale = (name === 'Ender Dragon' ? 1 + (currentLevel * 0.02) : 1 + (currentLevel * 0.4)) * 1.1; // Increased by 10%
    
    return {
      hp: Math.floor(baseHp * hpScale),
      minAtk: Math.floor(minAtk * atkScale),
      maxAtk: Math.floor(maxAtk * atkScale),
      missChance
    };
  };

  const startBattle = (enemyType: SlotItem) => {
    playSound(SOUNDS.hit);
    setExtraLootCount(0);
    setPendingBoss(null);
    
    const stats = getScaledEnemyStats(enemyType.name, level);
    
    const newEnemy = {
      name: enemyType.name,
      hp: stats.hp,
      maxHp: stats.hp,
      minAtk: stats.minAtk,
      maxAtk: stats.maxAtk,
      missChance: stats.missChance,
      icon: enemyType.icon,
    };
    setEnemy(newEnemy as any);
    battleLootRef.current = {};
    setBattleLog([`A wild ${newEnemy.name} appeared (Level ${level})!`]);
    setGameState('battle');
    setHitCount(0);
    setNextCritThreshold(Math.floor(Math.random() * 3) + 3); // 3, 4, or 5
    setShowCritShake(false);
    
    // Play enemy-specific sound when battle starts
    if (newEnemy.name === 'Zombie') playSound(SOUNDS.zombie);
    else if (newEnemy.name === 'Spider') playSound(SOUNDS.spider);
    else if (newEnemy.name === 'Creeper') playSound(SOUNDS.creeper);
    else if (newEnemy.name === 'Pillager') playSound(SOUNDS.pillager);
    else if (newEnemy.name === 'Ravager') playSound(SOUNDS.ravager);
    else if (newEnemy.name === 'Warden') playSound(SOUNDS.warden);
    else if (newEnemy.name === 'Ender Dragon') playSound(SOUNDS.dragon);
    
    setPlayerCooldown(0);
    setEnemyCooldown(getEnemyAttackSpeed(newEnemy.name));
  };

  const getPlayerAttackSpeed = () => {
    const attackPower = getTotalDamage();
    const baseSpeed = 574;
    // 1 attack power = 0.5% faster. No cap, but floor at 100ms (tick rate)
    const speedMultiplier = 1 - (attackPower * 0.005);
    return Math.max(100, baseSpeed * speedMultiplier);
  };

  const getEnemyAttackSpeed = (name: string) => {
    let speed = 4000;
    switch (name) {
      case 'Zombie': speed = 3200; break;
      case 'Spider': speed = 2160; break;
      case 'Creeper': speed = 5875; break;
      case 'Pillager': speed = 4000; break;
      case 'Zoglin': speed = 3360; break;
      case 'Ravager': speed = 9600; break;
      case 'Warden': speed = 14400; break;
      case 'Ender Dragon': speed = 16000; break;
      default: speed = 4000; break;
    }

    // Base 10% speed buff + additional 10% (0.9 * 0.9 = 0.81)
    let multiplier = 0.81;
    // Additional 0.5% speed increase every level
    multiplier -= (level * 0.005);
    
    // No cap, but floor at 100ms (tick rate) to ensure game stability
    speed = Math.floor(speed * multiplier);
    return Math.max(100, speed);
  };

  const playerAttack = () => {
    if (!enemy || playerCooldown > 0 || hp <= 0) return;
    
    // Post-death loot logic
    if (enemy.hp <= 0) {
      if (extraLootCount < 2) {
        setExtraLootCount(prev => prev + 1);
        playSound(SOUNDS.hit);
        
        const roll = Math.random();
        let lootMsg = '';
        
        // Random loot: Wood (40%), Iron (40%), Gold (10%), Potion (10%)
        if (roll < 0.4) {
          const amt = 1;
          collectResource('wood', amt, false);
          battleLootRef.current['wood'] = (battleLootRef.current['wood'] || 0) + amt;
          lootMsg = `Looted ${amt} wood from the remains!`;
        } else if (roll < 0.8) {
          const amt = 1;
          collectResource('iron', amt, false);
          battleLootRef.current['iron'] = (battleLootRef.current['iron'] || 0) + amt;
          lootMsg = `Looted ${amt} iron from the remains!`;
        } else if (roll < 0.88) { // Reduced gold drop rate by 20% (was 0.9)
          const amt = 1;
          collectResource('gold', amt, false);
          battleLootRef.current['gold'] = (battleLootRef.current['gold'] || 0) + amt;
          lootMsg = `Looted ${amt} gold from the remains!`;
        } else {
          addPotion(1);
          battleLootRef.current['potion'] = (battleLootRef.current['potion'] || 0) + 1;
          lootMsg = `Looted a health potion from the remains!`;
        }
        
        setBattleLog(prev => [lootMsg, ...prev]);
        setPlayerCooldown(getPlayerAttackSpeed());
      }
      return;
    }
    
    const newHitCount = hitCount + 1;
    const isCritical = newHitCount >= nextCritThreshold;
    
    if (isCritical) {
      setHitCount(0);
      setNextCritThreshold(Math.floor(Math.random() * 3) + 3); // 3, 4, or 5
      playSound(SOUNDS.crit);
    } else {
      setHitCount(newHitCount);
      playSound(SOUNDS.attack);
    }
    
    setSlashDirection(prev => prev === 'left' ? 'right' : 'left');
    setIsCritSlash(isCritical);
    setShowSlash(true);
    setTimeout(() => setShowSlash(false), 300);
    
    const baseDamage = getTotalDamage();
    const damage = isCritical ? Math.ceil(baseDamage * 1.5) : baseDamage;
    const newEnemyHp = Math.max(0, enemy.hp - damage);
    
    if (isCritical) {
      setShowCritShake(true);
      setShowCritStrobe(true);
      setTimeout(() => setShowCritShake(false), 300);
      setTimeout(() => setShowCritStrobe(false), 400); // 400ms for 2 strobes
    }
    
    const newDamageNumber = {
      id: Date.now() + Math.random(),
      damage,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      isCritical
    };
    setDamageNumbers(prev => [...prev, newDamageNumber]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== newDamageNumber.id));
    }, 1000);

    setEnemy({ ...enemy, hp: newEnemyHp });
    setBattleLog(prev => [`${isCritical ? 'CRITICAL HIT! ' : ''}You hit ${enemy.name} for ${damage} damage!`, ...prev]);
    
    setPlayerCooldown(getPlayerAttackSpeed());
    
    if (newEnemyHp <= 0) {
      setSlashDirection('x');
      setShowSlash(true);
      if (enemy.name === 'Ravager') {
        playSound(SOUNDS.ravagerDeath, 0.28);
      } else {
        playSound(SOUNDS.defeat, 0.28);
      }
           // Random Loot Logic based on enemy type
      let lootItems: string[] = [];
      const roll = Math.random();
      
      let gotPotion = false;
      if (Math.random() < 0.15) { // Increased potion chance slightly
        addPotion(1);
        battleLootRef.current['potion'] = (battleLootRef.current['potion'] || 0) + 1;
        gotPotion = true;
      }
      
      if (gotPotion) lootItems.push('1 potion');
      
      const dropItem = (tier: string, count: number) => {
        const possibleItems = [...WEAPONS.slice(1), ...ARMOR].filter(i => i.tier === tier);
        if (possibleItems.length > 0) {
          const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
          setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + count }));
          triggerItemCollection(item.id);
          battleLootRef.current[item.name] = (battleLootRef.current[item.name] || 0) + count;
          lootItems.push(`${count} ${item.name}`);
        }
      };

      // General Resource Loot (All enemies can drop these)
      const resourceChances: Record<string, number> = {
        wood: 0.35,
        iron: 0.30,
        gold: 0.15,
        emerald: 0.12,
        diamond: 0.06
      };

      Object.entries(resourceChances).forEach(([res, chance]) => {
        if (Math.random() < chance) {
          const amount = Math.floor(Math.random() * 3) + 1;
          collectResource(res as ResourceType, amount, false);
          battleLootRef.current[res] = (battleLootRef.current[res] || 0) + amount;
          lootItems.push(`${amount} ${res}`);
        }
      });

      // Item drop (15% chance for all enemies, 100% for bosses)
      const isBoss = enemy.name === 'Warden' || enemy.name === 'Ender Dragon';
      if (isBoss || Math.random() < 0.15) {
        let tier: 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'netherite' = 'wood';
        const tierRoll = Math.random();
        
        if (isBoss) {
          tier = 'netherite';
        } else if (level >= 25) {
          if (tierRoll < 0.3) tier = 'diamond';
          else if (tierRoll < 0.6) tier = 'gold';
          else tier = 'iron';
        } else if (level >= 15) {
          if (tierRoll < 0.2) tier = 'diamond';
          else if (tierRoll < 0.5) tier = 'gold';
          else tier = 'iron';
        } else if (level >= 8) {
          if (tierRoll < 0.3) tier = 'gold';
          else if (tierRoll < 0.7) tier = 'iron';
          else tier = 'stone';
        } else {
          if (tierRoll < 0.4) tier = 'iron';
          else if (tierRoll < 0.7) tier = 'stone';
          else tier = 'wood';
        }
        dropItem(tier, 1);
      }

      // Boss Specific Extra Loot
      if (enemy.name === 'Ravager') {
        if (roll < 0.3) {
          collectResource('elytra', 1, false, 800);
          battleLootRef.current['elytra'] = (battleLootRef.current['elytra'] || 0) + 1;
          lootItems.push('an elytra');
        }
      } else if (enemy.name === 'Warden') {
        collectResource('diamond', 2, false, 0);
        battleLootRef.current['diamond'] = (battleLootRef.current['diamond'] || 0) + 2;
        lootItems.push('2 extra diamonds');
        if (roll < 0.4) {
          collectResource('elytra', 1, false, 800);
          battleLootRef.current['elytra'] = (battleLootRef.current['elytra'] || 0) + 1;
          lootItems.push('an elytra');
        }
      } else if (enemy.name === 'Ender Dragon') {
        collectResource('diamond', 5, false, 0);
        battleLootRef.current['diamond'] = (battleLootRef.current['diamond'] || 0) + 5;
        collectResource('emerald', 5, false, 400);
        battleLootRef.current['emerald'] = (battleLootRef.current['emerald'] || 0) + 5;
        collectResource('elytra', 2, false, 800);
        battleLootRef.current['elytra'] = (battleLootRef.current['elytra'] || 0) + 2;
        lootItems.push('5 extra diamonds', '5 extra emeralds', '2 elytra');
      }
      
      const lootMsg = lootItems.length > 0 ? `gained ${lootItems.join(', ')}` : 'gained nothing';
      const finalLootMsg = `${enemy.name} Defeated - ${lootMsg}`;
      setBattleLog(prev => [finalLootMsg, ...prev]);
      
      setTimeout(() => {
        const lootEntries = Object.entries(battleLootRef.current);
        let aggregatedLootMsg = 'Gained Nothing';
        if (lootEntries.length > 0) {
          aggregatedLootMsg = 'Gained ' + lootEntries.map(([res, amt]) => `+${amt} ${res}`).join(', ');
        }
        addMessage(`${enemy.name} Defeated - ${aggregatedLootMsg}`);

        if (enemy.name === 'Ender Dragon') {
          setIsWinModalOpen(true);
        } else {
          if (isJackpotActive) {
            const newDefeated = [...defeatedJackpotIndices, selectedReelIndex!];
            setDefeatedJackpotIndices(newDefeated);
            if (newDefeated.length === 3) {
              setIsJackpotActive(false);
              setRoundCompleted(true);
              setGameState('main');
              setEnemy(null);
              setShowSlash(false);
              
              // Raid Victory Reward
              if (Math.random() < 0.5) {
                collectResource('elytra', 1, true, 500);
                battleLootRef.current['elytra'] = (battleLootRef.current['elytra'] || 0) + 1;
                addMessage("RAID DEFEATED! You gained 1 Elytra!");
              } else {
                const healAmount = Math.floor(maxHp * 0.2);
                setHp(prev => Math.min(maxHp, prev + healAmount));
                addMessage(`RAID DEFEATED! Healed for ${healAmount} HP (20%)!`);
              }
              
              // Guaranteed Item Drop for Raid
              let raidTier: 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'netherite' = 'iron';
              const rTierRoll = Math.random();
              if (level >= 30) {
                if (rTierRoll < 0.5) raidTier = 'diamond';
                else raidTier = 'gold';
              } else if (level >= 15) {
                if (rTierRoll < 0.3) raidTier = 'diamond';
                else if (rTierRoll < 0.7) raidTier = 'gold';
                else raidTier = 'iron';
              } else {
                if (rTierRoll < 0.4) raidTier = 'gold';
                else raidTier = 'iron';
              }
              
              const raidPossibleItems = [...WEAPONS.slice(1), ...ARMOR].filter(i => i.tier === raidTier);
              if (raidPossibleItems.length > 0) {
                const raidItem = raidPossibleItems[Math.floor(Math.random() * raidPossibleItems.length)];
                setInventory(prev => ({ ...prev, [raidItem.id]: (prev[raidItem.id] || 0) + 1 }));
                triggerItemCollection(raidItem.id);
                addMessage(`RAID BONUS: You found ${raidItem.name}!`);
              }
              
              // Fireworks & Explosion Effect
              setShowFireworks(true);
              playSound(SOUNDS.explosion, 0.5);
              playSound(SOUNDS.firework, 0.5);
              setTimeout(() => playSound(SOUNDS.firework, 0.5), 500);
              setTimeout(() => playSound(SOUNDS.firework, 0.5), 1000);
              setTimeout(() => setShowFireworks(false), 4000);
            } else {
              setGameState('main');
              setEnemy(null);
              setShowSlash(false);
              setSelectedReelIndex(null);
            }
          } else {
            setGameState('main');
            setEnemy(null);
            setShowSlash(false);
            setRoundCompleted(true);
          }
        }
      }, 2000);
    }
  };

  const enemyAttack = () => {
    if (!enemy) return;
    
    const defense = getTotalDefense();
    let currentMissChance = 0;
    
    if (enemy.name === 'Warden' || enemy.name === 'Ender Dragon') {
      // Bosses: 20% base + 1% per 4 defense (cap 50%)
      currentMissChance = Math.min(0.5, 0.2 + (defense / 4) * 0.01);
    } else {
      // Non-bosses: 10% base + player defense (1% per defense, cap 75%)
      currentMissChance = Math.min(0.75, 0.1 + (defense * 0.01));
    }
    
    // Check for miss
    if (Math.random() < currentMissChance) {
      playSound(SOUNDS.miss);
      setBattleLog(prev => [`${enemy.name} missed their attack!`, ...prev]);
      
      if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
      setShowMissed(false); // Brief reset to trigger animation
      setTimeout(() => {
        setShowMissed(true);
        missTimeoutRef.current = setTimeout(() => setShowMissed(false), 800);
      }, 50);
      return;
    }

    if (enemy.name === 'Creeper') {
      playSound(SOUNDS.creeper);
      setTimeout(() => playSound(SOUNDS.break), 200); // Explosion sound
      
      const rawDamage = enemy.hp; // Equivalent of its own HP
      const damage = Math.max(1, Math.ceil((rawDamage * rawDamage) / (rawDamage + defense)));
      const newHp = Math.max(0, hp - damage);
      setHp(newHp);
      setBattleLog(prev => [`Creeper exploded for ${damage} damage!`, ...prev]);
      addMessage(`Creeper exploded for ${damage} damage!`);
      
      setShowDamageFlash(true);
      setTimeout(() => setShowDamageFlash(false), 200);
      
      if (newHp <= 0) {
        triggerGameOver(`Creeper exploded for ${damage} damage.`);
      } else {
        triggerHpHighlight();
        // Creeper is defeated, but no loot
        setGameState('main');
        setEnemy(null);
        setShowSlash(false);
        setRoundCompleted(true);
        setShowSmokeEffect(true);
        setTimeout(() => setShowSmokeEffect(false), 3000);
      }
      return;
    }

    // Play enemy-specific sound
    if (enemy.name === 'Zombie') playSound(SOUNDS.zombie);
    else if (enemy.name === 'Spider') playSound(SOUNDS.spiderAttack);
    else if (enemy.name === 'Creeper') playSound(SOUNDS.creeper);
    else if (enemy.name === 'Pillager') playSound(SOUNDS.pillager);
    else if (enemy.name === 'Ravager') playSound(SOUNDS.ravager);
    else if (enemy.name === 'Warden') playSound(SOUNDS.warden);
    else if (enemy.name === 'Ender Dragon') playSound(SOUNDS.dragon);
    else playSound(SOUNDS.playerHit);

    setShowDamageFlash(true);
    setTimeout(() => setShowDamageFlash(false), 200);
    
    const rawDamage = Math.floor(Math.random() * (enemy.maxAtk - enemy.minAtk + 1)) + enemy.minAtk;
    let damage = Math.max(1, Math.ceil((rawDamage * rawDamage) / (rawDamage + defense)));
    
    const newHp = Math.max(0, hp - damage);
    setHp(newHp);
    setBattleLog(prev => [`${enemy.name} hits you for ${damage} damage!`, ...prev]);
    
    if (newHp <= 0) {
      triggerGameOver(`${enemy.name} hit you for ${damage} damage.`);
    } else {
      triggerHpHighlight();
    }
  };

  const usePotion = () => {
    if (potions > 0 && hp < maxHp) {
      playSound(SOUNDS.drink);
      setHp(maxHp);
      setPotions(prev => prev - 1);
      triggerHpHighlight();
      setBattleLog(prev => [`Used potion! Healed to full HP.`, ...prev]);
    }
  };

  // --- Item Logic ---
  const receiveRandomItem = () => {
    const possibleItems = [...WEAPONS.slice(1), ...ARMOR].filter(i => i.tier !== 'netherite');
    
    const roll = Math.random();
    let selectedTier = 'wood';
    if (roll < 0.05) selectedTier = 'diamond';
    else if (roll < 0.15) selectedTier = 'gold';
    else if (roll < 0.55) selectedTier = 'iron';
    else selectedTier = 'wood';

    let tierItems = possibleItems.filter(i => i.tier === selectedTier);
    if (tierItems.length === 0) tierItems = possibleItems;
    
    const item = tierItems[Math.floor(Math.random() * tierItems.length)];
    
    setInventory(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
    triggerItemCollection(item.id);
    addMessage(`Found ${item.name}! Added to inventory.`);
  };

  // --- Shop & Crafting ---
  const buyItem = (item: Item) => {
    if (item.emeraldCost && resources.emerald >= item.emeraldCost) {
      if (item.type === 'weapon' || item.type === 'armor') {
        setInventory(prev => ({
          ...prev,
          [item.id]: (prev[item.id] || 0) + 1
        }));
        triggerItemCollection(item.id);
      } else if (item.type === 'potion') {
        addPotion(1);
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
      if (item.type === 'weapon' || item.type === 'armor') {
        setInventory(prev => ({
          ...prev,
          [item.id]: (prev[item.id] || 0) + 1
        }));
        triggerItemCollection(item.id);
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

  const skipBattle = () => {
    if (resources.elytra > 0 && gameState === 'battle' && enemy) {
      setResources(prev => ({ ...prev, elytra: prev.elytra - 1 }));
      addMessage('Used Elytra to escape the battle!');
      playSound(SOUNDS.win, 0.28);
      setGameState('main');
      setEnemy(null);
      setShowSlash(false);
      setRoundCompleted(true);
    }
  };

  const closeMenu = () => {
    if (pendingBoss) {
      setGameState('boss_warning');
    } else {
      setGameState('main');
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
    let flashHealthBar = false;
    if (gameState === 'battle' && enemy) {
      const rawDamage = enemy.maxAtk;
      const defense = getTotalDefense();
      const potentialDamage = defense >= rawDamage * 2 ? 0 : Math.max(1, rawDamage - defense);
      flashHealthBar = hp <= maxHp / 2 || potentialDamage >= hp;
    }

    if (gameState === 'battle') {
      return (
        <div className="bg-stone-900 border-b-4 border-black text-white font-sans p-2 flex items-center justify-between gap-3 relative z-[60]">
          <div className={`flex items-center gap-2 bg-black px-3 py-1 rounded-xl border-2 border-stone-700 flex-1 shadow-[0_4px_0_rgba(0,0,0,0.5)] ${flashHealthBar ? 'animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''}`}>
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
      <div className="bg-stone-900 border-b-4 border-black text-white font-sans p-2 sm:p-4 relative z-[60]">
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
          <div className="px-3 py-2 bg-emerald-950 rounded-2xl border-2 border-emerald-700 text-lg text-emerald-400 font-black uppercase tracking-widest text-center font-mono shadow-[0_4px_0_rgba(0,0,0,0.5)] min-w-[80px]">
            LVL {level}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-stone-800 hover:bg-stone-700 border-b-4 border-stone-950 rounded-xl active:translate-y-0.5 transition-all shadow-lg">
              {isMuted ? <VolumeX size={24} className="text-red-400" /> : <Volume2 size={24} className="text-emerald-400" />}
            </button>
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
          <button onClick={() => setGameState('glossary')} className="p-2 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex flex-col items-center justify-center shadow-md gap-1">
            <Info size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Glossary</span>
          </button>
          <button onClick={() => setGameState('inventory')} className="p-2 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex flex-col items-center justify-center shadow-md gap-1">
            <User size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Inventory</span>
          </button>
          <button 
            onClick={() => setGameState('crafting')} 
            className={`p-2 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex flex-col items-center justify-center shadow-md gap-1 ${canCraftAnything ? 'animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.6)] border-amber-500/50' : ''}`}
          >
            <Hammer size={24} className={canCraftAnything ? "text-amber-400" : ""} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${canCraftAnything ? "text-amber-400" : "text-stone-400"}`}>Crafting</span>
          </button>
          <button 
            onClick={() => setGameState('shop')} 
            className={`p-2 bg-black hover:bg-stone-800 border-b-4 border-stone-950 rounded-2xl active:translate-y-0.5 transition-all flex-1 flex flex-col items-center justify-center shadow-md gap-1 ${canAffordShopItem ? 'animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)] border-emerald-500/50' : ''}`}
          >
            <ShoppingBag size={24} className={canAffordShopItem ? "text-emerald-400" : ""} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${canAffordShopItem ? "text-emerald-400" : "text-stone-400"}`}>Shop</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center justify-center gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-2xl border-2 border-stone-700/50 shadow-inner">
              <Sword className="text-red-400 drop-shadow-sm" size={20} />
              <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{getTotalDamage()} Dmg</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-2xl border-2 border-stone-700/50 shadow-inner">
              <Shield className="text-blue-300 drop-shadow-sm" size={20} />
              <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{getTotalDefense()} Def</span>
            </div>
            <button 
              onClick={usePotion} 
              className={`flex items-center justify-center gap-2 bg-black/60 hover:bg-emerald-900/40 backdrop-blur-sm p-3 rounded-2xl border-2 border-emerald-700/50 shadow-inner transition-colors active:scale-95 ${(hp <= maxHp / 2 && potions > 0) || potionFlash ? 'animate-pulse shadow-[0_0_15px_rgba(236,72,153,0.8)] border-pink-500/50' : ''}`}
            >
              <Heart className="text-pink-400 drop-shadow-sm" size={20} />
              <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{potions} Heal</span>
            </button>
          </div>

          {/* Resources Row */}
          <div className="grid grid-cols-5 gap-1">
            {[
              { type: 'wood', icon: 'https://minecraft.wiki/images/Wood_Journal_Icon_MCL.png?9289b', value: resources.wood },
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
        </div>
      </div>
    );
  };

  const renderActionLog = () => (
    <div className="w-full mt-0">
      <div className="bg-black/40 backdrop-blur-md border-2 border-stone-800/50 rounded-xl p-2 h-20 overflow-y-auto space-y-1 shadow-inner scrollbar-hide pointer-events-auto">
        <AnimatePresence initial={false}>
          {actionLog.slice(0, 2).map((log, i) => (
            <motion.div
              key={`${log}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1 - i * 0.3, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-lg font-black font-mono text-stone-200 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
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

  const renderInventory = () => {
    const inventoryItems = Object.entries(inventory).map(([id, count]) => {
      const item = [...WEAPONS, ...ARMOR, ...SHOP_ITEMS].find(i => i.id === id);
      return { item, count: count as number };
    }).filter(entry => entry.item && entry.count > 0);

    return (
      <div className="flex-1 flex flex-col p-4 bg-stone-900 font-sans min-h-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl text-white border-l-4 border-blue-500 pl-3 font-mono font-black uppercase tracking-tighter">Inventory</h2>
          <button onClick={closeMenu} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1">
          {/* Weapons Section */}
          <div>
            <h3 className="text-red-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-red-900/30 pb-1">Weapons Collection</h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {inventoryItems
                .filter(e => e.item?.type === 'weapon')
                .map(({ item, count }) => (
                <div key={item!.id} className="flex flex-col items-center gap-1 group">
                  <div className={`w-16 h-16 bg-black border-2 border-stone-800 rounded-2xl flex items-center justify-center text-3xl shadow-xl relative overflow-hidden transition-colors hover:border-red-500/50`}>
                    <div className={`flex items-center justify-center w-full h-full ${getTierColor(item!.tier)}`}>
                      {item!.icon ? (
                        item!.icon.startsWith('http') || item!.icon.startsWith('input_file_') ? (
                          <img 
                            src={item!.icon} 
                            alt={item!.name} 
                            className={`w-10 h-10 ${item!.id === 'fist' ? 'object-cover scale-[1.8]' : 'object-contain'}`} 
                            referrerPolicy="no-referrer" 
                            style={item!.tier === 'netherite' ? { filter: 'brightness(0.15) contrast(1.5) grayscale(1)' } : undefined}
                          />
                        ) : (
                          <span className="text-3xl drop-shadow-md">{item!.icon}</span>
                        )
                      ) : <Sword size={24} />}
                    </div>
                    <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg z-10">
                      x{count}
                    </div>
                  </div>
                  <span className="text-[8px] text-stone-500 uppercase font-black tracking-widest text-center leading-tight">{item!.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Armor Section */}
          <div>
            <h3 className="text-blue-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-blue-900/30 pb-1">Armor Collection</h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {inventoryItems.filter(e => e.item?.type === 'armor').map(({ item, count }) => (
                <div key={item!.id} className="flex flex-col items-center gap-1 group">
                  <div className={`w-16 h-16 bg-black border-2 border-stone-800 rounded-2xl flex items-center justify-center text-3xl shadow-xl relative overflow-hidden transition-colors hover:border-blue-500/50`}>
                    <div className={`flex items-center justify-center w-full h-full ${getTierColor(item!.tier)}`}>
                      {item!.icon ? (
                        item!.icon.startsWith('http') || item!.icon.startsWith('input_file_') ? (
                          <img 
                            src={item!.icon} 
                            alt={item!.name} 
                            className="w-10 h-10 object-contain" 
                            referrerPolicy="no-referrer" 
                            style={item!.tier === 'netherite' ? { filter: 'brightness(0.15) contrast(1.5) grayscale(1)' } : undefined}
                          />
                        ) : (
                          <span className="text-3xl drop-shadow-md">{item!.icon}</span>
                        )
                      ) : <Shield size={24} />}
                    </div>
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg z-10">
                      x{count}
                    </div>
                  </div>
                  <span className="text-[8px] text-stone-500 uppercase font-black tracking-widest text-center leading-tight">{item!.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGlossary = () => (
    <div className="flex-1 flex flex-col p-4 bg-stone-900 font-sans min-h-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl text-white border-l-4 border-emerald-500 pl-3 font-mono font-black">GLOSSARY</h2>
        <button onClick={closeMenu} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-8 pr-1">
        {/* Mobs */}
        <div>
          <h3 className="text-red-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-red-900/30 pb-1">Hostile Mobs</h3>
          <div className="grid grid-cols-1 gap-3">
            {SLOT_ITEMS.filter(i => i.type === 'bad').map(mob => {
              const stats = getScaledEnemyStats(mob.name, level);
              return (
                <div key={mob.id} className="bg-black p-3 border-b-4 border-stone-950 rounded-2xl border-2 border-stone-800/50 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-lg border-2 border-stone-700 bg-stone-900 flex items-center justify-center overflow-hidden shrink-0">
                    {mob.icon.startsWith('http') || mob.icon.startsWith('input_file_') ? (
                      <img src={mob.icon} alt={mob.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    ) : (
                      <span className="text-2xl">{mob.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="text-white font-bold truncate">{mob.name}</div>
                      <div className="flex gap-2 shrink-0 ml-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-red-400">
                          <Heart size={12} /> {stats.hp}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                          <Sword size={12} /> {stats.minAtk}-{stats.maxAtk}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
                          <Shield size={12} /> 0
                        </div>
                      </div>
                    </div>
                    <div className="text-stone-400 text-xs leading-tight font-medium mt-1">{mob.description}</div>
                  </div>
                </div>
              );
            })}
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

        {/* High Scores */}
        <div className="pt-6 border-t border-stone-800">
          <h3 className="text-emerald-400 text-xs mb-4 uppercase tracking-widest font-bold border-b border-emerald-900/30 pb-1">Top 3 Hero Runs</h3>
          <div className="space-y-2">
            {highScores.length > 0 ? highScores.map((score, index) => (
              <div key={index} className="bg-black p-3 border-b-4 border-stone-950 rounded-2xl border-2 border-stone-800/50 flex justify-between items-center">
                <span className="text-stone-300 font-bold">{score.name}</span>
                <span className="text-emerald-400 font-mono">Level {score.level}</span>
              </div>
            )) : (
              <div className="text-stone-500 italic text-sm text-center py-4">No hero runs yet.</div>
            )}
          </div>
          {highScores.length > 0 && (
            <button
              onClick={() => {
                setConfirmModalConfig({
                  title: 'Reset High Scores',
                  message: 'Are you sure you want to clear all high scores? This action cannot be undone.',
                  onConfirm: () => {
                    setHighScores([]);
                    localStorage.removeItem('spincraft_highscores');
                    localStorage.removeItem('minespin_highscores');
                    setIsConfirmModalOpen(false);
                  }
                });
                setIsConfirmModalOpen(true);
              }}
              className="mt-4 w-full py-3 bg-red-900/50 hover:bg-red-800 border-2 border-red-700 rounded-xl text-red-200 font-bold transition-colors"
            >
              Reset High Scores
            </button>
          )}
        </div>

        {/* PWA / Cache Section */}
        <div className="pt-6 border-t border-stone-800">
          <h3 className="text-stone-500 text-[10px] mb-4 uppercase tracking-widest font-bold text-center">Troubleshooting</h3>
          <button 
            onClick={async () => {
              if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                  await registration.unregister();
                }
              }
              const cacheNames = await caches.keys();
              for (const name of cacheNames) {
                await caches.delete(name);
              }
              window.location.reload();
            }}
            className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black rounded-2xl border-b-4 border-stone-950 flex items-center justify-center gap-3 transition-all active:translate-y-1 active:border-b-0 shadow-lg"
          >
            <RefreshCw size={20} />
            FIX BROKEN IMAGES (CLEAR CACHE)
          </button>
          <p className="text-[10px] text-stone-600 mt-3 text-center italic leading-relaxed">
            Use this if images fail to load or the app feels "stuck".<br/>
            This will force the browser to fetch the latest game data.
          </p>
        </div>
      </div>
    </div>
  );

  const enemyRef = useRef(enemy);
  const hpRef = useRef(hp);
  const enemyAttackRef = useRef(enemyAttack);
  const getEnemyAttackSpeedRef = useRef(getEnemyAttackSpeed);

  useEffect(() => {
    enemyRef.current = enemy;
    hpRef.current = hp;
    enemyAttackRef.current = enemyAttack;
    getEnemyAttackSpeedRef.current = getEnemyAttackSpeed;
  }, [enemy, hp, enemyAttack, getEnemyAttackSpeed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'battle') {
      interval = setInterval(() => {
        const currentEnemy = enemyRef.current;
        const currentHp = hpRef.current;
        
        if (currentEnemy && currentEnemy.hp > 0 && currentHp > 0) {
          setPlayerCooldown(prev => Math.max(0, prev - 100));
          setEnemyCooldown(prev => {
            if (prev <= 100) {
              enemyAttackRef.current();
              return getEnemyAttackSpeedRef.current(currentEnemy.name);
            }
            return prev - 100;
          });
        }
      }, 100);
    } else {
      setPlayerCooldown(0);
      setEnemyCooldown(0);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // --- Screens ---
  if (gameState === 'start') {
    return (
      <div className="h-full bg-stone-900 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
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
              SPIN CRAFT
            </h1>
            <div className="space-y-6">
              <p className="text-stone-400 max-w-xs mx-auto text-lg leading-relaxed font-bold">
                a new adventure awaits... <br/>
                <span className="text-emerald-500 font-bold">Spin, Craft, Survive</span>
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
    const inventoryItems = Object.entries(inventory).map(([id, count]) => {
      const item = [...WEAPONS, ...ARMOR, ...SHOP_ITEMS].find(i => i.id === id);
      return { item, count: count as number };
    }).filter(entry => entry.item && entry.count > 0);

    return (
      <div className="h-full bg-stone-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-y-auto">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-6 w-full max-w-md my-auto py-8"
        >
          <h1 className="text-6xl font-black text-red-600 drop-shadow-[0_4px_0_rgba(0,0,0,1)] font-mono">
            YOU DIED
          </h1>
          
          {deathMessage && (
            <div className="text-stone-400 text-lg italic">
              {deathMessage}
            </div>
          )}
          
          <div className="bg-stone-900 border-2 border-stone-800 rounded-2xl p-4 text-left space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-stone-400 border-b border-stone-800 pb-2">Final Stats</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black p-3 rounded-xl border border-stone-800">
                <div className="text-stone-500 text-xs font-bold uppercase">Level</div>
                <div className="text-2xl font-black text-emerald-400">{level}</div>
              </div>
              <div className="bg-black p-3 rounded-xl border border-stone-800">
                <div className="text-stone-500 text-xs font-bold uppercase">Max HP</div>
                <div className="text-2xl font-black text-red-400">{maxHp}</div>
              </div>
              <div className="bg-black p-3 rounded-xl border border-stone-800">
                <div className="text-stone-500 text-xs font-bold uppercase">Damage</div>
                <div className="text-2xl font-black text-amber-400">{getTotalDamage()}</div>
              </div>
              <div className="bg-black p-3 rounded-xl border border-stone-800">
                <div className="text-stone-500 text-xs font-bold uppercase">Defense</div>
                <div className="text-2xl font-black text-blue-400">{getTotalDefense()}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-stone-500 text-xs font-bold uppercase">Resources</div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(resources) as [string, number][]).map(([res, amount]) => {
                  if (amount <= 0) return null;
                  const resourceIcons: Record<string, string> = {
                    wood: 'https://minecraft.wiki/images/Wood_Journal_Icon_MCL.png?9289b',
                    iron: 'https://minecraft.wiki/images/Iron_Ingot_JE3_BE2.png',
                    gold: 'https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png',
                    diamond: 'https://minecraft.wiki/images/Diamond_JE3_BE3.png',
                    emerald: 'https://minecraft.wiki/images/Emerald_JE3_BE3.png',
                    elytra: 'https://minecraft.wiki/images/Elytra_JE2_BE2.png'
                  };
                  return (
                    <div key={res} className="bg-black px-2 py-1 rounded-lg border border-stone-800 text-sm flex items-center gap-1">
                      {resourceIcons[res] ? (
                        <img src={resourceIcons[res]} className="w-4 h-4 object-contain" alt={res} referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-stone-400 capitalize">{res}:</span>
                      )}
                      <span className="font-bold text-white">{amount}</span>
                    </div>
                  );
                })}
                {potions > 0 && (
                  <div className="bg-black px-2 py-1 rounded-lg border border-stone-800 text-sm flex items-center gap-1">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span className="font-bold text-pink-400">{potions}</span>
                  </div>
                )}
                {Object.values(resources).every(v => v === 0) && potions === 0 && (
                  <div className="text-stone-600 text-sm italic">None</div>
                )}
              </div>
            </div>

            {inventoryItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-stone-500 text-xs font-bold uppercase">Equipment</div>
                <div className="flex flex-wrap gap-2">
                  {inventoryItems.map(({ item, count }) => (
                    <div key={item!.id} className="bg-black px-2 py-1 rounded-lg border border-stone-800 text-sm flex items-center gap-1">
                      <span className={`${getTierColor(item!.tier)} font-bold`}>{item!.name}</span>
                      {count > 1 && <span className="text-stone-500 text-xs">x{count}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
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
              <h2 className="text-xl text-white font-bold tracking-tighter uppercase">HERO NAME</h2>
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
              
              <div className="pt-4 border-t border-stone-800">
                <button 
                  onClick={() => {
                    setConfirmModalConfig({
                      title: 'RESET RUN?',
                      message: 'Are you sure you want to start from the beginning? All current progress will be lost.',
                      onConfirm: () => {
                        resetGame();
                        setIsNameModalOpen(false);
                      }
                    });
                    setIsConfirmModalOpen(true);
                  }}
                  className="w-full py-3 bg-stone-800 hover:bg-red-900/40 border-b-4 border-stone-950 rounded-xl text-stone-400 hover:text-red-400 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  RESET CURRENT RUN
                </button>
              </div>
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
                You've reached <span className="text-emerald-400 font-bold italic">Level {level}</span> and conquered SpinCraft.
              </p>
              <p className="text-stone-500 text-sm italic">
                The world is yours. You have achieved ultimate victory!
              </p>
            </div>

            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => {
                  setIsWinModalOpen(false);
                  setGameState('main');
                  setEnemy(null);
                  setShowSlash(false);
                  setPendingBoss(null);
                  setRoundCompleted(true);
                }}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 border-b-6 border-blue-800 rounded-2xl text-white font-black text-xl transition-all active:translate-y-1 active:border-b-0 shadow-xl uppercase tracking-widest"
              >
                Continue Adventure
              </button>
              <button 
                onClick={() => {
                  setIsWinModalOpen(false);
                  resetGame();
                }}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 border-b-6 border-emerald-800 rounded-2xl text-white font-black text-xl transition-all active:translate-y-1 active:border-b-0 shadow-xl uppercase tracking-widest"
              >
                Restart Game
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderRainEffect = () => {
    if (!rainEffect) return null;
    
    const icons: Record<string, string> = {
      iron: 'https://minecraft.wiki/images/Iron_Ingot_JE3_BE2.png',
      gold: 'https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png',
      diamond: 'https://minecraft.wiki/images/Diamond_JE3_BE3.png',
      emerald: 'https://minecraft.wiki/images/Emerald_JE3_BE3.png',
      wood: 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/0/0a/Oak_Wood_%28UD%29_JE2.png/revision/latest?cb=20190403033224',
      potion: '🧪'
    };

    return (
      <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: Math.random() * 360 }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: Math.random() * 720,
              x: (Math.random() - 0.5) * 200 + (Math.random() * window.innerWidth)
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
            className="absolute text-4xl"
          >
            {icons[rainEffect].startsWith('http') ? (
              <img src={icons[rainEffect]} className="w-12 h-12 object-contain" alt="rain" referrerPolicy="no-referrer" />
            ) : (
              icons[rainEffect]
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full w-full max-w-2xl mx-auto bg-stone-900 flex flex-col shadow-2xl overflow-hidden select-none relative">
      {/* Damage Flash Overlay */}
      <AnimatePresence>
        {damageFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 z-[250] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Rain Effect */}
      {renderRainEffect()}

      {/* Cannon Mode Golden Bezel */}
      <AnimatePresence>
        {isCannonMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none z-[200] border-[8px] border-yellow-400/80 rounded-lg shadow-[inset_0_0_20px_rgba(250,204,21,0.8),0_0_20px_rgba(250,204,21,0.8)]"
            style={{
              animation: 'shimmer 2s infinite alternate'
            }}
          />
        )}
      </AnimatePresence>
      <style>{`
        @keyframes shimmer {
          0% { border-color: rgba(250, 204, 21, 0.5); box-shadow: inset 0 0 10px rgba(250, 204, 21, 0.5), 0 0 10px rgba(250, 204, 21, 0.5); }
          100% { border-color: rgba(250, 204, 21, 1); box-shadow: inset 0 0 30px rgba(250, 204, 21, 1), 0 0 30px rgba(250, 204, 21, 1); }
        }
      `}</style>
      
      {renderHeader()}
      {renderConfirmModal()}
      {renderNameModal()}
      {renderWinModal()}
      
      <main className="flex-1 relative flex flex-col overflow-hidden min-h-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')]">
        {renderFloatingNotifications()}
        
        {/* Main Game Screen */}
        {gameState === 'main' && (
          <div className="h-full flex flex-col p-4 space-y-4 bg-stone-900/50 justify-center relative">
            {/* Smoke Effect Overlay */}
            <AnimatePresence>
              {showSmokeEffect && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
                >
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 0, y: 0, scale: 0.5, opacity: 0.8 }}
                      animate={{ 
                        x: (Math.random() - 0.5) * 500, 
                        y: (Math.random() - 0.5) * 500, 
                        scale: Math.random() * 3 + 2, 
                        opacity: 0 
                      }}
                      transition={{ duration: 2 + Math.random() * 1.5, ease: "easeOut" }}
                      className="absolute w-16 h-16 bg-stone-500 rounded-full blur-xl"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ambush Overlay */}
            <AnimatePresence>
              {isAmbush && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-red-600/40 pointer-events-none z-10 rounded-3xl"
                />
              )}
            </AnimatePresence>

            {/* MINE THEM ALL! Overlay */}
            <AnimatePresence>
              {showMineThemAll && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: -50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -50 }}
                  className="absolute top-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
                >
                  <div className="bg-amber-500/90 px-8 py-4 rounded-2xl border-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] transform -rotate-2">
                    <h2 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_4px_0_rgba(146,64,14,1)] uppercase font-mono">
                      MINE THEM ALL!
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Message Banner Area - Now in flow between header and reels */}
            <div className="h-12 flex items-center justify-center relative shrink-0">
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div 
                    key="message-banner"
                    initial={{ y: -10, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -10, opacity: 0, scale: 0.95 }}
                    className="w-full flex justify-center z-50"
                  >
                    <div className="bg-black/90 text-white px-6 py-3 rounded-xl border-2 border-emerald-500 text-base font-black font-mono shadow-[0_0_20px_rgba(16,185,129,0.4)] text-center max-w-[95%] leading-tight">
                      {message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Triple Reel Display */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-4">
              <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
                {reels.map((item, idx) => (
                  <motion.div 
                    key={`${idx}-${item.id}-${rollCount}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: selectedReelIndex === null || selectedReelIndex === idx ? 1 : 0.8, 
                      opacity: selectedReelIndex === null || selectedReelIndex === idx ? 1 : 0.4 
                    }}
                    whileHover={!isSpinning && selectedReelIndex === null ? { scale: 1.05 } : {}}
                    whileTap={!isSpinning && selectedReelIndex === null ? { scale: 0.95 } : {}}
                    onClick={() => handleReelClick(idx)}
                    className={`aspect-[2/3] bg-stone-800 rounded-2xl border-4 border-stone-950 flex flex-col items-center justify-center shadow-xl overflow-hidden relative ${
                      !isSpinning && selectedReelIndex === null && !(isJackpotActive && defeatedJackpotIndices.includes(idx)) ? 'cursor-pointer' : 'cursor-default'
                    } ${selectedReelIndex === idx ? 'ring-4 ring-emerald-500 border-emerald-400' : ''} ${
                      !isSpinning && item.type === 'bad' ? 'shadow-[0_0_20px_rgba(220,38,38,0.5)] border-red-900/50' : 
                      !isSpinning && item.type === 'good' && item.id !== 'start' ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)] border-emerald-900/50' : 
                      !isSpinning && item.type === 'pitfall' ? 'shadow-[0_0_20px_rgba(0,0,0,0.8)] border-black' : ''
                    } ${isJackpotActive && defeatedJackpotIndices.includes(idx) ? 'opacity-40 grayscale' : ''}`}
                  >
                    {/* Defeated Overlay */}
                    {isJackpotActive && defeatedJackpotIndices.includes(idx) && (
                      <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
                        <X size={64} className="text-red-600 drop-shadow-lg" />
                      </div>
                    )}

                    {/* Item Icon */}
                    <div className="relative z-10 flex flex-col items-center p-2 w-full h-full justify-center">
                      <motion.div
                        key={`${idx}-${item.id}`}
                        animate={isSpinning && spinningReels[idx] ? {
                          y: [0, -15, 15, 0],
                          filter: ["blur(0px)", "blur(6px)", "blur(0px)"],
                          scale: [1, 0.85, 1.15, 1]
                        } : {
                          y: 0,
                          filter: "blur(0px)",
                          scale: 1
                        }}
                        transition={isSpinning && spinningReels[idx] ? {
                          duration: 0.08,
                          repeat: Infinity,
                          ease: "linear"
                        } : {}}
                        className="flex flex-col items-center flex-1 justify-center"
                      >
                        {item.icon.startsWith('http') || item.icon.startsWith('input_file_') ? (
                          <img 
                            src={item.icon} 
                            alt={item.name} 
                            className={`w-24 h-24 md:w-36 md:h-36 lg:w-44 lg:h-44 ${item.type === 'block' ? 'object-cover' : 'object-contain'} drop-shadow-lg ${isSpinning && spinningReels[idx] ? 'opacity-40' : 'opacity-100'}`}
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
                          <span className="text-7xl md:text-8xl lg:text-9xl drop-shadow-lg">{item.icon}</span>
                        )}
                        
                        {/* Fallback Emoji */}
                        <div 
                          id={`fallback-${idx}`} 
                          style={{ display: 'none' }}
                          className="text-7xl md:text-8xl lg:text-9xl drop-shadow-lg"
                        >
                          {item.type === 'bad' ? '👾' : item.type === 'good' ? '👤' : '🧱'}
                        </div>
                      </motion.div>
                      
                      <div className="mt-auto w-full bg-black/80 px-2 py-2 rounded-lg text-white font-black text-xs uppercase tracking-wider border border-white/20 text-center shadow-md">
                        {isSpinning && spinningReels[idx] ? '???' : item.name}
                      </div>
                    </div>

                    {/* Cracks Overlay */}
                    {!isSpinning && (selectedReelIndex === idx || (isJackpotActive && (reels[0].id === 'dirt_block' || reels[0].id === 'grass_block' || reels[0].id === 'snow_block' || reels[0].id === 'sand_block') && reels.every(r => r.id === reels[0].id))) && slotBlockHealth > 0 && item.type === 'block' && slotBlockHealth < (3 + Math.floor(level / 5)) && (
                      <div 
                        className="absolute inset-0 z-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/broken-noise.png')] opacity-80"
                        style={{ 
                          filter: `contrast(${200 - (slotBlockHealth / (3 + Math.floor(level / 5))) * 100}%)`,
                          mixBlendMode: 'multiply'
                        }}
                      />
                    )}

                    {/* Health Bar */}
                    {!isSpinning && (selectedReelIndex === idx || (isJackpotActive && (reels[0].id === 'dirt_block' || reels[0].id === 'grass_block' || reels[0].id === 'snow_block' || reels[0].id === 'sand_block') && reels.every(r => r.id === reels[0].id))) && slotBlockHealth > 0 && (item.type === 'block' || item.type === 'pitfall') && (
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-stone-900 z-30">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-200"
                          style={{ width: `${(slotBlockHealth / (item.type === 'block' ? (item.id.includes('dirt') || item.id.includes('grass') || item.id.includes('sand') || item.id.includes('snow') ? 3 : item.id.includes('iron') ? 3 : item.id.includes('gold') ? 4 : 5) : 3)) * 100}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="w-full max-w-sm space-y-1 mt-auto pb-4">
                <div className="flex gap-2">
                  <button 
                    onClick={
                      roundCompleted
                        ? roll
                        : pendingBattle && selectedReelIndex !== null 
                          ? () => startBattle(reels[selectedReelIndex]) 
                          : selectedReelIndex !== null && slotBlockHealth > 0 && (reels[selectedReelIndex].type === 'block' || reels[selectedReelIndex].type === 'pitfall')
                            ? spinCraftBlock 
                            : roll
                    }
                    disabled={isSpinning || (reels[0].id !== 'start' && selectedReelIndex === null && !roundCompleted)}
                    className={`flex-1 py-4 rounded-2xl text-xl font-black border-b-[6px] transition-all active:translate-y-1 shadow-xl uppercase tracking-wider relative z-20 ${
                      isSpinning || (reels[0].id !== 'start' && selectedReelIndex === null && !roundCompleted)
                      ? 'bg-stone-600 border-stone-800 text-stone-400 opacity-50 cursor-not-allowed' 
                      : pendingBattle ? 'bg-red-600 hover:bg-red-500 border-red-800 text-white' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800 text-white'
                    }`}
                  >
                    {isSpinning 
                      ? 'SPINNING...' 
                      : roundCompleted && reels[0].id !== 'start'
                        ? 'SPIN!'
                        : pendingBattle 
                          ? 'ATTACK!' 
                          : slotBlockHealth > 0 
                            ? 'MINE IT!' 
                            : (reels[0].id !== 'start' && selectedReelIndex === null) 
                              ? 'CHOOSE A PATH' 
                              : 'SPIN!'}
                  </button>

                  {resources.elytra > 0 && !isSpinning && selectedReelIndex === null && (
                    <button 
                      onClick={skipRoll}
                      className="aspect-square p-4 rounded-2xl text-lg font-black bg-purple-600 hover:bg-purple-500 border-b-[6px] border-purple-800 text-white transition-all active:translate-y-1 shadow-lg flex flex-col items-center justify-center relative"
                      title="Skip Roll (1 Elytra)"
                    >
                      <Zap size={24} />
                      <span className="absolute -top-2 -right-2 bg-purple-400 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-purple-800 shadow-md">
                        x{resources.elytra}
                      </span>
                    </button>
                  )}
                </div>

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
        {gameState === 'boss_warning' && pendingBoss && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-900"
          >
            <div className="bg-black border-4 border-red-900 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.3)]">
              <h2 className="text-4xl font-black text-red-500 uppercase tracking-widest animate-pulse">
                WARNING!
              </h2>
              <div className="h-1 w-full bg-red-900/50 rounded-full" />
              <p className="text-stone-300 text-lg">
                Prepare to battle the <span className="text-red-400 font-bold">{pendingBoss === 'warden' ? 'Warden' : 'Ender Dragon'}</span>!
              </p>
              <button 
                onClick={() => {
                  const boss = SLOT_ITEMS.find(i => i.id === pendingBoss);
                  if (boss) {
                    startBattle(boss);
                  }
                }}
                className="w-full py-4 bg-red-700 hover:bg-red-600 border-b-4 border-red-900 rounded-xl text-white font-black text-xl transition-all active:translate-y-1 active:border-b-0"
              >
                FIGHT!
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'battle' && enemy && (() => {
          const rawDamage = enemy.maxAtk;
          const defense = getTotalDefense();
          const potentialDamage = defense >= rawDamage * 2 ? 0 : Math.max(1, rawDamage - defense);
          const isLethal = potentialDamage >= hp;
          const isUnsurvivable = potentialDamage >= maxHp;
          const isHalfHealth = hp <= maxHp / 2;
          
          const flashElytra = isUnsurvivable && resources.elytra > 0;
          const flashPotion = (isHalfHealth && potions > 0) || potionFlash;

          return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: showDamageFlash ? [-10, 10, -10, 10, 0] : 0
            }}
            className="flex-1 flex flex-col p-4 space-y-4 bg-stone-900/90 min-h-0 font-sans relative justify-around"
          >
            {/* Player Stats Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex gap-4">
                <div className="bg-black/80 px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-2">
                  <Sword size={16} className="text-stone-400" />
                  <span className="text-white font-bold">{getTotalDamage()}</span>
                </div>
                <div className="bg-black/80 px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-2">
                  <Shield size={16} className="text-stone-400" />
                  <span className="text-white font-bold">{getTotalDefense()}</span>
                </div>
              </div>
              {resources.elytra > 0 && (
                <button 
                  onClick={skipBattle}
                  className={`bg-purple-600 hover:bg-purple-500 px-4 py-1.5 rounded-xl border-b-4 border-purple-800 text-white font-bold text-sm transition-all active:translate-y-1 active:border-b-0 shadow-lg flex items-center gap-2 ${flashElytra ? 'animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.8)] bg-purple-500' : ''}`}
                >
                  <Zap size={16} />
                  SKIP (1)
                </button>
              )}
            </div>

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

            {/* Raid Alert Overlay */}
            <AnimatePresence>
              {showRaidAlert && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1], scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.5 }}
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-red-900/40"
                >
                  <h1 className="text-8xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,1)] uppercase tracking-widest font-mono">
                    RAID!
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Raid Victory Effect Overlay */}
            <AnimatePresence>
              {showFireworks && <RaidVictoryEffect />}
            </AnimatePresence>
            
            {/* Missed! Overlay */}
            <AnimatePresence>
              {showMissed && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: -50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -50 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
                >
                  <div className="bg-amber-500/90 px-8 py-4 rounded-2xl border-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] transform -rotate-2">
                    <h2 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_4px_0_rgba(146,64,14,1)] uppercase font-mono">
                      MISSED!
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col items-center justify-center space-y-6 pt-10">
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

              <div className="flex items-center justify-center gap-4 w-full flex-1 max-h-[400px] md:max-h-[600px]">
                <motion.button 
                  onClick={usePotion}
                  disabled={potions === 0}
                  initial={false}
                  animate={flashPotion ? {
                    backgroundColor: ["#be185d", "#ffffff", "#be185d"],
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0px 0px 10px rgba(236,72,153,0.5)", 
                      "0px 0px 40px rgba(255,255,255,1)", 
                      "0px 0px 10px rgba(236,72,153,0.5)"
                    ]
                  } : {
                    backgroundColor: potions > 0 ? "#be185d" : "#44403c",
                    scale: 1,
                    boxShadow: "0px 0px 0px rgba(0,0,0,0)"
                  }}
                  transition={flashPotion ? {
                    duration: 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : { duration: 0.3 }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 border-b-8 rounded-2xl font-black text-xs transition-all active:translate-y-2 active:border-b-0 shadow-xl h-full max-h-[300px] md:max-h-[500px] w-24 ${
                    potions === 0 
                      ? 'border-stone-800 text-stone-500' 
                      : !flashPotion 
                        ? 'border-pink-900 text-white hover:bg-pink-600' 
                        : 'border-white text-pink-900'
                  }`}
                >
                  <Heart 
                    size={40} 
                    className={potions > 0 ? "animate-bounce" : ""} 
                    fill={potions > 0 ? (flashPotion ? "#be185d" : "currentColor") : "none"}
                  />
                  <span className="uppercase tracking-widest">Potion</span>
                  <span className="text-2xl">({potions})</span>
                </motion.button>

                <motion.div 
                  onClick={playerAttack}
                  animate={showCritShake ? {
                    x: [-5, 5, -5, 5, 0],
                    y: [-2, 2, -2, 2, 0]
                  } : {}}
                  transition={{ duration: 0.2 }}
                  className={`relative flex-1 h-full max-h-[300px] md:max-h-[500px] bg-black border-4 border-stone-950 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 ${playerCooldown > 0 ? 'opacity-80' : 'hover:border-red-500 hover:shadow-red-900/20'}`}
                >
                  {enemy.icon.startsWith('http') || enemy.icon.startsWith('input_file_') ? (
                    <motion.img 
                      src={enemy.icon} 
                      alt={enemy.name} 
                      animate={showCritStrobe ? {
                        filter: [
                          "brightness(1) contrast(1)",
                          "brightness(5) contrast(2)",
                          "brightness(1) contrast(1)",
                          "brightness(5) contrast(2)",
                          "brightness(1) contrast(1)"
                        ]
                      } : {}}
                      transition={{ duration: 0.4 }}
                      className={`w-full h-full object-cover md:object-contain ${
                        enemyFlash ? 'brightness-[5] contrast-200' : 
                        enemy.name === 'Creeper' && enemyCooldown <= 2000 && Math.floor(enemyCooldown / 100) % 2 === 0
                          ? 'brightness-200 contrast-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                          : ''
                      }`}
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
                        <svg viewBox="0 0 100 100" className={`w-full h-full ${isCritSlash ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]' : 'text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,1)]'}`}>
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

                  {/* Damage Numbers */}
                  <AnimatePresence>
                    {damageNumbers.map(dn => (
                      <motion.div
                        key={dn.id}
                        initial={{ opacity: 1, y: 0, scale: 0.5 }}
                        animate={{ opacity: 0, y: -50, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute font-black text-4xl font-mono drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-30 pointer-events-none ${dn.isCritical ? 'text-yellow-400' : 'text-red-500'}`}
                        style={{ left: `${dn.x}%`, top: `${dn.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        {dn.damage}
                      </motion.div>
                    ))}
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
                </motion.div>
              </div>
            </div>

            <div className="h-24 bg-black/80 rounded-2xl p-3 font-mono text-lg overflow-y-auto space-y-1 border-2 border-stone-800 shadow-inner shrink-0">
              {battleLog.slice(0, 2).map((log, i) => (
                <div key={i} className={i === 0 ? "text-white font-bold flex items-center gap-2" : "text-stone-500 flex items-center gap-2"}>
                  <div className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-stone-700'}`} />
                  {log}
                </div>
              ))}
            </div>
          </motion.div>
          );
        })()}

        {/* Shop Screen */}
        {gameState === 'shop' && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 flex flex-col p-4 bg-stone-900 min-h-0 font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-white font-mono border-l-4 border-emerald-500 pl-3">VILLAGER SHOP</h2>
              <button onClick={closeMenu} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
              {shopItems.map(item => {
                const canAfford = resources.emerald >= (item.emeraldCost || 0);
                const isDisabled = !canAfford;

                return (
                  <div key={item.id} className={`bg-black p-4 rounded-2xl border-2 border-stone-800 flex justify-between items-center shadow-xl ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-stone-900 rounded-xl border border-stone-700 shadow-inner">
                        {item.icon ? (
                          item.icon.startsWith('http') || item.icon.startsWith('input_file_') ? (
                            <img 
                              src={item.icon} 
                              alt={item.name} 
                              className="w-6 h-6 object-contain" 
                              referrerPolicy="no-referrer" 
                              style={item.tier === 'netherite' ? { filter: 'brightness(0.15) contrast(1.5) grayscale(1)' } : undefined}
                            />
                          ) : (
                            <span className="text-xl drop-shadow-md">{item.icon}</span>
                          )
                        ) : item.type === 'weapon' ? <Sword className="text-stone-300" /> : item.type === 'armor' ? <Shield className="text-stone-300" /> : <Heart className="text-pink-400" />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{item.name}</div>
                        <div className="text-stone-400 text-xs font-medium">
                          {`+${item.value} ${item.type === 'potion' ? 'Heal' : item.type === 'weapon' ? 'Damage' : 'Defense'}`}
                          {item.slot && <span className="ml-2 opacity-50 font-bold">({item.slot})</span>}
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
                      <img src="https://minecraft.wiki/images/Emerald_JE3_BE3.png" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" /> <span className="font-mono">{item.emeraldCost}</span>
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
              <button onClick={closeMenu} className="p-2 bg-black text-stone-400 hover:text-white border-b-4 border-stone-950 rounded-xl">
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
              {([...WEAPONS.slice(1), ...ARMOR] as any[])
                .filter(item => item.tier !== 'netherite')
                .sort((a, b) => {
                  const tiers = ['wood', 'iron', 'gold', 'diamond'];
                  const tierDiff = tiers.indexOf(a.tier) - tiers.indexOf(b.tier);
                  if (tierDiff !== 0) return tierDiff;
                  
                  // Within same tier:
                  // Sword first
                  if (a.type === 'weapon' && b.type !== 'weapon') return -1;
                  if (a.type !== 'weapon' && b.type === 'weapon') return 1;
                  
                  // Then armor by cost (highest to lowest)
                  const getCost = (item: any) => {
                    if (!item.cost) return 0;
                    return Object.values(item.cost)[0] as number;
                  };
                  return getCost(b) - getCost(a);
                })
                .map((item: any) => {
                const canCraft = Object.entries(item.cost || {}).every(([res, amount]) => resources[res as ResourceType] >= amount);
                const isDisabled = !canCraft;
                
                return (
                  <div key={item.id} className={`bg-black p-4 rounded-2xl border-2 border-stone-800 flex justify-between items-center shadow-xl ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-stone-900 rounded-xl border border-stone-700 shadow-inner ${getTierColor(item.tier)}`}>
                        {item.icon ? (
                          <img 
                            src={item.icon} 
                            alt={item.name} 
                            className="w-6 h-6 object-contain" 
                            referrerPolicy="no-referrer" 
                            style={item.tier === 'netherite' ? { filter: 'brightness(0.15) contrast(1.5) grayscale(1)' } : undefined}
                          />
                        ) : item.type === 'weapon' ? <Sword size={24} /> : <Shield size={24} />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{item.name}</div>
                        <div className="text-stone-400 text-xs font-medium mb-2">
                          {`+${item.value} ${item.type === 'weapon' ? 'Damage' : 'Defense'} ${item.slot ? `(${item.slot})` : ''}`}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(item.cost || {}).map(([res, amount]) => (
                            <div key={res} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-black border ${resources[res as ResourceType] >= amount ? 'bg-stone-900 border-stone-700 text-white' : 'bg-red-950/30 border-red-900 text-red-400'}`}>
                              <img 
                                src={
                                  res === 'wood' ? 'https://minecraft.wiki/images/Wood_Journal_Icon_MCL.png?9289b' :
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
                        canCraft ? 'bg-amber-600 hover:bg-amber-500 border-amber-800 shadow-lg' : 'bg-stone-800 border-stone-950 opacity-50'
                      }`}
                    >
                      CRAFT
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>

      {/* Item Collection Animation Overlay */}
      <AnimatePresence>
        {collectedItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ x: `${item.x}%`, y: `${item.y}%`, scale: 0, opacity: 0, rotate: 0 }}
            animate={{ 
              y: [`${item.y}%`, `${item.y - 5}%`, '100%'],
              x: [`${item.x}%`, `${item.arcX}%`, `${item.x}%`],
              scale: [0, 1.5, 1, 0], 
              opacity: [0, 1, 1, 0],
              rotate: [0, 720]
            }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
            className="absolute z-[300] pointer-events-none -translate-x-1/2 -translate-y-1/2"
          >
            {item.icon === 'heart-icon' ? (
              <div className="bg-pink-500 p-4 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.6)] border-2 border-white/50">
                <Heart size={48} className="text-white" fill="white" />
              </div>
            ) : item.icon.startsWith('http') || item.icon.startsWith('input_file_') ? (
              <img 
                src={item.icon} 
                className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <span className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{item.icon}</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

