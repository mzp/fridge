import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH ?? "db/fridge.db";
const sqlite = new Database(dbPath);

const result = sqlite
  .prepare(
    `UPDATE meals
     SET
       side_dish = SUBSTR(main_dish, INSTR(main_dish, '・') + 1),
       main_dish = SUBSTR(main_dish, 1, INSTR(main_dish, '・') - 1)
     WHERE INSTR(main_dish, '・') > 0`,
  )
  .run();

console.log(`Migrated ${result.changes} meals`);
sqlite.close();
