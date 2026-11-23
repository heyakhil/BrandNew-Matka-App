import { randomBytes } from "node:crypto";

export class ObjectId {
  private readonly value: string;
  constructor(value: string = randomBytes(12).toString("hex")) {
    if (!ObjectId.isValid(value)) throw new Error("Invalid ID.");
    this.value = value.toLowerCase();
  }
  static isValid(value: string): boolean {
    return /^[\da-f]{24}$/i.test(value);
  }
  toHexString(): string {
    return this.value;
  }
  toString(): string {
    return this.value;
  }
  toJSON(): string {
    return this.value;
  }
  equals(other: ObjectId): boolean {
    return this.value === other.value;
  }
}
