export const PRODUCT_GROUPS = {
  "شاورما وطلبات سريعة": [
    { name: "شاورما", type: "shawarma" },
    { name: "شرحات", type: "simple" },
    { name: "حوسي", type: "simple" },
    { name: "حوسي للحمص", type: "simple" }
  ],

  "ناعمة / كبة / كفته": [
    { name: "لحمة ناعمة", type: "simple" },
    { name: "لحمة ناعمة بدون دهن", type: "simple" },
    { name: "لحمة خشن", type: "simple" },
    { name: "كبة", type: "simple" },
    { name: "صفايح / كفته", type: "kofta" },
    { name: "برغر", type: "readyChoice" },
    { name: "كباب", type: "readyChoice" }
  ],

  سلق: [
    { name: "سلق", type: "simple" },
    { name: "موزات", type: "simple" },
    { name: "رقبة عجل", type: "simple" }
  ],

  غنم: [
    { name: "غنم", type: "simple" },
    { name: "ريش غنم", type: "simple" },
    { name: "غنم سلق مع عظم", type: "simple" },
    { name: "غنم سلق بدون عظم", type: "simple" },
    { name: "كبة غنم", type: "simple" },
    { name: "خشن غنم", type: "simple" }
  ],

  شوي: [
    { name: "فيليه", type: "grillParent" },
    { name: "سينتا", type: "grillParent" },
    { name: "كعب فخذ", type: "grillParent" }
  ],

  قصبه: [
    { name: "قصبه", type: "simple" }
  ]
};

export const GRILL_OPTIONS = [
  "ستيك",
  "شيش",
  "شرحات"
];

export const SHAWARMA_SPICES = [
  "مبهر",
  "بدون بهار",
  "بهار عجنب"
];

export const KOFTA_EXTRAS = [
  "بصل",
  "بقدونس",
  "ثوم",
  "حد",
  "بندوره"
];

export const KOFTA_SPICES = [
  "مبهر",
  "بدون بهار",
  "بهار عجنب"
];

export const ALL_PRICE_ITEMS = Array.from(
  new Set(
    Object.values(PRODUCT_GROUPS)
      .flat()
      .map((item) => item.name)
  )
);

export const TODAY_TIME_OPTIONS = [
  "بعد 5 دقائق",
  "بعد 10 دقائق",
  "بعد 15 دقيقة",
  "بعد 30 دقيقة",
  "بعد ساعة",
  "بعد ساعتين"
];

export const FUTURE_TIME_OPTIONS = [
  "غداً 09:00",
  "غداً 12:00",
  "غداً 17:00",
  "بعد يومين 09:00",
  "بعد يومين 12:00",
  "بعد يومين 17:00"
];