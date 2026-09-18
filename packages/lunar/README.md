# @tuquet/lunar

> Astronomical Vietnamese Lunar-Solar calendar converter, recurrence engine, and Can Chi calculator.

[![npm version](https://img.shields.io/npm/v/@tuquet/lunar.svg)](https://www.npmjs.com/package/@tuquet/lunar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

- 🌓 **Astronomical Accuracy**: Implements Dr. Ho Ngoc Duc's algorithm (based on Jean Meeus' _Astronomical Algorithms_) adapted for UTC+7 (Hanoi/Ho Chi Minh City).
- 🔄 **Bidirectional Conversion**: Seamlessly convert Solar ➔ Lunar and Lunar ➔ Solar dates (including leap month support).
- 🗓️ **Recurrence & Event Discovery**: Find next upcoming lunar dates for Giỗ (death anniversaries), Ngày Rằm (15th), and Mùng 1 (New Moon).
- 🐅 **Can Chi & 24 Tiết Khí**: Calculates Can Chi for Year (with Vietnamese Zodiac Animal), Month, Day, and Hour, plus 24 Solar Terms (Tiết khí).
- 🪶 **Zero Dependencies & Dual ESM/CJS**: Lightweight, runs anywhere (Node.js, Browser, Edge, Cloudflare Workers).

---

## 📦 Installation

```bash
# Using pnpm
pnpm add @tuquet/lunar

# Using npm
npm install @tuquet/lunar

# Using yarn
yarn add @tuquet/lunar
```

---

## 🚀 Usage

### 1. Convert Solar to Lunar Date

```typescript
import { solarToLunar } from '@tuquet/lunar';

// Convert 2024-02-10 (Tết Giáp Thìn)
const lunar = solarToLunar({ day: 10, month: 2, year: 2024 });
console.log(lunar);
// { day: 1, month: 1, year: 2024, isLeap: false }
```

### 2. Convert Lunar back to Solar Date

```typescript
import { lunarToSolar } from '@tuquet/lunar';

// What solar date is 01/01/2025 Lunar?
const solar = lunarToSolar({ day: 1, month: 1, year: 2025 });
console.log(solar);
// { day: 29, month: 1, year: 2025 }
```

### 3. Find Next Upcoming Lunar Events (Giỗ, Rằm, Mùng 1)

```typescript
import { getNextAnnualLunarDate, getNextFullMoon, getNextNewMoon } from '@tuquet/lunar';

// Find next Giỗ (15th of 8th lunar month)
const nextGio = getNextAnnualLunarDate(15, 8);
console.log(
  `Ngày giỗ tiếp theo là: ${nextGio.solar.day}/${nextGio.solar.month}/${nextGio.solar.year} (còn ${nextGio.daysUntil} ngày)`
);

// Find next Ngày Rằm (15th lunar day)
const nextRam = getNextFullMoon();
console.log(
  `Ngày Rằm tiếp theo là: ${nextRam.solar.day}/${nextRam.solar.month}/${nextRam.solar.year}`
);
```

### 4. Can Chi & Zodiac Animal

```typescript
import { getCanChiYear, getCanChiDay, getFullLunarDate } from '@tuquet/lunar';

const year = getCanChiYear(2024);
console.log(year.full); // "Giáp Thìn"
console.log(year.animal); // "Rồng"

const fullInfo = getFullLunarDate(new Date());
console.log(
  `Hôm nay là ngày ${fullInfo.canChiDay.full}, tháng ${fullInfo.canChiMonth.full}, năm ${fullInfo.canChiYear.full} (${fullInfo.solarTerm})`
);
```

---

## 📄 License

MIT © [Tuquet](https://github.com/tuquet)
