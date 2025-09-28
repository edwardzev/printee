import fs from "fs";
import axios from "axios";

const CLOUD_NAME = "dkdpwgsyl";
const BASE_PUBLIC_ID = "ziphoodie_cbdb5d"; // your base hoodie (no folder, no #)
const EXT = "jpg";

// Local output folder (your Dropbox path)
const OUT_DIR = "/Users/edwardzev/Dropbox/Print Market Team Folder/PRODUCT_LIBRARY/Cloudinary_output/zippedhood";
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Name -> HEX (no # when passed to Cloudinary URL)
const PALETTE = {
  "White": "#FFFFFF",
  "Black": "#111111",
  "Gray": "#808080",
  "Red": "#EB0D0D",
  "Dark gray": "#1F2937",
  "Royal blue": "#1D4ED8",
  "Navy blue": "#0B2447",
  "Beneton green": "#009739",
  "Bottle green": "#004225",
  "Bordo": "#800020",
  "Purple": "#6A0DAD",
  "Turquas": "#40E0D0",
  "Orange": "#F97316",
  "Yellow": "#FACC15",
  "Lilac": "#C8A2C8",
  "Baby pink": "#FADADD",
  "Light blue": "#ADD8E6",
  "Olive green": "#556B2F",
  "Offwhite": "#F8F8F8",
  "Fuksia": "#FF00A8",
  "Brown": "#8B4513",
  "Banana yellow": "#FFE135",
  "Apple green": "#8DB600",
  "Natural": "#EDE7D1",
  "Phosphor yellow": "#CCFF00",
  "Phosphor green": "#39FF14",
  "Phosphor pink": "#FF1493"
};

const COLORS = Object.keys(PALETTE);

// Turn “Royal blue” → “royal_blue_hoodie.jpg”
function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "_");
}

// Build Cloudinary delivery URL using Generative Recolor
function buildUrl(hex) {
  const noHash = hex.replace("#", "");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/` +
         `e_gen_recolor:prompt_hoodie;to-color_${noHash},f_${EXT},q_auto/` +
         `${BASE_PUBLIC_ID}.${EXT}`;
}

async function download(url, outPath) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
  fs.writeFileSync(outPath, res.data);
  console.log("✅ Saved", outPath);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  for (const color of COLORS) {
    const hex = PALETTE[color];
    const url = buildUrl(hex);
    const outFile = `${OUT_DIR}/${slugify(color)}_zipped_hood.${EXT}`;

    try {
      await download(url, outFile);
      // small pause helps avoid rate limits on rapid AI generations
      await wait(350);
    } catch (err) {
      console.error(`❌ Failed for ${color}:`, err?.response?.status || "", err?.message || err);
    }
  }
  console.log("Done.");
})();