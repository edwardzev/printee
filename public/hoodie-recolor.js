import fs from "fs";
import axios from "axios";

/**
 * Minimal recolor script – HARD-CODED to process only "dryfit"
 */

const CLOUD_NAME = "dkdpwgsyl";
const EXT = "jpg";

// Output root and dryfit config
const OUTPUT_ROOT = "/Users/edwardzev/Dropbox/Print Market Team Folder/PRODUCT_LIBRARY/Cloudinary_output";
const DRYFIT = {
  key: "dryfit",
  basePublicId: "dryfit_gzkgn5",
  promptTarget: "dryfit",
  outDir: `${OUTPUT_ROOT}/dryfit`,
};

const TSHIRT = {
  key: 'tshirt',
  basePublicId: 'white_tshirt_copy_c4tsbp',
  promptTarget: 'tshirt',
  outDir: `${OUTPUT_ROOT}/tshirt`
};

// Allow overriding re-download behavior
const FORCE = process.argv.includes("--force");
// CLI flags: --garment=tshirt|dryfit, --id=<cloudinary_public_id>, --out=<absolute_output_dir>
const GARMENT_FLAG = (process.argv.find(a=>a.startsWith('--garment='))||'').split('=')[1];
const ID_FLAG = (process.argv.find(a=>a.startsWith('--id='))||'').split('=')[1];
const OUT_FLAG = (process.argv.find(a=>a.startsWith('--out='))||'').split('=')[1];

// Palette
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

// Utils
function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "_");
}

function ensureDir(path) {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
}

function buildUrl({ hex, basePublicId, promptTarget }) {
  const noHash = hex.replace("#", "");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/` +
         `e_gen_recolor:prompt_${encodeURIComponent(promptTarget)};to-color_${noHash},f_${EXT},q_auto/` +
         `${basePublicId}.${EXT}`;
}

async function download(url, outPath) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
  fs.writeFileSync(outPath, res.data);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// MAIN – choose garment
(async () => {
  // default to tshirt (dryfit was already processed)
  let garment = TSHIRT;
  if (GARMENT_FLAG === 'dryfit') garment = DRYFIT;
  if (ID_FLAG) garment.basePublicId = ID_FLAG;
  if (OUT_FLAG) garment.outDir = OUT_FLAG;

  ensureDir(garment.outDir);
  console.log(`\n==> Processing ${garment.key} (base id: ${garment.basePublicId}) → ${garment.outDir}`);
  if (FORCE) console.log("--force enabled: will overwrite existing files");
  let i = 0;

  for (const color of COLORS) {
    i++;
    const hex = PALETTE[color];
    const url = buildUrl({
      hex,
      basePublicId: garment.basePublicId,
      promptTarget: garment.promptTarget
    });

    const fileName = `${slugify(color)}_${garment.key}.${EXT}`;
    const outFile = `${garment.outDir}/${fileName}`;

    try {
      if (fs.existsSync(outFile) && !FORCE) {
        console.log(`[${i}/${COLORS.length}] ↩︎ Skip existing ${fileName}`);
        continue;
      }
      await download(url, outFile);
      console.log(`[${i}/${COLORS.length}] ✅ Saved ${fileName}`);
      await wait(300);
    } catch (err) {
      console.error(
        `[${i}/${COLORS.length}] ❌ ${fileName} —`,
        err?.response?.status || "",
        err?.message || err
      );
    }
  }

  console.log("\nAll done.");
})();