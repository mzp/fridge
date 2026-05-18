import type { pantry } from "@/db/schema.js";

const MS_PER_DAY = 86400000;
const EXPIRES_SOON_DAYS = 3;

export type PantryItemRecord = typeof pantry.$inferSelect;
export type ExpiryStatus = "none" | "expired" | "soon" | "fresh";
export type PantryCategory = "prepared" | "ingredient";

export type ConsumeResult = {
  actualUsed: number;
  newQuantity: number;
  newStatus: string;
  consumed: boolean;
};

export class PantryItem {
  constructor(readonly record: PantryItemRecord) {}

  expiresAt(): number | null {
    if (this.record.stock_date == null) return null;
    if (this.record.best_before_days == null) return null;
    return new Date(this.record.stock_date).getTime() + this.record.best_before_days * MS_PER_DAY;
  }

  daysRemaining(today = new Date()): number | null {
    const expiresAt = this.expiresAt();
    if (expiresAt == null) return null;
    return Math.ceil((expiresAt - PantryItem.startOfDay(today)) / MS_PER_DAY);
  }

  expiryStatus(today = new Date()): ExpiryStatus {
    const days = this.daysRemaining(today);
    if (days == null) return "none";
    if (days < 0) return "expired";
    if (days <= EXPIRES_SOON_DAYS) return "soon";
    return "fresh";
  }

  quantityLabel(quantity = this.record.quantity): string {
    return PantryItem.formatQuantity(quantity, this.record.unit);
  }

  deltaLabel(delta: number): string {
    const prefix = delta >= 0 ? "+" : "-";
    return `${prefix}${this.quantityLabel(Math.abs(delta))}`;
  }

  belongsToCategory(category: PantryCategory): boolean {
    if (category === "prepared") return this.record.category === "prepared";
    return this.record.category !== "prepared";
  }

  consume({
    quantityUsed,
    useAll,
  }: {
    quantityUsed?: number | undefined;
    useAll?: boolean | undefined;
  }): ConsumeResult {
    const actualUsed = useAll ? this.record.quantity : (quantityUsed ?? 0);
    const newQuantity = this.record.quantity - actualUsed;
    const consumed = newQuantity <= 0;
    return {
      actualUsed,
      newQuantity,
      newStatus: consumed ? "consumed" : this.record.status,
      consumed,
    };
  }

  static compareByExpiry(a: PantryItem, b: PantryItem): number {
    const expiryA = a.expiresAt();
    const expiryB = b.expiresAt();
    if (expiryA == null && expiryB == null) return 0;
    if (expiryA == null) return 1;
    if (expiryB == null) return -1;
    return expiryA - expiryB;
  }

  static formatQuantity(quantity: number, unit: string | null): string {
    return unit ? `${quantity}${unit}` : String(quantity);
  }

  static normalizeCategory(value: unknown): PantryCategory {
    return value === "prepared" ? "prepared" : "ingredient";
  }

  private static startOfDay(date: Date): number {
    return new Date(date).setHours(0, 0, 0, 0);
  }
}
