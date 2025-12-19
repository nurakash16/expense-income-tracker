"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDisplayNameToUsers1700000000004 = void 0;
const typeorm_1 = require("typeorm");
class AddDisplayNameToUsers1700000000004 {
    constructor() {
        this.name = 'AddDisplayNameToUsers1700000000004';
    }
    async up(queryRunner) {
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'displayName',
            type: 'varchar',
            isNullable: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('users', 'displayName');
    }
}
exports.AddDisplayNameToUsers1700000000004 = AddDisplayNameToUsers1700000000004;
