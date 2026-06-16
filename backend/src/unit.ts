import Database from "better-sqlite3";

export class Unit {
  public readonly db: Database.Database;

  constructor(private readonly useTransaction: boolean = false) {
    this.db = new Database("users.db");
    this.db.pragma("foreign_keys = ON");
  }

  close(): void {
    this.db.close();
  }
}
