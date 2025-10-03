const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Group',
    tableName: 'groups',
    columns: {
        id: {
            type: 'varchar',
            primary: true,
            generated: false
        },
        name: {
            type: 'varchar',
            nullable: false
        },
        description: {
            type: 'text',
            nullable: true
        },
        members: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => JSON.stringify(value || []),
                from: (value) => value ? JSON.parse(value) : []
            }
        },
        district: {
            type: 'varchar',
            nullable: true
        },
        created_by: {
            type: 'varchar',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        }
    }
});
