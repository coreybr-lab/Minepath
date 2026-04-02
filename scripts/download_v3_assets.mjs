import fs from 'fs';
import https from 'https';
import path from 'path';

const assets = [
  {
    url: 'https://raw.githubusercontent.com/PrismLauncher/Themes/master/themes/Minecraft/icons/spider.png',
    dest: 'public/assets/images/spider.png'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/textures/block/chest.png',
    dest: 'public/assets/images/chest.png'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/block/stone/hit1.ogg',
    dest: 'public/assets/sounds/hit.ogg'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/block/stone/break1.ogg',
    dest: 'public/assets/sounds/break.ogg'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/entity/villager/no1.ogg',
    dest: 'public/assets/sounds/negative.ogg'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/entity/player/attack/strong1.ogg',
    dest: 'public/assets/sounds/attack.ogg'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/entity/generic/drink.ogg',
    dest: 'public/assets/sounds/drink.ogg'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/entity/player/hurt1.ogg',
    dest: 'public/assets/sounds/player_hit.ogg'
  },
  {
    url: 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/sounds/entity/player/attack/nodamage.ogg',
    dest: 'public/assets/sounds/miss.ogg'
  }
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://minecraft.wiki/'
      }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const asset of assets) {
    console.log(`Downloading ${asset.url}...`);
    try {
      await download(asset.url, asset.dest);
      console.log(`Saved to ${asset.dest}`);
    } catch (err) {
      console.error(`Failed to download ${asset.url}: ${err.message}`);
    }
  }
}

main();
