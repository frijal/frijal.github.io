// generate-favicons.js
const sharp = require("sharp");
const fs = require("fs");

// Master SVG
const svgFile = "RssFeed.svg";

// Daftar ukuran PNG yang dibutuhkan
const sizes = [32, 180, 192, 270];

(async () => {
  try {
    for (const size of sizes) {
      const outputFile = `rss-${size}.png`;
      await sharp(svgFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      console.log(`✔ ${outputFile} dibuat`);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
