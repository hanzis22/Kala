// DIHASILKAN oleh scripts/fetch-cities.mjs. Jangan diedit tangan.
// Koordinat: Wikidata (CC0). Sumber dan query: docs/sumber-konten.md.
import type { City } from '$lib/domain/types';

export const CITIES_SOURCE = {
  name: 'Wikidata',
  license: 'CC0 1.0',
  endpoint: 'https://query.wikidata.org/sparql',
  retrievedAt: '2026-10-17T05:50:09.549Z'
} as const;

/** id ibu kota 38 provinsi. */
export const PROVINCE_CAPITAL_IDS: readonly string[] = ["Q5779","Q5972","Q7253","Q7786","Q10104","Q7578","Q8131","Q8179","Q8042","Q8156","Q10109","Q10389","Q10126","Q11025","Q7568","Q11462","Q14168","Q14409","Q11506","Q14126","Q14155","Q14181","Q14499","Q976062","Q15847","Q14525","Q15826","Q15349","Q14634","Q15379","Q18970","Q1350702","Q27860","Q26748","Q26837","Q27708","Q2307531","Q27693"];

export const CITIES: readonly City[] = [
  {
    "id": "Q5779",
    "code": "1171",
    "name": "Banda Aceh",
    "province": "Aceh",
    "lat": 5.55,
    "lng": 95.3175,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5778",
    "code": "1107",
    "name": "Kab. Aceh Barat",
    "province": "Aceh",
    "lat": 4.45,
    "lng": 96.1833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5775",
    "code": "1112",
    "name": "Kab. Aceh Barat Daya",
    "province": "Aceh",
    "lat": 3.7911,
    "lng": 95.9167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5662",
    "code": "1108",
    "name": "Kab. Aceh Besar",
    "province": "Aceh",
    "lat": 5.3667,
    "lng": 95.5333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5667",
    "code": "1116",
    "name": "Kab. Aceh Jaya",
    "province": "Aceh",
    "lat": 4.8167,
    "lng": 95.6667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5759",
    "code": "1103",
    "name": "Kab. Aceh Selatan",
    "province": "Aceh",
    "lat": 3.1333,
    "lng": 97.45,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5672",
    "code": "1102",
    "name": "Kab. Aceh Singkil",
    "province": "Aceh",
    "lat": 2.3333,
    "lng": 97.6667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5678",
    "code": "1114",
    "name": "Kab. Aceh Tamiang",
    "province": "Aceh",
    "lat": 4.2749,
    "lng": 97.8722,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5675",
    "code": "1106",
    "name": "Kab. Aceh Tengah",
    "province": "Aceh",
    "lat": 4.3333,
    "lng": 96.3333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5763",
    "code": "1104",
    "name": "Kab. Aceh Tenggara",
    "province": "Aceh",
    "lat": 3.4731,
    "lng": 97.8192,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5674",
    "code": "1105",
    "name": "Kab. Aceh Timur",
    "province": "Aceh",
    "lat": 4.6167,
    "lng": 97.6167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5750",
    "code": "1111",
    "name": "Kab. Aceh Utara",
    "province": "Aceh",
    "lat": 4.9167,
    "lng": 97,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5719",
    "code": "1117",
    "name": "Kab. Bener Meriah",
    "province": "Aceh",
    "lat": 4.75,
    "lng": 97,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5722",
    "code": "1110",
    "name": "Kab. Bireuen",
    "province": "Aceh",
    "lat": 5.0833,
    "lng": 96.6,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5666",
    "code": "1113",
    "name": "Kab. Gayo Lues",
    "province": "Aceh",
    "lat": 4,
    "lng": 97,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5746",
    "code": "1115",
    "name": "Kab. Nagan Raya",
    "province": "Aceh",
    "lat": 4.1689,
    "lng": 96.3244,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5751",
    "code": "1109",
    "name": "Kab. Pidie",
    "province": "Aceh",
    "lat": 5.08,
    "lng": 96.11,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5754",
    "code": "1118",
    "name": "Kab. Pidie Jaya",
    "province": "Aceh",
    "lat": 5.15,
    "lng": 96.2167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5757",
    "code": "1101",
    "name": "Kab. Simeulue",
    "province": "Aceh",
    "lat": 2.6167,
    "lng": 96.0833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5781",
    "code": "1173",
    "name": "Langsa",
    "province": "Aceh",
    "lat": 4.4667,
    "lng": 97.95,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5784",
    "code": "1174",
    "name": "Lhokseumawe",
    "province": "Aceh",
    "lat": 5.18,
    "lng": 97.1506,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5787",
    "code": "1172",
    "name": "Sabang",
    "province": "Aceh",
    "lat": 5.8931,
    "lng": 95.32,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5789",
    "code": "1175",
    "name": "Subulussalam",
    "province": "Aceh",
    "lat": 2.6422,
    "lng": 98.0042,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11506",
    "code": "5171",
    "name": "Denpasar",
    "province": "Bali",
    "lat": -8.6717,
    "lng": 115.2339,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11482",
    "code": "5103",
    "name": "Kab. Badung",
    "province": "Bali",
    "lat": -8.5833,
    "lng": 115.1833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11491",
    "code": "5106",
    "name": "Kab. Bangli",
    "province": "Bali",
    "lat": -8.2832,
    "lng": 115.3328,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11495",
    "code": "5108",
    "name": "Kab. Buleleng",
    "province": "Bali",
    "lat": -8.2,
    "lng": 114.95,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11496",
    "code": "5104",
    "name": "Kab. Gianyar",
    "province": "Bali",
    "lat": -8.4667,
    "lng": 115.2833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11499",
    "code": "5101",
    "name": "Kab. Jembrana",
    "province": "Bali",
    "lat": -8.3,
    "lng": 114.6667,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11501",
    "code": "5107",
    "name": "Kab. Karangasem",
    "province": "Bali",
    "lat": -8.3667,
    "lng": 115.5167,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11503",
    "code": "5105",
    "name": "Kab. Klungkung",
    "province": "Bali",
    "lat": -8.5389,
    "lng": 115.4045,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11505",
    "code": "5102",
    "name": "Kab. Tabanan",
    "province": "Bali",
    "lat": -8.5511,
    "lng": 115.1216,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q10124",
    "code": "3672",
    "name": "Cilegon",
    "province": "Banten",
    "lat": -6.0167,
    "lng": 106.0167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10119",
    "code": "3602",
    "name": "Kab. Lebak",
    "province": "Banten",
    "lat": -6.65,
    "lng": 106.2167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10121",
    "code": "3601",
    "name": "Kab. Pandeglang",
    "province": "Banten",
    "lat": -6.3092,
    "lng": 106.1047,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10122",
    "code": "3604",
    "name": "Kab. Serang",
    "province": "Banten",
    "lat": -6.15,
    "lng": 106,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10123",
    "code": "3603",
    "name": "Kab. Tangerang",
    "province": "Banten",
    "lat": -6.2,
    "lng": 106.49,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10126",
    "code": "3673",
    "name": "Serang",
    "province": "Banten",
    "lat": -6.12,
    "lng": 106.1503,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10127",
    "code": "3671",
    "name": "Tangerang",
    "province": "Banten",
    "lat": -6.1703,
    "lng": 106.6403,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10128",
    "code": "3674",
    "name": "Tangerang Selatan",
    "province": "Banten",
    "lat": -6.2889,
    "lng": 106.7181,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8042",
    "code": "1771",
    "name": "Bengkulu",
    "province": "Bengkulu",
    "lat": -3.7956,
    "lng": 102.2592,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8040",
    "code": "1701",
    "name": "Kab. Bengkulu Selatan",
    "province": "Bengkulu",
    "lat": -4.4635,
    "lng": 102.917,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7796",
    "code": "1709",
    "name": "Kab. Bengkulu Tengah",
    "province": "Bengkulu",
    "lat": -3.2068,
    "lng": 102.1262,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8034",
    "code": "1703",
    "name": "Kab. Bengkulu Utara",
    "province": "Bengkulu",
    "lat": -3.3333,
    "lng": 102.05,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q3182322",
    "code": "1704",
    "name": "Kab. Kaur",
    "province": "Bengkulu",
    "lat": -4.5893,
    "lng": 103.4168,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7940",
    "code": "1708",
    "name": "Kab. Kepahiang",
    "province": "Bengkulu",
    "lat": -3.6019,
    "lng": 102.5642,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8031",
    "code": "1707",
    "name": "Kab. Lebong",
    "province": "Bengkulu",
    "lat": -3.2428,
    "lng": 102.3349,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8033",
    "code": "1706",
    "name": "Kab. Mukomuko",
    "province": "Bengkulu",
    "lat": -2.5529,
    "lng": 101.1042,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8035",
    "code": "1702",
    "name": "Kab. Rejang Lebong",
    "province": "Bengkulu",
    "lat": -3.4333,
    "lng": 102.7167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8037",
    "code": "1705",
    "name": "Kab. Seluma",
    "province": "Bengkulu",
    "lat": -3.9664,
    "lng": 102.4743,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11477",
    "code": "3402",
    "name": "Kab. Bantul",
    "province": "DI Yogyakarta",
    "lat": -7.8846,
    "lng": 110.3341,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11478",
    "code": "3403",
    "name": "Kab. Gunungkidul",
    "province": "DI Yogyakarta",
    "lat": -7.965,
    "lng": 110.6,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11479",
    "code": "3401",
    "name": "Kab. Kulon Progo",
    "province": "DI Yogyakarta",
    "lat": -7.8596,
    "lng": 110.1579,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11480",
    "code": "3404",
    "name": "Kab. Sleman",
    "province": "DI Yogyakarta",
    "lat": -7.6817,
    "lng": 110.3233,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7568",
    "code": "3471",
    "name": "Yogyakarta",
    "province": "DI Yogyakarta",
    "lat": -7.8005,
    "lng": 110.3913,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10116",
    "code": "3174",
    "name": "Jakarta Barat",
    "province": "DKI Jakarta",
    "lat": -6.185,
    "lng": 106.731,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10109",
    "code": "3173",
    "name": "Jakarta Pusat",
    "province": "DKI Jakarta",
    "lat": -6.17,
    "lng": 106.82,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10114",
    "code": "3171",
    "name": "Jakarta Selatan",
    "province": "DKI Jakarta",
    "lat": -6.25,
    "lng": 106.8,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10111",
    "code": "3172",
    "name": "Jakarta Timur",
    "province": "DKI Jakarta",
    "lat": -6.21,
    "lng": 106.94,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10113",
    "code": "3175",
    "name": "Jakarta Utara",
    "province": "DKI Jakarta",
    "lat": -6.12,
    "lng": 106.9,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10107",
    "code": "3101",
    "name": "Kab. Kepulauan Seribu",
    "province": "DKI Jakarta",
    "lat": -5.6629,
    "lng": 106.5683,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14525",
    "code": "7571",
    "name": "Gorontalo",
    "province": "Gorontalo",
    "lat": 0.5422,
    "lng": 123.0614,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14508",
    "code": "7501",
    "name": "Kab. Boalemo",
    "province": "Gorontalo",
    "lat": 0.65,
    "lng": 122.3167,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14519",
    "code": "7504",
    "name": "Kab. Bone Bolango",
    "province": "Gorontalo",
    "lat": 0.55,
    "lng": 123.2,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14521",
    "code": "7502",
    "name": "Kab. Gorontalo",
    "province": "Gorontalo",
    "lat": 0.5728,
    "lng": 122.2337,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14522",
    "code": "7505",
    "name": "Kab. Gorontalo Utara",
    "province": "Gorontalo",
    "lat": 0.791,
    "lng": 122.8687,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14523",
    "code": "7503",
    "name": "Kab. Pohuwato",
    "province": "Gorontalo",
    "lat": 0.7098,
    "lng": 121.5958,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q7578",
    "code": "1571",
    "name": "Jambi",
    "province": "Jambi",
    "lat": -1.6288,
    "lng": 103.6082,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7370",
    "code": "1504",
    "name": "Kab. Batang Hari",
    "province": "Jambi",
    "lat": -1.7138,
    "lng": 103.2617,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7373",
    "code": "1509",
    "name": "Kab. Bungo",
    "province": "Jambi",
    "lat": -1.5161,
    "lng": 102.1188,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7376",
    "code": "1501",
    "name": "Kab. Kerinci",
    "province": "Jambi",
    "lat": -1.9361,
    "lng": 101.3425,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7379",
    "code": "1502",
    "name": "Kab. Merangin",
    "province": "Jambi",
    "lat": -2.0692,
    "lng": 102.1328,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7381",
    "code": "1505",
    "name": "Kab. Muaro Jambi",
    "province": "Jambi",
    "lat": -1.4495,
    "lng": 103.5161,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7383",
    "code": "1503",
    "name": "Kab. Sarolangun",
    "province": "Jambi",
    "lat": -2.3,
    "lng": 102.65,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7388",
    "code": "1507",
    "name": "Kab. Tanjung Jabung Barat",
    "province": "Jambi",
    "lat": -0.8263,
    "lng": 103.4615,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7384",
    "code": "1506",
    "name": "Kab. Tanjung Jabung Timur",
    "province": "Jambi",
    "lat": -1.132,
    "lng": 103.6176,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7389",
    "code": "1508",
    "name": "Kab. Tebo",
    "province": "Jambi",
    "lat": -1.3833,
    "lng": 102.317,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7592",
    "code": "1572",
    "name": "Sungai Penuh",
    "province": "Jambi",
    "lat": -2.0636,
    "lng": 101.3961,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10389",
    "code": "3273",
    "name": "Bandung",
    "province": "Jawa Barat",
    "lat": -6.9219,
    "lng": 107.6069,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10391",
    "code": "3279",
    "name": "Banjar",
    "province": "Jawa Barat",
    "lat": -7.3667,
    "lng": 108.5333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10392",
    "code": "3275",
    "name": "Bekasi",
    "province": "Jawa Barat",
    "lat": -6.2333,
    "lng": 107,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10393",
    "code": "3271",
    "name": "Bogor",
    "province": "Jawa Barat",
    "lat": -6.5978,
    "lng": 106.7993,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10394",
    "code": "3277",
    "name": "Cimahi",
    "province": "Jawa Barat",
    "lat": -6.88,
    "lng": 107.5385,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10395",
    "code": "3274",
    "name": "Cirebon",
    "province": "Jawa Barat",
    "lat": -6.7397,
    "lng": 108.553,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10396",
    "code": "3276",
    "name": "Depok",
    "province": "Jawa Barat",
    "lat": -6.405,
    "lng": 106.8173,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10332",
    "code": "3204",
    "name": "Kab. Bandung",
    "province": "Jawa Barat",
    "lat": -7.0219,
    "lng": 107.5281,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10388",
    "code": "3217",
    "name": "Kab. Bandung Barat",
    "province": "Jawa Barat",
    "lat": -6.8411,
    "lng": 107.5126,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10340",
    "code": "3216",
    "name": "Kab. Bekasi",
    "province": "Jawa Barat",
    "lat": -6.3659,
    "lng": 107.1731,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10363",
    "code": "3201",
    "name": "Kab. Bogor",
    "province": "Jawa Barat",
    "lat": -6.4803,
    "lng": 106.8247,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10367",
    "code": "3203",
    "name": "Kab. Cianjur",
    "province": "Jawa Barat",
    "lat": -6.8212,
    "lng": 107.1401,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10368",
    "code": "3209",
    "name": "Kab. Cirebon",
    "province": "Jawa Barat",
    "lat": -6.7578,
    "lng": 108.4805,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10371",
    "code": "3205",
    "name": "Kab. Garut",
    "province": "Jawa Barat",
    "lat": -7.2047,
    "lng": 107.8876,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10374",
    "code": "3212",
    "name": "Kab. Indramayu",
    "province": "Jawa Barat",
    "lat": -6.3269,
    "lng": 108.3222,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10375",
    "code": "3215",
    "name": "Kab. Karawang",
    "province": "Jawa Barat",
    "lat": -6.3051,
    "lng": 107.3003,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10376",
    "code": "3208",
    "name": "Kab. Kuningan",
    "province": "Jawa Barat",
    "lat": -6.9766,
    "lng": 108.4849,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10377",
    "code": "3210",
    "name": "Kab. Majalengka",
    "province": "Jawa Barat",
    "lat": -6.8353,
    "lng": 108.2277,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q46483",
    "code": "3218",
    "name": "Kab. Pangandaran",
    "province": "Jawa Barat",
    "lat": -7.7017,
    "lng": 108.4942,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10378",
    "code": "3214",
    "name": "Kab. Purwakarta",
    "province": "Jawa Barat",
    "lat": -6.5386,
    "lng": 107.4436,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10365",
    "code": "3207",
    "name": "Kab. Q10365",
    "province": "Jawa Barat",
    "lat": -7.3267,
    "lng": 108.3531,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10380",
    "code": "3213",
    "name": "Kab. Subang",
    "province": "Jawa Barat",
    "lat": -6.5698,
    "lng": 107.7628,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10381",
    "code": "3202",
    "name": "Kab. Sukabumi",
    "province": "Jawa Barat",
    "lat": -6.9873,
    "lng": 106.5511,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10382",
    "code": "3211",
    "name": "Kab. Sumedang",
    "province": "Jawa Barat",
    "lat": -6.85,
    "lng": 107.9167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10385",
    "code": "3206",
    "name": "Kab. Tasikmalaya",
    "province": "Jawa Barat",
    "lat": -7.3658,
    "lng": 108.1019,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10397",
    "code": "3272",
    "name": "Sukabumi",
    "province": "Jawa Barat",
    "lat": -6.932,
    "lng": 106.9186,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10399",
    "code": "3278",
    "name": "Tasikmalaya",
    "province": "Jawa Barat",
    "lat": -7.3258,
    "lng": 108.2202,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10604",
    "code": "3304",
    "name": "Kab. Banjarnegara",
    "province": "Jawa Tengah",
    "lat": -7.3961,
    "lng": 109.757,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10605",
    "code": "3302",
    "name": "Kab. Banyumas",
    "province": "Jawa Tengah",
    "lat": -7.425,
    "lng": 109.23,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10607",
    "code": "3325",
    "name": "Kab. Batang",
    "province": "Jawa Tengah",
    "lat": -6.9081,
    "lng": 109.7304,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10608",
    "code": "3316",
    "name": "Kab. Blora",
    "province": "Jawa Tengah",
    "lat": -7.0667,
    "lng": 111.3833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10609",
    "code": "3309",
    "name": "Kab. Boyolali",
    "province": "Jawa Tengah",
    "lat": -7.5322,
    "lng": 110.6025,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10610",
    "code": "3329",
    "name": "Kab. Brebes",
    "province": "Jawa Tengah",
    "lat": -7.05,
    "lng": 108.9,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10612",
    "code": "3301",
    "name": "Kab. Cilacap",
    "province": "Jawa Tengah",
    "lat": -7.7333,
    "lng": 109,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10613",
    "code": "3321",
    "name": "Kab. Demak",
    "province": "Jawa Tengah",
    "lat": -6.8833,
    "lng": 110.6667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10614",
    "code": "3315",
    "name": "Kab. Grobogan",
    "province": "Jawa Tengah",
    "lat": -7.03,
    "lng": 110.9211,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10615",
    "code": "3320",
    "name": "Kab. Jepara",
    "province": "Jawa Tengah",
    "lat": -6.5333,
    "lng": 110.6667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10616",
    "code": "3313",
    "name": "Kab. Karanganyar",
    "province": "Jawa Tengah",
    "lat": -7.5961,
    "lng": 110.9508,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10617",
    "code": "3305",
    "name": "Kab. Kebumen",
    "province": "Jawa Tengah",
    "lat": -7.6294,
    "lng": 109.5706,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10618",
    "code": "3324",
    "name": "Kab. Kendal",
    "province": "Jawa Tengah",
    "lat": -7.0256,
    "lng": 110.1685,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10619",
    "code": "3310",
    "name": "Kab. Klaten",
    "province": "Jawa Tengah",
    "lat": -7.6833,
    "lng": 110.6167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10620",
    "code": "3319",
    "name": "Kab. Kudus",
    "province": "Jawa Tengah",
    "lat": -6.8,
    "lng": 110.8667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10621",
    "code": "3308",
    "name": "Kab. Magelang",
    "province": "Jawa Tengah",
    "lat": -7.6575,
    "lng": 110.2731,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10622",
    "code": "3318",
    "name": "Kab. Pati",
    "province": "Jawa Tengah",
    "lat": -6.7667,
    "lng": 111.1,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10623",
    "code": "3326",
    "name": "Kab. Pekalongan",
    "province": "Jawa Tengah",
    "lat": -6.8825,
    "lng": 109.67,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10624",
    "code": "3327",
    "name": "Kab. Pemalang",
    "province": "Jawa Tengah",
    "lat": -7.0333,
    "lng": 109.4,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10625",
    "code": "3303",
    "name": "Kab. Purbalingga",
    "province": "Jawa Tengah",
    "lat": -7.2833,
    "lng": 109.35,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10674",
    "code": "3306",
    "name": "Kab. Purworejo",
    "province": "Jawa Tengah",
    "lat": -7.7167,
    "lng": 110.0167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10684",
    "code": "3317",
    "name": "Kab. Rembang",
    "province": "Jawa Tengah",
    "lat": -6.7167,
    "lng": 111.35,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10687",
    "code": "3322",
    "name": "Kab. Semarang",
    "province": "Jawa Tengah",
    "lat": -7.2656,
    "lng": 110.3358,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10688",
    "code": "3314",
    "name": "Kab. Sragen",
    "province": "Jawa Tengah",
    "lat": -7.4128,
    "lng": 110.935,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10692",
    "code": "3311",
    "name": "Kab. Sukoharjo",
    "province": "Jawa Tengah",
    "lat": -7.6833,
    "lng": 110.8333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10705",
    "code": "3328",
    "name": "Kab. Tegal",
    "province": "Jawa Tengah",
    "lat": -6.8667,
    "lng": 109.15,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10979",
    "code": "3323",
    "name": "Kab. Temanggung",
    "province": "Jawa Tengah",
    "lat": -7.3,
    "lng": 110.1667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10981",
    "code": "3312",
    "name": "Kab. Wonogiri",
    "province": "Jawa Tengah",
    "lat": -7.9167,
    "lng": 111,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11013",
    "code": "3307",
    "name": "Kab. Wonosobo",
    "province": "Jawa Tengah",
    "lat": -7.3614,
    "lng": 109.9267,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11017",
    "code": "3371",
    "name": "Magelang",
    "province": "Jawa Tengah",
    "lat": -7.4706,
    "lng": 110.2178,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11026",
    "code": "3375",
    "name": "Pekalongan",
    "province": "Jawa Tengah",
    "lat": -6.8883,
    "lng": 109.6753,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11021",
    "code": "3373",
    "name": "Salatiga",
    "province": "Jawa Tengah",
    "lat": -7.3389,
    "lng": 110.5022,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11025",
    "code": "3374",
    "name": "Semarang",
    "province": "Jawa Tengah",
    "lat": -6.99,
    "lng": 110.4225,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q4803",
    "code": "3372",
    "name": "Surakarta",
    "province": "Jawa Tengah",
    "lat": -7.5667,
    "lng": 110.8167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11027",
    "code": "3376",
    "name": "Tegal",
    "province": "Jawa Tengah",
    "lat": -6.8675,
    "lng": 109.1375,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11434",
    "code": "3579",
    "name": "Batu",
    "province": "Jawa Timur",
    "lat": -7.8672,
    "lng": 112.5239,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11441",
    "code": "3572",
    "name": "Blitar",
    "province": "Jawa Timur",
    "lat": -8.1,
    "lng": 112.1667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11066",
    "code": "3526",
    "name": "Kab. Bangkalan",
    "province": "Jawa Timur",
    "lat": -7.0292,
    "lng": 112.7461,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11067",
    "code": "3510",
    "name": "Kab. Banyuwangi",
    "province": "Jawa Timur",
    "lat": -8.2267,
    "lng": 114.3664,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11069",
    "code": "3505",
    "name": "Kab. Blitar",
    "province": "Jawa Timur",
    "lat": -8.1333,
    "lng": 112.25,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11071",
    "code": "3522",
    "name": "Kab. Bojonegoro",
    "province": "Jawa Timur",
    "lat": -7.275,
    "lng": 111.795,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11076",
    "code": "3511",
    "name": "Kab. Bondowoso",
    "province": "Jawa Timur",
    "lat": -7.9404,
    "lng": 113.9834,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11077",
    "code": "3525",
    "name": "Kab. Gresik",
    "province": "Jawa Timur",
    "lat": -7.1933,
    "lng": 112.553,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11080",
    "code": "3509",
    "name": "Kab. Jember",
    "province": "Jawa Timur",
    "lat": -8.1689,
    "lng": 113.7022,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11082",
    "code": "3517",
    "name": "Kab. Jombang",
    "province": "Jawa Timur",
    "lat": -7.4667,
    "lng": 112.2333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11084",
    "code": "3506",
    "name": "Kab. Kediri",
    "province": "Jawa Timur",
    "lat": -7.8333,
    "lng": 112.1667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11086",
    "code": "3524",
    "name": "Kab. Lamongan",
    "province": "Jawa Timur",
    "lat": -7.1167,
    "lng": 112.4167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11087",
    "code": "3508",
    "name": "Kab. Lumajang",
    "province": "Jawa Timur",
    "lat": -8.1333,
    "lng": 113.2167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11091",
    "code": "3519",
    "name": "Kab. Madiun",
    "province": "Jawa Timur",
    "lat": -7.6167,
    "lng": 111.65,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11092",
    "code": "3520",
    "name": "Kab. Magetan",
    "province": "Jawa Timur",
    "lat": -7.65,
    "lng": 111.3667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11095",
    "code": "3507",
    "name": "Kab. Malang",
    "province": "Jawa Timur",
    "lat": -7.9797,
    "lng": 112.6304,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11096",
    "code": "3516",
    "name": "Kab. Mojokerto",
    "province": "Jawa Timur",
    "lat": -7.55,
    "lng": 112.5,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11098",
    "code": "3518",
    "name": "Kab. Nganjuk",
    "province": "Jawa Timur",
    "lat": -7.6,
    "lng": 111.9333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11108",
    "code": "3521",
    "name": "Kab. Ngawi",
    "province": "Jawa Timur",
    "lat": -7.4636,
    "lng": 111.2983,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11111",
    "code": "3501",
    "name": "Kab. Pacitan",
    "province": "Jawa Timur",
    "lat": -8.1333,
    "lng": 111.1667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11112",
    "code": "3528",
    "name": "Kab. Pamekasan",
    "province": "Jawa Timur",
    "lat": -7.0667,
    "lng": 113.5,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11115",
    "code": "3514",
    "name": "Kab. Pasuruan",
    "province": "Jawa Timur",
    "lat": -7.7333,
    "lng": 112.8333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11118",
    "code": "3502",
    "name": "Kab. Ponorogo",
    "province": "Jawa Timur",
    "lat": -7.8686,
    "lng": 111.4619,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11121",
    "code": "3513",
    "name": "Kab. Probolinggo",
    "province": "Jawa Timur",
    "lat": -7.7353,
    "lng": 113.4717,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11127",
    "code": "3527",
    "name": "Kab. Sampang",
    "province": "Jawa Timur",
    "lat": -7.05,
    "lng": 113.25,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11129",
    "code": "3515",
    "name": "Kab. Sidoarjo",
    "province": "Jawa Timur",
    "lat": -7.453,
    "lng": 112.7173,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11134",
    "code": "3512",
    "name": "Kab. Situbondo",
    "province": "Jawa Timur",
    "lat": -7.7167,
    "lng": 114.05,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11137",
    "code": "3529",
    "name": "Kab. Sumenep",
    "province": "Jawa Timur",
    "lat": -7.0167,
    "lng": 113.8667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11139",
    "code": "3503",
    "name": "Kab. Trenggalek",
    "province": "Jawa Timur",
    "lat": -8.05,
    "lng": 111.7167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11141",
    "code": "3523",
    "name": "Kab. Tuban",
    "province": "Jawa Timur",
    "lat": -6.8833,
    "lng": 112.05,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11143",
    "code": "3504",
    "name": "Kab. Tulungagung",
    "province": "Jawa Timur",
    "lat": -8.0667,
    "lng": 111.9,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11443",
    "code": "3571",
    "name": "Kediri",
    "province": "Jawa Timur",
    "lat": -7.8111,
    "lng": 112.0047,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11444",
    "code": "3577",
    "name": "Madiun",
    "province": "Jawa Timur",
    "lat": -7.63,
    "lng": 111.5231,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11445",
    "code": "3573",
    "name": "Malang",
    "province": "Jawa Timur",
    "lat": -7.9689,
    "lng": 112.6327,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11447",
    "code": "3576",
    "name": "Mojokerto",
    "province": "Jawa Timur",
    "lat": -7.4722,
    "lng": 112.4336,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11449",
    "code": "3575",
    "name": "Pasuruan",
    "province": "Jawa Timur",
    "lat": -7.6406,
    "lng": 112.9065,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11450",
    "code": "3574",
    "name": "Probolinggo",
    "province": "Jawa Timur",
    "lat": -7.75,
    "lng": 113.2167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q11462",
    "code": "3578",
    "name": "Surabaya",
    "province": "Jawa Timur",
    "lat": -7.2463,
    "lng": 112.7378,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14156",
    "code": "6102",
    "name": "Kab. Bengkayang",
    "province": "Kalimantan Barat",
    "lat": 1.0691,
    "lng": 109.6639,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14157",
    "code": "6108",
    "name": "Kab. Kapuas Hulu",
    "province": "Kalimantan Barat",
    "lat": 0.8167,
    "lng": 112.7667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14158",
    "code": "6111",
    "name": "Kab. Kayong Utara",
    "province": "Kalimantan Barat",
    "lat": -1.4371,
    "lng": 110.7978,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14159",
    "code": "6106",
    "name": "Kab. Ketapang",
    "province": "Kalimantan Barat",
    "lat": -1.5833,
    "lng": 110.5,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14160",
    "code": "6112",
    "name": "Kab. Kubu Raya",
    "province": "Kalimantan Barat",
    "lat": 0.0164,
    "lng": 109.3373,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14161",
    "code": "6103",
    "name": "Kab. Landak",
    "province": "Kalimantan Barat",
    "lat": 0.4237,
    "lng": 109.7592,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14162",
    "code": "6110",
    "name": "Kab. Melawi",
    "province": "Kalimantan Barat",
    "lat": -0.3361,
    "lng": 111.6981,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14163",
    "code": "6104",
    "name": "Kab. Mempawah",
    "province": "Kalimantan Barat",
    "lat": 0.25,
    "lng": 109.1667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14164",
    "code": "6101",
    "name": "Kab. Sambas",
    "province": "Kalimantan Barat",
    "lat": 1.4167,
    "lng": 109.3333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14165",
    "code": "6105",
    "name": "Kab. Sanggau",
    "province": "Kalimantan Barat",
    "lat": 0.1234,
    "lng": 110.597,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14166",
    "code": "6109",
    "name": "Kab. Sekadau",
    "province": "Kalimantan Barat",
    "lat": 0.0349,
    "lng": 110.9507,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14167",
    "code": "6107",
    "name": "Kab. Sintang",
    "province": "Kalimantan Barat",
    "lat": -0.0833,
    "lng": 112.0833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14168",
    "code": "6171",
    "name": "Pontianak",
    "province": "Kalimantan Barat",
    "lat": -0.0519,
    "lng": 109.354,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14169",
    "code": "6172",
    "name": "Singkawang",
    "province": "Kalimantan Barat",
    "lat": 0.9,
    "lng": 108.9833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14181",
    "code": "6372",
    "name": "Banjarbaru",
    "province": "Kalimantan Selatan",
    "lat": -3.4389,
    "lng": 114.8309,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14182",
    "code": "6371",
    "name": "Banjarmasin",
    "province": "Kalimantan Selatan",
    "lat": -3.3144,
    "lng": 114.5923,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14170",
    "code": "6311",
    "name": "Kab. Balangan",
    "province": "Kalimantan Selatan",
    "lat": -2.364,
    "lng": 115.4705,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14171",
    "code": "6303",
    "name": "Kab. Banjar",
    "province": "Kalimantan Selatan",
    "lat": -3.4081,
    "lng": 114.8485,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14172",
    "code": "6304",
    "name": "Kab. Barito Kuala",
    "province": "Kalimantan Selatan",
    "lat": -2.9811,
    "lng": 114.7668,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14176",
    "code": "6306",
    "name": "Kab. Hulu Sungai Selatan",
    "province": "Kalimantan Selatan",
    "lat": -2.7867,
    "lng": 115.2659,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14173",
    "code": "6307",
    "name": "Kab. Hulu Sungai Tengah",
    "province": "Kalimantan Selatan",
    "lat": -2.5847,
    "lng": 115.3852,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14175",
    "code": "6308",
    "name": "Kab. Hulu Sungai Utara",
    "province": "Kalimantan Selatan",
    "lat": -2.4193,
    "lng": 115.2543,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14174",
    "code": "6302",
    "name": "Kab. Kotabaru",
    "province": "Kalimantan Selatan",
    "lat": -3,
    "lng": 116,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14177",
    "code": "6309",
    "name": "Kab. Tabalong",
    "province": "Kalimantan Selatan",
    "lat": -2.1647,
    "lng": 115.3822,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14179",
    "code": "6310",
    "name": "Kab. Tanah Bumbu",
    "province": "Kalimantan Selatan",
    "lat": -3.4836,
    "lng": 115.9479,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14178",
    "code": "6301",
    "name": "Kab. Tanah Laut",
    "province": "Kalimantan Selatan",
    "lat": -3.7997,
    "lng": 114.7826,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14180",
    "code": "6305",
    "name": "Kab. Tapin",
    "province": "Kalimantan Selatan",
    "lat": -2.9309,
    "lng": 115.1567,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14391",
    "code": "6204",
    "name": "Kab. Barito Selatan",
    "province": "Kalimantan Tengah",
    "lat": -1.8667,
    "lng": 114.7333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14190",
    "code": "6212",
    "name": "Kab. Barito Timur",
    "province": "Kalimantan Tengah",
    "lat": -1.9333,
    "lng": 115.1,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14209",
    "code": "6205",
    "name": "Kab. Barito Utara",
    "province": "Kalimantan Tengah",
    "lat": -0.9833,
    "lng": 115.1,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14192",
    "code": "6211",
    "name": "Kab. Gunung Mas",
    "province": "Kalimantan Tengah",
    "lat": -0.95,
    "lng": 113.5,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14193",
    "code": "6203",
    "name": "Kab. Kapuas",
    "province": "Kalimantan Tengah",
    "lat": -3,
    "lng": 114.38,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q4201892",
    "code": "6209",
    "name": "Kab. Katingan",
    "province": "Kalimantan Tengah",
    "lat": -2.0667,
    "lng": 113.4,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14393",
    "code": "6201",
    "name": "Kab. Kotawaringin Barat",
    "province": "Kalimantan Tengah",
    "lat": -2.4,
    "lng": 111.7333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14191",
    "code": "6202",
    "name": "Kab. Kotawaringin Timur",
    "province": "Kalimantan Tengah",
    "lat": -2.0833,
    "lng": 112.75,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14194",
    "code": "6207",
    "name": "Kab. Lamandau",
    "province": "Kalimantan Tengah",
    "lat": -1.8383,
    "lng": 111.2869,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14195",
    "code": "6213",
    "name": "Kab. Murung Raya",
    "province": "Kalimantan Tengah",
    "lat": -1.4083,
    "lng": 115.1333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14385",
    "code": "6210",
    "name": "Kab. Pulang Pisau",
    "province": "Kalimantan Tengah",
    "lat": -3.1186,
    "lng": 113.8623,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14389",
    "code": "6208",
    "name": "Kab. Seruyan",
    "province": "Kalimantan Tengah",
    "lat": -2.3333,
    "lng": 112.25,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14386",
    "code": "6206",
    "name": "Kab. Sukamara",
    "province": "Kalimantan Tengah",
    "lat": -2.6267,
    "lng": 111.2368,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14409",
    "code": "6271",
    "name": "Palangka Raya",
    "province": "Kalimantan Tengah",
    "lat": -2.21,
    "lng": 113.92,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q14492",
    "code": "6471",
    "name": "Balikpapan",
    "province": "Kalimantan Timur",
    "lat": -1.2379,
    "lng": 116.8563,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14495",
    "code": "6474",
    "name": "Bontang",
    "province": "Kalimantan Timur",
    "lat": 0.1333,
    "lng": 117.5,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14395",
    "code": "6405",
    "name": "Kab. Berau",
    "province": "Kalimantan Timur",
    "lat": 2,
    "lng": 117.3,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14489",
    "code": "6402",
    "name": "Kab. Kutai Barat",
    "province": "Kalimantan Timur",
    "lat": -0.5117,
    "lng": 115.7772,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14473",
    "code": "6403",
    "name": "Kab. Kutai Kartanegara",
    "province": "Kalimantan Timur",
    "lat": -0.4402,
    "lng": 116.9814,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14468",
    "code": "6404",
    "name": "Kab. Kutai Timur",
    "province": "Kalimantan Timur",
    "lat": 1.0377,
    "lng": 117.8311,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q12488347",
    "code": "6411",
    "name": "Kab. Mahakam Ulu",
    "province": "Kalimantan Timur",
    "lat": 0.5,
    "lng": 115.28,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14485",
    "code": "6401",
    "name": "Kab. Paser",
    "province": "Kalimantan Timur",
    "lat": -1.4352,
    "lng": 116.2354,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14479",
    "code": "6409",
    "name": "Kab. Penajam Paser Utara",
    "province": "Kalimantan Timur",
    "lat": -1.2917,
    "lng": 116.5138,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14499",
    "code": "6472",
    "name": "Samarinda",
    "province": "Kalimantan Timur",
    "lat": -0.5022,
    "lng": 117.1536,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14404",
    "code": "6502",
    "name": "Kab. Bulungan",
    "province": "Kalimantan Utara",
    "lat": 3,
    "lng": 117.1667,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14476",
    "code": "6501",
    "name": "Kab. Malinau",
    "province": "Kalimantan Utara",
    "lat": 2.45,
    "lng": 115.6833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14481",
    "code": "6504",
    "name": "Kab. Nunukan",
    "province": "Kalimantan Utara",
    "lat": 4.1333,
    "lng": 116.7,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14487",
    "code": "6503",
    "name": "Kab. Tana Tidung",
    "province": "Kalimantan Utara",
    "lat": 3.55,
    "lng": 117.25,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q976062",
    "code": null,
    "name": "Tanjung Selor",
    "province": "Kalimantan Utara",
    "lat": 2.8358,
    "lng": 117.3927,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14501",
    "code": "6571",
    "name": "Tarakan",
    "province": "Kalimantan Utara",
    "lat": 3.3,
    "lng": 117.6333,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q8163",
    "code": "1901",
    "name": "Kab. Bangka",
    "province": "Kepulauan Bangka Belitung",
    "lat": -1.9,
    "lng": 105.8833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8176",
    "code": "1903",
    "name": "Kab. Bangka Barat",
    "province": "Kepulauan Bangka Belitung",
    "lat": -1.9584,
    "lng": 105.5374,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8173",
    "code": "1905",
    "name": "Kab. Bangka Selatan",
    "province": "Kepulauan Bangka Belitung",
    "lat": -2.7667,
    "lng": 106.3333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8166",
    "code": "1904",
    "name": "Kab. Bangka Tengah",
    "province": "Kepulauan Bangka Belitung",
    "lat": -2.4167,
    "lng": 106.2333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8164",
    "code": "1902",
    "name": "Kab. Belitung",
    "province": "Kepulauan Bangka Belitung",
    "lat": -2.8667,
    "lng": 107.7,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8169",
    "code": "1906",
    "name": "Kab. Belitung Timur",
    "province": "Kepulauan Bangka Belitung",
    "lat": -2.9,
    "lng": 108.05,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8179",
    "code": "1971",
    "name": "Pangkal Pinang",
    "province": "Kepulauan Bangka Belitung",
    "lat": -2.1,
    "lng": 106.1,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10103",
    "code": "2171",
    "name": "Batam",
    "province": "Kepulauan Riau",
    "lat": 1.13,
    "lng": 104.0531,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10097",
    "code": "2102",
    "name": "Kab. Bintan",
    "province": "Kepulauan Riau",
    "lat": 0.95,
    "lng": 104.6194,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10098",
    "code": "2101",
    "name": "Kab. Karimun",
    "province": "Kepulauan Riau",
    "lat": 0.8076,
    "lng": 103.4191,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q26759674",
    "code": "2105",
    "name": "Kab. Kepulauan Anambas",
    "province": "Kepulauan Riau",
    "lat": 3,
    "lng": 106,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10099",
    "code": "2104",
    "name": "Kab. Lingga",
    "province": "Kepulauan Riau",
    "lat": -0.2667,
    "lng": 104.4833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10100",
    "code": "2103",
    "name": "Kab. Natuna",
    "province": "Kepulauan Riau",
    "lat": 4,
    "lng": 108.25,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q10104",
    "code": "2172",
    "name": "Tanjungpinang",
    "province": "Kepulauan Riau",
    "lat": 0.9188,
    "lng": 104.4554,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8156",
    "code": "1871",
    "name": "Bandar Lampung",
    "province": "Lampung",
    "lat": -5.4294,
    "lng": 105.2625,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8153",
    "code": "1801",
    "name": "Kab. Lampung Barat",
    "province": "Lampung",
    "lat": -5.149,
    "lng": 104.1931,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8147",
    "code": "1803",
    "name": "Kab. Lampung Selatan",
    "province": "Lampung",
    "lat": -5.5624,
    "lng": 105.5475,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8135",
    "code": "1805",
    "name": "Kab. Lampung Tengah",
    "province": "Lampung",
    "lat": -4.8667,
    "lng": 105.2667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8136",
    "code": "1804",
    "name": "Kab. Lampung Timur",
    "province": "Lampung",
    "lat": -5.1027,
    "lng": 105.68,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8140",
    "code": "1806",
    "name": "Kab. Lampung Utara",
    "province": "Lampung",
    "lat": -4.8167,
    "lng": 104.8,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8139",
    "code": "1811",
    "name": "Kab. Mesuji",
    "province": "Lampung",
    "lat": -4.0439,
    "lng": 105.4013,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8144",
    "code": "1809",
    "name": "Kab. Pesawaran",
    "province": "Lampung",
    "lat": -5.4298,
    "lng": 105.179,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q46481",
    "code": "1813",
    "name": "Kab. Pesisir Barat",
    "province": "Lampung",
    "lat": -5.1888,
    "lng": 103.9359,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8145",
    "code": "1810",
    "name": "Kab. Pringsewu",
    "province": "Lampung",
    "lat": -5.4221,
    "lng": 104.9345,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8149",
    "code": "1802",
    "name": "Kab. Tanggamus",
    "province": "Lampung",
    "lat": -5.4815,
    "lng": 104.6824,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8151",
    "code": "1808",
    "name": "Kab. Tulang Bawang",
    "province": "Lampung",
    "lat": -4.206,
    "lng": 105.58,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8154",
    "code": "1812",
    "name": "Kab. Tulang Bawang Barat",
    "province": "Lampung",
    "lat": -4.4397,
    "lng": 105.0444,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8152",
    "code": "1807",
    "name": "Kab. Way Kanan",
    "province": "Lampung",
    "lat": -4.447,
    "lng": 104.5275,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8158",
    "code": "1872",
    "name": "Metro",
    "province": "Lampung",
    "lat": -5.1167,
    "lng": 105.3,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q18970",
    "code": "8171",
    "name": "Ambon",
    "province": "Maluku",
    "lat": -3.6967,
    "lng": 128.1783,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q16564",
    "code": "8104",
    "name": "Kab. Buru",
    "province": "Maluku",
    "lat": -3.2598,
    "lng": 127.1029,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q16583",
    "code": "8109",
    "name": "Kab. Buru Selatan",
    "province": "Maluku",
    "lat": -3.8381,
    "lng": 126.7346,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q16561",
    "code": "8105",
    "name": "Kab. Kepulauan Aru",
    "province": "Maluku",
    "lat": -6.2,
    "lng": 134.5,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q18961",
    "code": "8101",
    "name": "Kab. Kepulauan Tanimbar",
    "province": "Maluku",
    "lat": -7.9849,
    "lng": 131.3044,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q18935",
    "code": "8108",
    "name": "Kab. Maluku Barat Daya",
    "province": "Maluku",
    "lat": -8.1702,
    "lng": 127.7889,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q4201768",
    "code": "8103",
    "name": "Kab. Maluku Tengah",
    "province": "Maluku",
    "lat": -3.2997,
    "lng": 128.9565,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q18849",
    "code": "8102",
    "name": "Kab. Maluku Tenggara",
    "province": "Maluku",
    "lat": -5.656,
    "lng": 132.744,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q18942",
    "code": "8106",
    "name": "Kab. Seram Bagian Barat",
    "province": "Maluku",
    "lat": -3.0691,
    "lng": 128.2029,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q16569",
    "code": "8107",
    "name": "Kab. Seram Bagian Timur",
    "province": "Maluku",
    "lat": -3.1031,
    "lng": 130.4908,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q18975",
    "code": "8172",
    "name": "Tual",
    "province": "Maluku",
    "lat": -5.6426,
    "lng": 132.743,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19150",
    "code": "8201",
    "name": "Kab. Halmahera Barat",
    "province": "Maluku Utara",
    "lat": 1.4171,
    "lng": 127.5526,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19148",
    "code": "8204",
    "name": "Kab. Halmahera Selatan",
    "province": "Maluku Utara",
    "lat": -0.3955,
    "lng": 127.9083,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19144",
    "code": "8202",
    "name": "Kab. Halmahera Tengah",
    "province": "Maluku Utara",
    "lat": 0.4806,
    "lng": 128.25,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19145",
    "code": "8206",
    "name": "Kab. Halmahera Timur",
    "province": "Maluku Utara",
    "lat": 1.3352,
    "lng": 128.4863,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19147",
    "code": "8205",
    "name": "Kab. Halmahera Utara",
    "province": "Maluku Utara",
    "lat": 1.7319,
    "lng": 128.0078,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19149",
    "code": "8203",
    "name": "Kab. Kepulauan Sula",
    "province": "Maluku Utara",
    "lat": -1.8492,
    "lng": 125.3144,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q17053892",
    "code": "8207",
    "name": "Kab. Pulau Morotai",
    "province": "Maluku Utara",
    "lat": 2.3,
    "lng": 128.4,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q676084",
    "code": "8208",
    "name": "Kab. Pulau Taliabu",
    "province": "Maluku Utara",
    "lat": -1.8,
    "lng": 124.8,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q1350702",
    "code": null,
    "name": "Sofifi",
    "province": "Maluku Utara",
    "lat": 0.7244,
    "lng": 127.5806,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19151",
    "code": "8271",
    "name": "Ternate",
    "province": "Maluku Utara",
    "lat": 0.7833,
    "lng": 127.3667,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q19153",
    "code": "8272",
    "name": "Tidore Kepulauan",
    "province": "Maluku Utara",
    "lat": 0.6094,
    "lng": 127.5697,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q14128",
    "code": "5272",
    "name": "Bima",
    "province": "Nusa Tenggara Barat",
    "lat": -8.46,
    "lng": 118.7267,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14114",
    "code": "5206",
    "name": "Kab. Bima",
    "province": "Nusa Tenggara Barat",
    "lat": -8.5744,
    "lng": 119.0375,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14117",
    "code": "5205",
    "name": "Kab. Dompu",
    "province": "Nusa Tenggara Barat",
    "lat": -8.5333,
    "lng": 118.4667,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14123",
    "code": "5201",
    "name": "Kab. Lombok Barat",
    "province": "Nusa Tenggara Barat",
    "lat": -8.7167,
    "lng": 116.1167,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14119",
    "code": "5202",
    "name": "Kab. Lombok Tengah",
    "province": "Nusa Tenggara Barat",
    "lat": -8.7,
    "lng": 116.2667,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14115",
    "code": "5203",
    "name": "Kab. Lombok Timur",
    "province": "Nusa Tenggara Barat",
    "lat": -8.65,
    "lng": 116.5333,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14121",
    "code": "5208",
    "name": "Kab. Lombok Utara",
    "province": "Nusa Tenggara Barat",
    "lat": -8.35,
    "lng": 116.15,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14122",
    "code": "5204",
    "name": "Kab. Sumbawa",
    "province": "Nusa Tenggara Barat",
    "lat": -8.7448,
    "lng": 117.6715,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14124",
    "code": "5207",
    "name": "Kab. Sumbawa Barat",
    "province": "Nusa Tenggara Barat",
    "lat": -8.7874,
    "lng": 116.926,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14126",
    "code": "5271",
    "name": "Mataram",
    "province": "Nusa Tenggara Barat",
    "lat": -8.5833,
    "lng": 116.1167,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14131",
    "code": "5307",
    "name": "Kab. Alor",
    "province": "Nusa Tenggara Timur",
    "lat": -8.25,
    "lng": 124.75,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14133",
    "code": "5306",
    "name": "Kab. Belu",
    "province": "Nusa Tenggara Timur",
    "lat": -9.1,
    "lng": 124.9,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14140",
    "code": "5311",
    "name": "Kab. Ende",
    "province": "Nusa Tenggara Timur",
    "lat": -8.8406,
    "lng": 121.6639,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14136",
    "code": "5309",
    "name": "Kab. Flores Timur",
    "province": "Nusa Tenggara Timur",
    "lat": -8.3412,
    "lng": 122.9881,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14141",
    "code": "5303",
    "name": "Kab. Kupang",
    "province": "Nusa Tenggara Timur",
    "lat": -10.1636,
    "lng": 123.5903,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14142",
    "code": "5308",
    "name": "Kab. Lembata",
    "province": "Nusa Tenggara Timur",
    "lat": -8.414,
    "lng": 123.5523,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q4069046",
    "code": "5321",
    "name": "Kab. Malaka",
    "province": "Nusa Tenggara Timur",
    "lat": -9.5672,
    "lng": 124.9075,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14143",
    "code": "5313",
    "name": "Kab. Manggarai",
    "province": "Nusa Tenggara Timur",
    "lat": -8.6127,
    "lng": 120.4626,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14153",
    "code": "5315",
    "name": "Kab. Manggarai Barat",
    "province": "Nusa Tenggara Timur",
    "lat": -8.6448,
    "lng": 119.8828,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14137",
    "code": "5319",
    "name": "Kab. Manggarai Timur",
    "province": "Nusa Tenggara Timur",
    "lat": -8.75,
    "lng": 120.6086,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14144",
    "code": "5318",
    "name": "Kab. Nagekeo",
    "province": "Nusa Tenggara Timur",
    "lat": -8.8721,
    "lng": 121.2096,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14145",
    "code": "5312",
    "name": "Kab. Ngada",
    "province": "Nusa Tenggara Timur",
    "lat": -8.6667,
    "lng": 121,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14147",
    "code": "5314",
    "name": "Kab. Rote Ndao",
    "province": "Nusa Tenggara Timur",
    "lat": -10.4667,
    "lng": 123.3833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14148",
    "code": "5320",
    "name": "Kab. Sabu Raijua",
    "province": "Nusa Tenggara Timur",
    "lat": -10.5629,
    "lng": 121.7889,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14150",
    "code": "5310",
    "name": "Kab. Sikka",
    "province": "Nusa Tenggara Timur",
    "lat": -8.6164,
    "lng": 122.2081,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14154",
    "code": "5301",
    "name": "Kab. Sumba Barat",
    "province": "Nusa Tenggara Timur",
    "lat": -9.5667,
    "lng": 119.45,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14152",
    "code": "5317",
    "name": "Kab. Sumba Barat Daya",
    "province": "Nusa Tenggara Timur",
    "lat": -9.5622,
    "lng": 119.0891,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14134",
    "code": "5316",
    "name": "Kab. Sumba Tengah",
    "province": "Nusa Tenggara Timur",
    "lat": -9.6294,
    "lng": 119.6191,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14139",
    "code": "5302",
    "name": "Kab. Sumba Timur",
    "province": "Nusa Tenggara Timur",
    "lat": -9.8833,
    "lng": 120.25,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14151",
    "code": "5304",
    "name": "Kab. Timor Tengah Selatan",
    "province": "Nusa Tenggara Timur",
    "lat": -9.4717,
    "lng": 124.8047,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14146",
    "code": "5305",
    "name": "Kab. Timor Tengah Utara",
    "province": "Nusa Tenggara Timur",
    "lat": -9.4467,
    "lng": 124.4781,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14155",
    "code": "5371",
    "name": "Kupang",
    "province": "Nusa Tenggara Timur",
    "lat": -10.1633,
    "lng": 123.5778,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q27860",
    "code": "9471",
    "name": "Jayapura",
    "province": "Papua",
    "lat": -2.5425,
    "lng": 140.7045,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27246",
    "code": "9409",
    "name": "Kab. Biak Numfor",
    "province": "Papua",
    "lat": -1.0333,
    "lng": 136,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27477",
    "code": "9403",
    "name": "Kab. Jayapura",
    "province": "Papua",
    "lat": -3,
    "lng": 139.95,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27573",
    "code": "9420",
    "name": "Kab. Keerom",
    "province": "Papua",
    "lat": -2.8837,
    "lng": 140.7436,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27848",
    "code": "9408",
    "name": "Kab. Kepulauan Yapen",
    "province": "Papua",
    "lat": -1.7877,
    "lng": 136.2772,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27668",
    "code": "9428",
    "name": "Kab. Mamberamo Raya",
    "province": "Papua",
    "lat": -2.2356,
    "lng": 137.7823,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27784",
    "code": "9419",
    "name": "Kab. Sarmi",
    "province": "Papua",
    "lat": -2.4167,
    "lng": 139.0833,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27793",
    "code": "9427",
    "name": "Kab. Supiori",
    "province": "Papua",
    "lat": -0.7333,
    "lng": 135.583,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27815",
    "code": "9426",
    "name": "Kab. Waropen",
    "province": "Papua",
    "lat": -2.286,
    "lng": 137.0184,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26727",
    "code": "9101",
    "name": "Kab. Fakfak",
    "province": "Papua Barat",
    "lat": -2.9167,
    "lng": 132.3,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26739",
    "code": "9102",
    "name": "Kab. Kaimana",
    "province": "Papua Barat",
    "lat": -3.6609,
    "lng": 133.7745,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26748",
    "code": "9105",
    "name": "Kab. Manokwari",
    "province": "Papua Barat",
    "lat": -0.8629,
    "lng": 134.064,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q12488351",
    "code": "9111",
    "name": "Kab. Manokwari Selatan",
    "province": "Papua Barat",
    "lat": -1.0798,
    "lng": 133.9673,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q16251650",
    "code": "9112",
    "name": "Kab. Pegunungan Arfak",
    "province": "Papua Barat",
    "lat": -0.9352,
    "lng": 133.8959,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26819",
    "code": "9104",
    "name": "Kab. Teluk Bintuni",
    "province": "Papua Barat",
    "lat": -1.8804,
    "lng": 133.3311,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26827",
    "code": "9103",
    "name": "Kab. Teluk Wondama",
    "province": "Papua Barat",
    "lat": -2.7,
    "lng": 134.5,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26759",
    "code": "9110",
    "name": "Kab. Maybrat",
    "province": "Papua Barat Daya",
    "lat": -1.2155,
    "lng": 132.3509,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26785",
    "code": "9108",
    "name": "Kab. Raja Ampat",
    "province": "Papua Barat Daya",
    "lat": -0.5,
    "lng": 130,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26792",
    "code": "9107",
    "name": "Kab. Sorong",
    "province": "Papua Barat Daya",
    "lat": -1.1,
    "lng": 131.5167,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26802",
    "code": "9106",
    "name": "Kab. Sorong Selatan",
    "province": "Papua Barat Daya",
    "lat": -1.5049,
    "lng": 132.2864,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26810",
    "code": "9109",
    "name": "Kab. Tambrauw",
    "province": "Papua Barat Daya",
    "lat": -0.6051,
    "lng": 132.4896,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q26837",
    "code": "9171",
    "name": "Sorong",
    "province": "Papua Barat Daya",
    "lat": -0.8796,
    "lng": 131.261,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27529",
    "code": "9402",
    "name": "Kab. Jayawijaya",
    "province": "Papua Pegunungan",
    "lat": -4.0833,
    "lng": 139.0833,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27594",
    "code": "9430",
    "name": "Kab. Lanny Jaya",
    "province": "Papua Pegunungan",
    "lat": -3.9125,
    "lng": 138.2878,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27316",
    "code": "9431",
    "name": "Kab. Mamberamo Tengah",
    "province": "Papua Pegunungan",
    "lat": -3.8833,
    "lng": 139.1667,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27724",
    "code": "9429",
    "name": "Kab. Nduga",
    "province": "Papua Pegunungan",
    "lat": -4.4509,
    "lng": 138.1009,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27750",
    "code": "9417",
    "name": "Kab. Pegunungan Bintang",
    "province": "Papua Pegunungan",
    "lat": -4.5217,
    "lng": 140.2954,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27802",
    "code": "9418",
    "name": "Kab. Tolikara",
    "province": "Papua Pegunungan",
    "lat": -3.4667,
    "lng": 138.6167,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27825",
    "code": "9416",
    "name": "Kab. Yahukimo",
    "province": "Papua Pegunungan",
    "lat": -4.887,
    "lng": 139.52,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27838",
    "code": "9432",
    "name": "Kab. Yalimo",
    "province": "Papua Pegunungan",
    "lat": -3.785,
    "lng": 139.447,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q2307531",
    "code": null,
    "name": "Wamena",
    "province": "Papua Pegunungan",
    "lat": -4.0975,
    "lng": 138.9511,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27228",
    "code": "9415",
    "name": "Kab. Asmat",
    "province": "Papua Selatan",
    "lat": -5.3795,
    "lng": 138.4634,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27262",
    "code": "9413",
    "name": "Kab. Boven Digoel",
    "province": "Papua Selatan",
    "lat": -6,
    "lng": 140,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27679",
    "code": "9414",
    "name": "Kab. Mappi",
    "province": "Papua Selatan",
    "lat": -6.4997,
    "lng": 139.3444,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27693",
    "code": "9401",
    "name": "Kab. Merauke",
    "province": "Papua Selatan",
    "lat": -7.6667,
    "lng": 139.6667,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27386",
    "code": "9436",
    "name": "Kab. Deiyai",
    "province": "Papua Tengah",
    "lat": -4.1003,
    "lng": 136.4351,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27413",
    "code": "9434",
    "name": "Kab. Dogiyai",
    "province": "Papua Tengah",
    "lat": -4.057,
    "lng": 135.709,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27458",
    "code": "9435",
    "name": "Kab. Intan Jaya",
    "province": "Papua Tengah",
    "lat": -3.4102,
    "lng": 136.7084,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27700",
    "code": "9412",
    "name": "Kab. Mimika",
    "province": "Papua Tengah",
    "lat": -4.5436,
    "lng": 136.5656,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27708",
    "code": "9404",
    "name": "Kab. Nabire",
    "province": "Papua Tengah",
    "lat": -3.5402,
    "lng": 135.5551,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27738",
    "code": "9410",
    "name": "Kab. Paniai",
    "province": "Papua Tengah",
    "lat": -3.9,
    "lng": 136.6,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27761",
    "code": "9433",
    "name": "Kab. Puncak",
    "province": "Papua Tengah",
    "lat": -4.142,
    "lng": 137.097,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q27771",
    "code": "9411",
    "name": "Kab. Puncak Jaya",
    "province": "Papua Tengah",
    "lat": -3.5107,
    "lng": 137.8661,
    "timeZone": "Asia/Jayapura"
  },
  {
    "id": "Q7782",
    "code": "1473",
    "name": "Dumai",
    "province": "Riau",
    "lat": 1.6667,
    "lng": 101.45,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7594",
    "code": "1408",
    "name": "Kab. Bengkalis",
    "province": "Riau",
    "lat": 1.4897,
    "lng": 102.0797,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7599",
    "code": "1403",
    "name": "Kab. Indragiri Hilir",
    "province": "Riau",
    "lat": -0.3156,
    "lng": 103.1581,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7605",
    "code": "1402",
    "name": "Kab. Indragiri Hulu",
    "province": "Riau",
    "lat": -0.55,
    "lng": 102.3167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7613",
    "code": "1406",
    "name": "Kab. Kampar",
    "province": "Riau",
    "lat": 0.3136,
    "lng": 101.0185,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7630",
    "code": "1410",
    "name": "Kab. Kepulauan Meranti",
    "province": "Riau",
    "lat": 0.9749,
    "lng": 102.6954,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7626",
    "code": "1401",
    "name": "Kab. Kuantan Singingi",
    "province": "Riau",
    "lat": -0.4753,
    "lng": 101.4586,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7641",
    "code": "1404",
    "name": "Kab. Pelalawan",
    "province": "Riau",
    "lat": 0.2082,
    "lng": 102.1861,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7759",
    "code": "1409",
    "name": "Kab. Rokan Hilir",
    "province": "Riau",
    "lat": 2.166,
    "lng": 100.8251,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7744",
    "code": "1407",
    "name": "Kab. Rokan Hulu",
    "province": "Riau",
    "lat": 0.9333,
    "lng": 100.5,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7777",
    "code": "1405",
    "name": "Kab. Siak",
    "province": "Riau",
    "lat": 0.9744,
    "lng": 102.0133,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7786",
    "code": "1471",
    "name": "Pekanbaru",
    "province": "Riau",
    "lat": 0.5333,
    "lng": 101.45,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q15344",
    "code": "7601",
    "name": "Kab. Majene",
    "province": "Sulawesi Barat",
    "lat": -3.5475,
    "lng": 118.9579,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15347",
    "code": "7603",
    "name": "Kab. Mamasa",
    "province": "Sulawesi Barat",
    "lat": -3.1131,
    "lng": 119.383,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15349",
    "code": "7604",
    "name": "Kab. Mamuju",
    "province": "Sulawesi Barat",
    "lat": -2.6833,
    "lng": 118.9,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q12488349",
    "code": "7606",
    "name": "Kab. Mamuju Tengah",
    "province": "Sulawesi Barat",
    "lat": -2.0901,
    "lng": 119.4881,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15350",
    "code": "7605",
    "name": "Kab. Pasangkayu",
    "province": "Sulawesi Barat",
    "lat": -1.3181,
    "lng": 119.3751,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15353",
    "code": "7602",
    "name": "Kab. Polewali Mandar",
    "province": "Sulawesi Barat",
    "lat": -3.4133,
    "lng": 119.325,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14590",
    "code": "7303",
    "name": "Kab. Bantaeng",
    "province": "Sulawesi Selatan",
    "lat": -5.5333,
    "lng": 119.933,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14593",
    "code": "7310",
    "name": "Kab. Barru",
    "province": "Sulawesi Selatan",
    "lat": -3.2433,
    "lng": 119.681,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14595",
    "code": "7311",
    "name": "Kab. Bone",
    "province": "Sulawesi Selatan",
    "lat": -4.5386,
    "lng": 120.3297,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14596",
    "code": "7302",
    "name": "Kab. Bulukumba",
    "province": "Sulawesi Selatan",
    "lat": -5.4167,
    "lng": 120.2333,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14599",
    "code": "7316",
    "name": "Kab. Enrekang",
    "province": "Sulawesi Selatan",
    "lat": -3.5,
    "lng": 119.8667,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14601",
    "code": "7306",
    "name": "Kab. Gowa",
    "province": "Sulawesi Selatan",
    "lat": -5.3333,
    "lng": 119.6667,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14602",
    "code": "7304",
    "name": "Kab. Jeneponto",
    "province": "Sulawesi Selatan",
    "lat": -5.6333,
    "lng": 119.7333,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14619",
    "code": "7301",
    "name": "Kab. Kepulauan Selayar",
    "province": "Sulawesi Selatan",
    "lat": -6.8167,
    "lng": 120.8,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14604",
    "code": "7317",
    "name": "Kab. Luwu",
    "province": "Sulawesi Selatan",
    "lat": -3.3483,
    "lng": 120.2211,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14597",
    "code": "7325",
    "name": "Kab. Luwu Timur",
    "province": "Sulawesi Selatan",
    "lat": -2.5319,
    "lng": 121.1231,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14606",
    "code": "7322",
    "name": "Kab. Luwu Utara",
    "province": "Sulawesi Selatan",
    "lat": -2.6,
    "lng": 120.25,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14611",
    "code": "7308",
    "name": "Kab. Maros",
    "province": "Sulawesi Selatan",
    "lat": -5.0165,
    "lng": 119.5745,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14613",
    "code": "7309",
    "name": "Kab. Pangkajene dan Kepulauan",
    "province": "Sulawesi Selatan",
    "lat": -4.75,
    "lng": 119.5,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14615",
    "code": "7315",
    "name": "Kab. Pinrang",
    "province": "Sulawesi Selatan",
    "lat": -3.7833,
    "lng": 119.633,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q11214749",
    "code": "7314",
    "name": "Kab. Sidenreng Rappang",
    "province": "Sulawesi Selatan",
    "lat": -3.9269,
    "lng": 119.796,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14622",
    "code": "7307",
    "name": "Kab. Sinjai",
    "province": "Sulawesi Selatan",
    "lat": -5.1993,
    "lng": 120.1544,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14629",
    "code": "7312",
    "name": "Kab. Soppeng",
    "province": "Sulawesi Selatan",
    "lat": -4.3486,
    "lng": 119.8825,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14630",
    "code": "7305",
    "name": "Kab. Takalar",
    "province": "Sulawesi Selatan",
    "lat": -5.4167,
    "lng": 119.5833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14632",
    "code": "7318",
    "name": "Kab. Tana Toraja",
    "province": "Sulawesi Selatan",
    "lat": -3.1667,
    "lng": 119.75,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14609",
    "code": "7326",
    "name": "Kab. Toraja Utara",
    "province": "Sulawesi Selatan",
    "lat": -2.9272,
    "lng": 119.7919,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14633",
    "code": "7313",
    "name": "Kab. Wajo",
    "province": "Sulawesi Selatan",
    "lat": -4.1264,
    "lng": 120.0319,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14634",
    "code": "7371",
    "name": "Makassar",
    "province": "Sulawesi Selatan",
    "lat": -5.1331,
    "lng": 119.4136,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14635",
    "code": "7373",
    "name": "Palopo",
    "province": "Sulawesi Selatan",
    "lat": -3,
    "lng": 120.2,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q14636",
    "code": "7372",
    "name": "Parepare",
    "province": "Sulawesi Selatan",
    "lat": -4.0167,
    "lng": 119.6236,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15810",
    "code": "7202",
    "name": "Kab. Banggai",
    "province": "Sulawesi Tengah",
    "lat": -0.9571,
    "lng": 122.5586,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15812",
    "code": "7201",
    "name": "Kab. Banggai Kepulauan",
    "province": "Sulawesi Tengah",
    "lat": -1.4086,
    "lng": 123.2064,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q12488339",
    "code": "7211",
    "name": "Kab. Banggai Laut",
    "province": "Sulawesi Tengah",
    "lat": -1.5888,
    "lng": 123.5008,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15813",
    "code": "7207",
    "name": "Kab. Buol",
    "province": "Sulawesi Tengah",
    "lat": 1.0105,
    "lng": 121.3543,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15814",
    "code": "7205",
    "name": "Kab. Donggala",
    "province": "Sulawesi Tengah",
    "lat": -0.6944,
    "lng": 119.7306,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15815",
    "code": "7203",
    "name": "Kab. Morowali",
    "province": "Sulawesi Tengah",
    "lat": -2.8185,
    "lng": 121.8608,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q12488353",
    "code": "7212",
    "name": "Kab. Morowali Utara",
    "province": "Sulawesi Tengah",
    "lat": -1.7207,
    "lng": 121.2465,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15816",
    "code": "7208",
    "name": "Kab. Parigi Moutong",
    "province": "Sulawesi Tengah",
    "lat": 0.3368,
    "lng": 120.1784,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15817",
    "code": "7204",
    "name": "Kab. Poso",
    "province": "Sulawesi Tengah",
    "lat": -1.4,
    "lng": 120.75,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15822",
    "code": "7210",
    "name": "Kab. Sigi",
    "province": "Sulawesi Tengah",
    "lat": -1.385,
    "lng": 119.967,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15823",
    "code": "7209",
    "name": "Kab. Tojo Una-Una",
    "province": "Sulawesi Tengah",
    "lat": -0.8756,
    "lng": 121.63,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15824",
    "code": "7206",
    "name": "Kab. Toli-Toli",
    "province": "Sulawesi Tengah",
    "lat": 1.0386,
    "lng": 120.818,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15826",
    "code": "7271",
    "name": "Palu",
    "province": "Sulawesi Tengah",
    "lat": -0.895,
    "lng": 119.8594,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15378",
    "code": "7472",
    "name": "Bau Bau",
    "province": "Sulawesi Tenggara",
    "lat": -5.4622,
    "lng": 122.6058,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15356",
    "code": "7406",
    "name": "Kab. Bombana",
    "province": "Sulawesi Tenggara",
    "lat": -4.6256,
    "lng": 121.8164,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15357",
    "code": "7401",
    "name": "Kab. Buton",
    "province": "Sulawesi Tenggara",
    "lat": -5.3167,
    "lng": 122.5833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q19745612",
    "code": "7415",
    "name": "Kab. Buton Selatan",
    "province": "Sulawesi Tenggara",
    "lat": -5.5667,
    "lng": 122.7,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q19745487",
    "code": "7414",
    "name": "Kab. Buton Tengah",
    "province": "Sulawesi Tenggara",
    "lat": -5.3167,
    "lng": 122.3333,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15366",
    "code": "7409",
    "name": "Kab. Buton Utara",
    "province": "Sulawesi Tenggara",
    "lat": -5.0146,
    "lng": 122.9302,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15358",
    "code": "7404",
    "name": "Kab. Kolaka",
    "province": "Sulawesi Tenggara",
    "lat": -4.0492,
    "lng": 121.616,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15960838",
    "code": "7411",
    "name": "Kab. Kolaka Timur",
    "province": "Sulawesi Tenggara",
    "lat": -4.0181,
    "lng": 121.8617,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15369",
    "code": "7408",
    "name": "Kab. Kolaka Utara",
    "province": "Sulawesi Tenggara",
    "lat": -3.3372,
    "lng": 121.044,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15359",
    "code": "7403",
    "name": "Kab. Konawe",
    "province": "Sulawesi Tenggara",
    "lat": -3.9172,
    "lng": 122.0882,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15730145",
    "code": "7412",
    "name": "Kab. Konawe Kepulauan",
    "province": "Sulawesi Tenggara",
    "lat": -4.1166,
    "lng": 123.1018,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15372",
    "code": "7405",
    "name": "Kab. Konawe Selatan",
    "province": "Sulawesi Tenggara",
    "lat": -3.4114,
    "lng": 122.02,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15370",
    "code": "7410",
    "name": "Kab. Konawe Utara",
    "province": "Sulawesi Tenggara",
    "lat": -3.4114,
    "lng": 122.02,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15363",
    "code": "7402",
    "name": "Kab. Muna",
    "province": "Sulawesi Tenggara",
    "lat": -4.8425,
    "lng": 122.648,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q19746428",
    "code": "7413",
    "name": "Kab. Muna Barat",
    "province": "Sulawesi Tenggara",
    "lat": -4.8333,
    "lng": 122.4833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15375",
    "code": "7407",
    "name": "Kab. Wakatobi",
    "province": "Sulawesi Tenggara",
    "lat": -5.3193,
    "lng": 123.5948,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15379",
    "code": "7471",
    "name": "Kendari",
    "province": "Sulawesi Tenggara",
    "lat": -3.9675,
    "lng": 122.5947,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15845",
    "code": "7172",
    "name": "Bitung",
    "province": "Sulawesi Utara",
    "lat": 1.4472,
    "lng": 125.1978,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15833",
    "code": "7101",
    "name": "Kab. Bolaang Mongondow",
    "province": "Sulawesi Utara",
    "lat": 0.75,
    "lng": 124.0833,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15841",
    "code": "7110",
    "name": "Kab. Bolaang Mongondow Selatan",
    "province": "Sulawesi Utara",
    "lat": 0.3528,
    "lng": 123.7992,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15834",
    "code": "7111",
    "name": "Kab. Bolaang Mongondow Timur",
    "province": "Sulawesi Utara",
    "lat": 0.77,
    "lng": 124.6139,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15837",
    "code": "7107",
    "name": "Kab. Bolaang Mongondow Utara",
    "province": "Sulawesi Utara",
    "lat": 0.7853,
    "lng": 123.4177,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15839",
    "code": "7103",
    "name": "Kab. Kepulauan Sangihe",
    "province": "Sulawesi Utara",
    "lat": 3,
    "lng": 125.5,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15840",
    "code": "7108",
    "name": "Kab. Kepulauan Siau Tagulandang Biaro",
    "province": "Sulawesi Utara",
    "lat": 2.35,
    "lng": 125.4167,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q17056608",
    "code": "7104",
    "name": "Kab. Kepulauan Talaud",
    "province": "Sulawesi Utara",
    "lat": 4.3118,
    "lng": 126.7809,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15836",
    "code": "7102",
    "name": "Kab. Minahasa",
    "province": "Sulawesi Utara",
    "lat": 1.2537,
    "lng": 124.83,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15842",
    "code": "7105",
    "name": "Kab. Minahasa Selatan",
    "province": "Sulawesi Utara",
    "lat": 0.5833,
    "lng": 124.3,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15843",
    "code": "7109",
    "name": "Kab. Minahasa Tenggara",
    "province": "Sulawesi Utara",
    "lat": 1.0563,
    "lng": 124.7925,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15838",
    "code": "7106",
    "name": "Kab. Minahasa Utara",
    "province": "Sulawesi Utara",
    "lat": 1.4025,
    "lng": 124.96,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15846",
    "code": "7174",
    "name": "Kotamobagu",
    "province": "Sulawesi Utara",
    "lat": 0.7333,
    "lng": 124.3167,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15847",
    "code": "7171",
    "name": "Manado",
    "province": "Sulawesi Utara",
    "lat": 1.4931,
    "lng": 124.8413,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q15848",
    "code": "7173",
    "name": "Tomohon",
    "province": "Sulawesi Utara",
    "lat": 1.3244,
    "lng": 124.8225,
    "timeZone": "Asia/Makassar"
  },
  {
    "id": "Q7248",
    "code": "1375",
    "name": "Bukittinggi",
    "province": "Sumatera Barat",
    "lat": -0.3097,
    "lng": 100.3753,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6019",
    "code": "1307",
    "name": "Kab. Agam",
    "province": "Sumatera Barat",
    "lat": -0.2667,
    "lng": 100,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6024",
    "code": "1311",
    "name": "Kab. Dharmasraya",
    "province": "Sumatera Barat",
    "lat": -1.05,
    "lng": 101.367,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6038",
    "code": "1301",
    "name": "Kab. Kepulauan Mentawai",
    "province": "Sumatera Barat",
    "lat": -2.1833,
    "lng": 99.65,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6032",
    "code": "1308",
    "name": "Kab. Lima Puluh Kota",
    "province": "Sumatera Barat",
    "lat": -0.0168,
    "lng": 100.5872,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6042",
    "code": "1306",
    "name": "Kab. Padang Pariaman",
    "province": "Sumatera Barat",
    "lat": -0.6,
    "lng": 100.2833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6048",
    "code": "1309",
    "name": "Kab. Pasaman",
    "province": "Sumatera Barat",
    "lat": 0.1667,
    "lng": 100.117,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6103",
    "code": "1312",
    "name": "Kab. Pasaman Barat",
    "province": "Sumatera Barat",
    "lat": 0.2815,
    "lng": 99.5197,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6065",
    "code": "1302",
    "name": "Kab. Pesisir Selatan",
    "province": "Sumatera Barat",
    "lat": -1.35,
    "lng": 100.567,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6055",
    "code": "1304",
    "name": "Kab. Sijunjung",
    "province": "Sumatera Barat",
    "lat": -0.7006,
    "lng": 100.9775,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6058",
    "code": "1303",
    "name": "Kab. Solok",
    "province": "Sumatera Barat",
    "lat": -0.9667,
    "lng": 100.8167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6083",
    "code": "1310",
    "name": "Kab. Solok Selatan",
    "province": "Sumatera Barat",
    "lat": -1.2333,
    "lng": 101.417,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q6093",
    "code": "1305",
    "name": "Kab. Tanah Datar",
    "province": "Sumatera Barat",
    "lat": -0.45,
    "lng": 100.583,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7253",
    "code": "1371",
    "name": "Padang",
    "province": "Sumatera Barat",
    "lat": -0.9556,
    "lng": 100.3606,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7256",
    "code": "1374",
    "name": "Padang Panjang",
    "province": "Sumatera Barat",
    "lat": -0.4644,
    "lng": 100.4008,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7258",
    "code": "1377",
    "name": "Pariaman",
    "province": "Sumatera Barat",
    "lat": -0.6261,
    "lng": 100.1206,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7261",
    "code": "1376",
    "name": "Payakumbuh",
    "province": "Sumatera Barat",
    "lat": -0.2244,
    "lng": 100.6325,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7263",
    "code": "1373",
    "name": "Sawahlunto",
    "province": "Sumatera Barat",
    "lat": -0.6828,
    "lng": 100.7783,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q7266",
    "code": "1372",
    "name": "Solok",
    "province": "Sumatera Barat",
    "lat": -0.7883,
    "lng": 100.6542,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8107",
    "code": "1607",
    "name": "Kab. Banyuasin",
    "province": "Sumatera Selatan",
    "lat": -2.8833,
    "lng": 104.3831,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8112",
    "code": "1611",
    "name": "Kab. Empat Lawang",
    "province": "Sumatera Selatan",
    "lat": -3.75,
    "lng": 103,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8117",
    "code": "1604",
    "name": "Kab. Lahat",
    "province": "Sumatera Selatan",
    "lat": -3.7864,
    "lng": 103.5428,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8119",
    "code": "1603",
    "name": "Kab. Muara Enim",
    "province": "Sumatera Selatan",
    "lat": -4.2327,
    "lng": 103.6141,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8120",
    "code": "1606",
    "name": "Kab. Musi Banyuasin",
    "province": "Sumatera Selatan",
    "lat": -2.8939,
    "lng": 103.8125,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8121",
    "code": "1605",
    "name": "Kab. Musi Rawas",
    "province": "Sumatera Selatan",
    "lat": -3.0833,
    "lng": 103.2,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q18511812",
    "code": "1613",
    "name": "Kab. Musi Rawas Utara",
    "province": "Sumatera Selatan",
    "lat": -2.7352,
    "lng": 102.9015,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8122",
    "code": "1610",
    "name": "Kab. Ogan Ilir",
    "province": "Sumatera Selatan",
    "lat": -3.4319,
    "lng": 104.6273,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8125",
    "code": "1602",
    "name": "Kab. Ogan Komering Ilir",
    "province": "Sumatera Selatan",
    "lat": -3.3667,
    "lng": 105.3667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8126",
    "code": "1601",
    "name": "Kab. Ogan Komering Ulu",
    "province": "Sumatera Selatan",
    "lat": -4.1333,
    "lng": 104.0333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8127",
    "code": "1608",
    "name": "Kab. Ogan Komering Ulu Selatan",
    "province": "Sumatera Selatan",
    "lat": -4.6573,
    "lng": 104.0066,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8110",
    "code": "1609",
    "name": "Kab. Ogan Komering Ulu Timur",
    "province": "Sumatera Selatan",
    "lat": -3.8568,
    "lng": 104.7521,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q15729116",
    "code": "1612",
    "name": "Kab. Penukal Abab Lematang Ilir",
    "province": "Sumatera Selatan",
    "lat": -3.2134,
    "lng": 104.0872,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8129",
    "code": "1674",
    "name": "Lubuk Linggau",
    "province": "Sumatera Selatan",
    "lat": -3.2967,
    "lng": 102.8617,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8130",
    "code": "1673",
    "name": "Pagar Alam",
    "province": "Sumatera Selatan",
    "lat": -4.0217,
    "lng": 103.2522,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8131",
    "code": "1671",
    "name": "Palembang",
    "province": "Sumatera Selatan",
    "lat": -2.9833,
    "lng": 104.7644,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q8133",
    "code": "1672",
    "name": "Prabumulih",
    "province": "Sumatera Selatan",
    "lat": -3.4328,
    "lng": 104.2356,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5954",
    "code": "1276",
    "name": "Binjai",
    "province": "Sumatera Utara",
    "lat": 3.6,
    "lng": 98.4853,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5967",
    "code": "1278",
    "name": "Gunungsitoli",
    "province": "Sumatera Utara",
    "lat": 1.1167,
    "lng": 97.5667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q1795",
    "code": "1208",
    "name": "Kab. Asahan",
    "province": "Sumatera Utara",
    "lat": 3,
    "lng": 99.1667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5797",
    "code": "1219",
    "name": "Kab. Batu Bara",
    "province": "Sumatera Utara",
    "lat": 3.1617,
    "lng": 99.5265,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5801",
    "code": "1210",
    "name": "Kab. Dairi",
    "province": "Sumatera Utara",
    "lat": 2.8667,
    "lng": 98.2333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5804",
    "code": "1212",
    "name": "Kab. Deli Serdang",
    "province": "Sumatera Utara",
    "lat": 3.55,
    "lng": 98.85,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5808",
    "code": "1215",
    "name": "Kab. Humbang Hasundutan",
    "province": "Sumatera Utara",
    "lat": 2.2655,
    "lng": 98.5038,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5810",
    "code": "1211",
    "name": "Kab. Karo",
    "province": "Sumatera Utara",
    "lat": 3.1167,
    "lng": 98.3,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5814",
    "code": "1207",
    "name": "Kab. Labuhanbatu",
    "province": "Sumatera Utara",
    "lat": 2.2667,
    "lng": 100.1,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5905",
    "code": "1222",
    "name": "Kab. Labuhanbatu Selatan",
    "province": "Sumatera Utara",
    "lat": 1.9828,
    "lng": 100.0975,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5842",
    "code": "1223",
    "name": "Kab. Labuhanbatu Utara",
    "province": "Sumatera Utara",
    "lat": 2.3333,
    "lng": 99.6375,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5833",
    "code": "1213",
    "name": "Kab. Langkat",
    "province": "Sumatera Utara",
    "lat": 3.7667,
    "lng": 98.2167,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5837",
    "code": "1202",
    "name": "Kab. Mandailing Natal",
    "province": "Sumatera Utara",
    "lat": 0.7838,
    "lng": 99.2549,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5841",
    "code": "1201",
    "name": "Kab. Nias",
    "province": "Sumatera Utara",
    "lat": 1.0333,
    "lng": 97.7667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5909",
    "code": "1225",
    "name": "Kab. Nias Barat",
    "province": "Sumatera Utara",
    "lat": 1.0597,
    "lng": 97.5861,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5918",
    "code": "1214",
    "name": "Kab. Nias Selatan",
    "province": "Sumatera Utara",
    "lat": 0.5834,
    "lng": 97.7777,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5853",
    "code": "1224",
    "name": "Kab. Nias Utara",
    "province": "Sumatera Utara",
    "lat": 1.3875,
    "lng": 97.36,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5866",
    "code": "1221",
    "name": "Kab. Padang Lawas",
    "province": "Sumatera Utara",
    "lat": 1.126,
    "lng": 99.8133,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5857",
    "code": "1220",
    "name": "Kab. Padang Lawas Utara",
    "province": "Sumatera Utara",
    "lat": 1.4601,
    "lng": 99.6735,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5872",
    "code": "1216",
    "name": "Kab. Pakpak Bharat",
    "province": "Sumatera Utara",
    "lat": 2.5667,
    "lng": 98.2833,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5888",
    "code": "1217",
    "name": "Kab. Samosir",
    "province": "Sumatera Utara",
    "lat": 2.6403,
    "lng": 98.7153,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5899",
    "code": "1218",
    "name": "Kab. Serdang Bedagai",
    "province": "Sumatera Utara",
    "lat": 3.3667,
    "lng": 99.0333,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5903",
    "code": "1209",
    "name": "Kab. Simalungun",
    "province": "Sumatera Utara",
    "lat": 2.9,
    "lng": 99,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5914",
    "code": "1203",
    "name": "Kab. Tapanuli Selatan",
    "province": "Sumatera Utara",
    "lat": 1.5177,
    "lng": 99.3011,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5800",
    "code": "1204",
    "name": "Kab. Tapanuli Tengah",
    "province": "Sumatera Utara",
    "lat": 1.9,
    "lng": 98.6667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5863",
    "code": "1205",
    "name": "Kab. Tapanuli Utara",
    "province": "Sumatera Utara",
    "lat": 2.0028,
    "lng": 99.0707,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5911",
    "code": "1206",
    "name": "Kab. Toba",
    "province": "Sumatera Utara",
    "lat": 2.3979,
    "lng": 99.2168,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5972",
    "code": "1275",
    "name": "Medan",
    "province": "Sumatera Utara",
    "lat": 3.5894,
    "lng": 98.6739,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5974",
    "code": "1277",
    "name": "Padangsidimpuan",
    "province": "Sumatera Utara",
    "lat": 1.3667,
    "lng": 99.2667,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5979",
    "code": "1273",
    "name": "Pematang Siantar",
    "province": "Sumatera Utara",
    "lat": 2.96,
    "lng": 99.06,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5984",
    "code": "1271",
    "name": "Sibolga",
    "province": "Sumatera Utara",
    "lat": 1.7425,
    "lng": 98.7792,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5987",
    "code": "1272",
    "name": "Tanjung Balai",
    "province": "Sumatera Utara",
    "lat": 2.9667,
    "lng": 99.8,
    "timeZone": "Asia/Jakarta"
  },
  {
    "id": "Q5989",
    "code": "1274",
    "name": "Tebing Tinggi",
    "province": "Sumatera Utara",
    "lat": 3.3283,
    "lng": 99.1625,
    "timeZone": "Asia/Jakarta"
  }
];
