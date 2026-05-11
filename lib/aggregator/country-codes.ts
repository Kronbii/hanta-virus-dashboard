import { ISO_NUMERIC_TO_ALPHA3 } from "@/lib/iso-numeric";
import type { ISO3 } from "@/lib/types";

/**
 * Common name ↔ ISO 3166-1 alpha-3 lookup. Hand-curated for the countries most
 * likely to appear in WHO Disease Outbreak News and GDELT for hantavirus.
 */
const NAME_TO_ISO3: Record<string, ISO3> = {
  afghanistan: "AFG",
  albania: "ALB",
  algeria: "DZA",
  andorra: "AND",
  angola: "AGO",
  argentina: "ARG",
  armenia: "ARM",
  australia: "AUS",
  austria: "AUT",
  azerbaijan: "AZE",
  bahamas: "BHS",
  bahrain: "BHR",
  bangladesh: "BGD",
  barbados: "BRB",
  belarus: "BLR",
  belgium: "BEL",
  belize: "BLZ",
  benin: "BEN",
  bhutan: "BTN",
  bolivia: "BOL",
  "bosnia and herzegovina": "BIH",
  botswana: "BWA",
  brazil: "BRA",
  brunei: "BRN",
  bulgaria: "BGR",
  "burkina faso": "BFA",
  burundi: "BDI",
  cambodia: "KHM",
  cameroon: "CMR",
  canada: "CAN",
  "cape verde": "CPV",
  "central african republic": "CAF",
  chad: "TCD",
  chile: "CHL",
  china: "CHN",
  colombia: "COL",
  comoros: "COM",
  congo: "COG",
  "republic of the congo": "COG",
  "democratic republic of the congo": "COD",
  "dr congo": "COD",
  drc: "COD",
  "costa rica": "CRI",
  "côte d'ivoire": "CIV",
  "cote d'ivoire": "CIV",
  "ivory coast": "CIV",
  croatia: "HRV",
  cuba: "CUB",
  cyprus: "CYP",
  "czech republic": "CZE",
  czechia: "CZE",
  denmark: "DNK",
  djibouti: "DJI",
  dominica: "DMA",
  "dominican republic": "DOM",
  ecuador: "ECU",
  egypt: "EGY",
  "el salvador": "SLV",
  "equatorial guinea": "GNQ",
  eritrea: "ERI",
  estonia: "EST",
  eswatini: "SWZ",
  swaziland: "SWZ",
  ethiopia: "ETH",
  fiji: "FJI",
  finland: "FIN",
  france: "FRA",
  gabon: "GAB",
  gambia: "GMB",
  georgia: "GEO",
  germany: "DEU",
  ghana: "GHA",
  greece: "GRC",
  greenland: "GRL",
  grenada: "GRD",
  guatemala: "GTM",
  guinea: "GIN",
  "guinea-bissau": "GNB",
  guyana: "GUY",
  haiti: "HTI",
  honduras: "HND",
  "hong kong": "HKG",
  hungary: "HUN",
  iceland: "ISL",
  india: "IND",
  indonesia: "IDN",
  iran: "IRN",
  "islamic republic of iran": "IRN",
  iraq: "IRQ",
  ireland: "IRL",
  israel: "ISR",
  italy: "ITA",
  jamaica: "JAM",
  japan: "JPN",
  jordan: "JOR",
  kazakhstan: "KAZ",
  kenya: "KEN",
  kosovo: "XKX",
  kuwait: "KWT",
  kyrgyzstan: "KGZ",
  laos: "LAO",
  "lao people's democratic republic": "LAO",
  latvia: "LVA",
  lebanon: "LBN",
  lesotho: "LSO",
  liberia: "LBR",
  libya: "LBY",
  liechtenstein: "LIE",
  lithuania: "LTU",
  luxembourg: "LUX",
  madagascar: "MDG",
  malawi: "MWI",
  malaysia: "MYS",
  maldives: "MDV",
  mali: "MLI",
  malta: "MLT",
  mauritania: "MRT",
  mauritius: "MUS",
  mexico: "MEX",
  moldova: "MDA",
  monaco: "MCO",
  mongolia: "MNG",
  montenegro: "MNE",
  morocco: "MAR",
  mozambique: "MOZ",
  myanmar: "MMR",
  burma: "MMR",
  namibia: "NAM",
  nepal: "NPL",
  netherlands: "NLD",
  "new zealand": "NZL",
  nicaragua: "NIC",
  niger: "NER",
  nigeria: "NGA",
  "north korea": "PRK",
  "democratic people's republic of korea": "PRK",
  "north macedonia": "MKD",
  macedonia: "MKD",
  norway: "NOR",
  oman: "OMN",
  pakistan: "PAK",
  palestine: "PSE",
  panama: "PAN",
  "papua new guinea": "PNG",
  paraguay: "PRY",
  peru: "PER",
  philippines: "PHL",
  poland: "POL",
  portugal: "PRT",
  qatar: "QAT",
  romania: "ROU",
  russia: "RUS",
  "russian federation": "RUS",
  rwanda: "RWA",
  "saint kitts and nevis": "KNA",
  "saint lucia": "LCA",
  "saint vincent and the grenadines": "VCT",
  samoa: "WSM",
  "san marino": "SMR",
  "saudi arabia": "SAU",
  senegal: "SEN",
  serbia: "SRB",
  seychelles: "SYC",
  "sierra leone": "SLE",
  singapore: "SGP",
  slovakia: "SVK",
  slovenia: "SVN",
  "solomon islands": "SLB",
  somalia: "SOM",
  "south africa": "ZAF",
  "south korea": "KOR",
  "republic of korea": "KOR",
  "south sudan": "SSD",
  spain: "ESP",
  "sri lanka": "LKA",
  sudan: "SDN",
  suriname: "SUR",
  sweden: "SWE",
  switzerland: "CHE",
  syria: "SYR",
  "syrian arab republic": "SYR",
  taiwan: "TWN",
  tajikistan: "TJK",
  tanzania: "TZA",
  "united republic of tanzania": "TZA",
  thailand: "THA",
  "timor-leste": "TLS",
  togo: "TGO",
  tonga: "TON",
  "trinidad and tobago": "TTO",
  tunisia: "TUN",
  turkey: "TUR",
  türkiye: "TUR",
  turkiye: "TUR",
  turkmenistan: "TKM",
  uganda: "UGA",
  ukraine: "UKR",
  "united arab emirates": "ARE",
  uae: "ARE",
  "united kingdom": "GBR",
  uk: "GBR",
  "great britain": "GBR",
  "united states": "USA",
  "united states of america": "USA",
  usa: "USA",
  us: "USA",
  america: "USA",
  uruguay: "URY",
  uzbekistan: "UZB",
  vanuatu: "VUT",
  venezuela: "VEN",
  "bolivarian republic of venezuela": "VEN",
  vietnam: "VNM",
  "viet nam": "VNM",
  yemen: "YEM",
  zambia: "ZMB",
  zimbabwe: "ZWE",
};

