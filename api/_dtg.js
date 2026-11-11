/* Chilian's DTG price list (stand poster «Precios de impresión DTG», November 2026).
   MXN per piece and per print location, by the design's longest side ("medida hasta", cm) and by pieces.
   Two tables: colored or black garment (it takes a white base) and white garment.
   The website and the assistant add VAT and the online payment fee on top, as with every other list. */
export const DTG = {
  tramos: [1, 2, 5, 10, 20, 30, 40, 50, 100],           // pieces from
  medidas: [6, 11, 20, 27, 32, 40, 45, 49, 53],          // cm, longest side of the design, up to
  usos: [{ es: "logo chico, etiqueta", en: "small logo, label" }, { es: "logo de pecho o manga", en: "chest or sleeve logo" }, { es: "media carta", en: "half letter" },
    { es: "carta, frente estándar", en: "letter, standard front" }, { es: "frente mediano", en: "medium front" }, { es: "doble carta", en: "double letter" },
    { es: "frente o espalda grande", en: "large front or back" }, { es: "espalda grande", en: "large back" }, { es: "lo máximo de la máquina", en: "the press's largest" }],
  color: [
    [70, 70, 70, 44, 40, 35, 32, 28, 25], [70, 70, 70, 57, 49, 44, 41, 35, 32], [116, 100, 80, 68, 60, 56, 53, 50, 47],
    [132, 112, 88, 74, 68, 64, 61, 59, 56], [144, 120, 100, 88, 72, 69, 66, 64, 60], [160, 136, 112, 108, 106, 104, 100, 93, 88],
    [172, 144, 124, 120, 113, 106, 104, 100, 95], [208, 172, 144, 140, 132, 120, 112, 108, 100], [228, 190, 158, 153, 144, 133, 124, 119, 110]
  ],
  blanca: [
    [55, 55, 43, 34, 30, 26, 22, 19, 16], [55, 55, 43, 42, 34, 30, 22, 22, 19], [95, 95, 55, 50, 41, 37, 34, 29, 26],
    [95, 95, 64, 55, 46, 41, 38, 36, 32], [95, 95, 73, 59, 50, 46, 43, 40, 37], [95, 95, 77, 73, 66, 66, 59, 54, 49],
    [95, 95, 91, 82, 73, 67, 61, 57, 52], [100, 88, 84, 76, 68, 68, 64, 56, 50], [120, 106, 101, 92, 82, 77, 72, 67, 60]
  ]
};
// Index of the size that covers a design whose longest side is `cm` (the largest size if it is bigger).
export const dtgSize = (cm) => { const i = DTG.medidas.findIndex((x) => x >= (+cm || 0)); return i < 0 ? DTG.medidas.length - 1 : i; };
// Price per piece of one DTG location.
export function dtgPrice(cm, q, white, T = DTG) {
  let t = 0; T.tramos.forEach((x, k) => { if (q >= x) t = k; });
  const i = T.medidas.findIndex((x) => x >= (+cm || 0)), s = i < 0 ? T.medidas.length - 1 : i;
  return T[white ? "blanca" : "color"][s][t];
}
