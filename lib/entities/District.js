const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'District',
    tableName: 'districts',
    columns: {
        id: {
            type: 'integer',
            primary: true,
            generated: true
        },
        name: {
            type: 'varchar',
            nullable: false,
            unique: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        }
    }
});
