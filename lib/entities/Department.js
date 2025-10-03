const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Department',
    tableName: 'departments',
    columns: {
        id: {
            type: 'integer',
            primary: true,
            generated: true
        },
        name: {
            type: 'varchar',
            nullable: false
        },
        description: {
            type: 'text',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        }
    }
});
