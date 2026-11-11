/* Chilian's official screen-printing price table (LN1), MXN per piece, per print location, before VAT.
   Rows: print size (cm²) → quantity break → number of colors (1, 2-3, 4-5, 6-7, 8-9, 10-11).
   Extras are added per piece and per location, by size and quantity:
     fabric (Fabric Color: it applies by itself on colored garments), antimigrante (barrier base), hdpuff (HD / puff), fleece, glitter, export (export quality).
   The website and the assistant add VAT, the online payment fee and shipping on top (see precios.js → cargos). */
export const SERIGRAFIA = {
  tramos: [100, 250, 500, 1000, 10000, 100000],        // pieces from
  colores: ["1", "2-3", "4-5", "6-7", "8-9", "10-11"],
  tamanos: [100, 300, 600, 1200, 1800],                 // cm²
  // The real shapes of each size (the same ones the OS quoter shows), and what each is usually for
  medidas: ["≈ 10×10 cm", "≈ 21.5×14 cm", "≈ 21.5×28 cm", "≈ 28×43 cm", "≈ 30×60 cm"],
  nombres: [{ es: "Escudo", en: "Badge" }, { es: "Media carta", en: "Half letter" }, { es: "Carta", en: "Letter" }, { es: "Doble carta", en: "Double letter" }, { es: "Extra grande", en: "Extra large" }],
  usos: [{ es: "logo de pecho, manga o nuca", en: "chest, sleeve or neck logo" }, { es: "logo mediano o frente chico", en: "medium logo or small front" }, { es: "frente o espalda estándar", en: "standard front or back" },
    { es: "frente o espalda grandes", en: "large front or back" }, { es: "diseño de casi toda la prenda", en: "design covering most of the garment" }],
  // where it goes, and the size that usually fits there
  lugares: { frente: { es: "Frente", en: "Front", sugerida: 600 }, espalda: { es: "Espalda", en: "Back", sugerida: 600 }, pecho: { es: "Pecho izquierdo", en: "Left chest", sugerida: 100 },
    manga: { es: "Manga", en: "Sleeve", sugerida: 100 }, nuca: { es: "Nuca", en: "Back neck", sugerida: 100 } },
  extrasNombres: {
    fabric: { es: "Prenda de color (Fabric Color)", en: "Colored garment (Fabric Color)" },
    antimigrante: { es: "Antimigrante (base barrera)", en: "Anti-migration (barrier base)" },
    hdpuff: { es: "HD / Puff", en: "HD / Puff" },
    fleece: { es: "Prenda afelpada (fleece)", en: "Fleece garment" },
    glitter: { es: "Glitter", en: "Glitter" },
    export: { es: "Calidad exportación", en: "Export quality" }
  },
  // tabla[size][quantity break] = price per color bucket
  tabla: {
    100: [[9.13, 15.97, 20.53, 25.10, 29.66, 34.22], [7.30, 12.78, 16.43, 20.08, 23.73, 27.38], [5.93, 10.38, 13.35, 16.31, 19.28, 22.24], [4.56, 7.99, 10.27, 12.55, 14.83, 17.11], [4.11, 7.19, 9.24, 11.29, 13.35, 15.40], [3.65, 6.39, 8.21, 10.04, 11.86, 13.69]],
    300: [[15.97, 20.53, 25.10, 29.66, 34.22, 38.79], [12.78, 16.43, 20.08, 23.73, 27.38, 31.03], [10.38, 13.35, 16.31, 19.28, 22.24, 25.21], [7.99, 10.27, 12.55, 14.83, 17.11, 19.39], [7.19, 9.24, 11.29, 13.35, 15.40, 17.45], [6.39, 8.21, 10.04, 11.86, 13.69, 15.51]],
    600: [[18.25, 22.82, 27.38, 31.94, 36.50, 41.07], [14.60, 18.25, 21.90, 25.55, 29.20, 32.85], [11.86, 14.83, 17.80, 20.76, 23.73, 26.69], [9.13, 11.41, 13.69, 15.97, 18.25, 20.53], [8.21, 10.27, 12.32, 14.37, 16.43, 18.48], [7.30, 9.13, 10.95, 12.78, 14.60, 16.43]],
    1200: [[22.82, 27.38, 31.94, 36.50, 41.07, 45.63], [18.25, 21.90, 25.55, 29.20, 32.85, 36.50], [14.83, 17.80, 20.76, 23.73, 26.69, 29.66], [11.41, 13.69, 15.97, 18.25, 20.53, 22.82], [10.27, 12.32, 14.37, 16.43, 18.48, 20.53], [9.13, 10.95, 12.78, 14.60, 16.43, 18.25]],
    1800: [[25.10, 34.22, 38.79, 43.35, 47.91, 52.47], [20.08, 27.38, 31.03, 34.68, 38.33, 41.98], [16.31, 22.24, 25.21, 28.18, 31.14, 34.11], [12.55, 17.11, 19.39, 21.67, 23.96, 26.24], [11.29, 15.40, 17.45, 19.51, 21.56, 23.61], [10.04, 13.69, 15.51, 17.34, 19.16, 20.99]]
  },
  /* Under 100 pieces: Chilian's 6–99 pz list, per piece and per location by the exact number of inks (1 to 8).
     chico = escudo and media carta (up to 300 cm²); grande = carta to doble carta (also extra grande). Breaks: 6, 12, 20, 30, 50 pz.
     From 100 pieces the LN1 table above rules. Four cells of the printed sheet broke its sequence and were taken from it
     (grande 12 pz 7 inks 233.47 → 332.38 · grande 50 pz 4 inks 61.43 → 59.22 · chico 20 pz 6 inks 192.09 → 162.38 · chico 50 pz 4 inks 58.18 → 52.99).
     Extras (colored garment, HD/puff, glitter, fleece…) use LN1's first break. 9 to 11 inks add the table's last step per ink. */
  chica: {
    tramos: [6, 12, 20, 30, 50],
    chico: [[117.82, 193.66, 269.52, 345.36, 421.21, 497.05, 572.9, 648.75], [61.09, 100.48, 139.86, 179.24, 218.62, 258, 297.39, 336.77], [38.41, 63.2, 88, 112.79, 137.59, 162.38, 187.18, 211.98],
      [27.06, 44.57, 62.07, 79.57, 97.07, 114.57, 132.08, 149.58], [17.98, 29.65, 41.32, 52.99, 64.66, 76.32, 88, 99.67]],
    grande: [[131.68, 216.45, 301.22, 385.99, 470.76, 555.53, 640.31, 725.07], [68.28, 112.29, 156.32, 200.33, 244.35, 288.36, 332.38, 376.39], [42.93, 70.64, 98.35, 126.07, 153.78, 181.5, 209.2, 236.91],
      [30.25, 49.8, 69.37, 88.93, 108.5, 128.06, 147.62, 167.18], [20.1, 33.14, 46.18, 59.22, 72.27, 85.31, 98.35, 111.39]]
  },
  // extras[name][size] = price per quantity break
  extras: {
    fabric: { 100: [1.76, 1.40, 1.14, 0.88, 0.79, 0.70], 300: [3.51, 2.81, 2.28, 1.76, 1.58, 1.40], 600: [5.27, 4.21, 3.42, 2.63, 2.37, 2.11], 1200: [10.53, 8.42, 6.84, 5.27, 4.74, 4.21], 1800: [14.04, 11.23, 9.13, 7.02, 6.32, 5.62] },
    antimigrante: { 100: [3.51, 2.81, 2.28, 1.76, 1.58, 1.40], 300: [5.27, 4.21, 3.42, 2.63, 2.37, 2.11], 600: [7.02, 5.62, 4.56, 3.51, 3.16, 2.81], 1200: [14.04, 11.23, 9.13, 7.02, 6.32, 5.62], 1800: [19.31, 15.44, 12.55, 9.65, 8.69, 7.72] },
    hdpuff: { 100: [3.51, 2.81, 2.28, 1.76, 1.58, 1.40], 300: [3.51, 2.81, 2.28, 1.76, 1.58, 1.40], 600: [5.27, 4.21, 3.42, 2.63, 2.37, 2.11], 1200: [10.53, 8.42, 6.84, 5.27, 4.74, 4.21], 1800: [15.80, 12.64, 10.27, 7.90, 7.11, 6.32] },
    fleece: { 100: [3.51, 2.81, 2.28, 1.76, 1.58, 1.40], 300: [5.27, 4.21, 3.42, 2.63, 2.37, 2.11], 600: [7.02, 5.62, 4.56, 3.51, 3.16, 2.81], 1200: [8.78, 7.02, 5.70, 4.39, 3.95, 3.51], 1800: [10.53, 8.42, 6.84, 5.27, 4.74, 4.21] },
    glitter: { 100: [1.76, 1.40, 1.14, 0.88, 0.79, 0.70], 300: [3.51, 2.81, 2.28, 1.76, 1.58, 1.40], 600: [7.02, 5.62, 4.56, 3.51, 3.16, 2.81], 1200: [14.04, 11.23, 9.13, 7.02, 6.32, 5.62], 1800: [19.31, 15.44, 12.55, 9.65, 8.69, 7.72] },
    export: { 100: [7.02, 5.62, 4.56, 3.51, 3.16, 2.81], 300: [12.29, 9.83, 7.99, 6.14, 5.53, 4.91], 600: [14.04, 11.23, 9.13, 7.02, 6.32, 5.62], 1200: [17.55, 14.04, 11.41, 8.78, 7.90, 7.02], 1800: [19.31, 15.44, 12.55, 9.65, 8.69, 7.72] }
  }
};
