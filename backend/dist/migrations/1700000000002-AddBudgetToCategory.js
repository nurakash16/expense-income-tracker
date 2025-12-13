"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBudgetToCategory1700000000002 = void 0;
const typeorm_1 = require("typeorm");
class AddBudgetToCategory1700000000002 {
    async up(queryRunner) {
        await queryRunner.addColumn("category", new typeorm_1.TableColumn({
            name: "budget",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: true
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn("category", "budget");
    }
}
exports.AddBudgetToCategory1700000000002 = AddBudgetToCategory1700000000002;
