declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(y: number, m: number, d: number): Solar
    static fromDate(d: Date): Solar
    getXingZuo(): string
    getLunar(): Lunar
  }

  export class Lunar {
    static fromYmd(y: number, m: number, d: number): Lunar
    static fromDate(d: Date): Lunar
    getDayYi(sect?: number): string[]
    getDayJi(sect?: number): string[]
    getJieQi(): string
    getYearInGanZhi(): string
    getMonthInGanZhi(): string
    getDayInGanZhi(): string
    getMonthInChinese(): string
    getDayInChinese(): string
  }
}