/** Normalize a country name for lookup: lowercase, trim, strip leading "the". */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function nameToIso3(name: string | undefined | null): ISO3 | undefined {
  if (!name) return undefined;
  const key = normalize(name);
  if (NAME_TO_ISO3[key]) return NAME_TO_ISO3[key];
  // Try matching after stripping common suffixes/prefixes
  const stripped = key.replace(/\s*\(.+\)\s*$/, "").trim();
  if (NAME_TO_ISO3[stripped]) return NAME_TO_ISO3[stripped];
  return undefined;
}

/** Best human display name for an ISO3 code. Reverses the curated map. */
const ISO3_TO_PREFERRED_NAME: Record<ISO3, string> = (() => {
  const out: Record<ISO3, string> = {};
  for (const [name, iso3] of Object.entries(NAME_TO_ISO3)) {
    // Prefer the shorter name when multiple aliases map to the same iso3.
    if (!out[iso3] || name.length < out[iso3].length) {
      out[iso3] = name;
    }
  }
  // Title-case the result.
  for (const [iso3, n] of Object.entries(out)) {
    out[iso3] = n
      .split(" ")
      .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
      .join(" ");
  }
  return out;
})();

export function iso3ToName(iso3: ISO3 | undefined): string {
  if (!iso3) return "Unknown";
  return ISO3_TO_PREFERRED_NAME[iso3] ?? iso3;
}

/** Confirm an alpha-3 code exists in our ISO numeric map (defensive). */
export function isKnownIso3(iso3: string): boolean {
  return Object.values(ISO_NUMERIC_TO_ALPHA3).includes(iso3);
}
