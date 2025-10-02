const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            type: 'varchar',
            primary: true,
            generated: false
        },
        username: {
            type: 'varchar',
            unique: true,
            nullable: false
        },
        password: {
            type: 'varchar',
            nullable: false
        },
        name: {
            type: 'varchar',
            nullable: false
        },
        role: {
            type: 'varchar',
            nullable: false
        },
        permissions: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => JSON.stringify(value || {}),
                from: (value) => value ? JSON.parse(value) : {}
            }
        },
        active: {
            type: 'boolean',
            default: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        },
        last_login: {
            type: 'datetime',
            nullable: true
        },
        allowed_districts: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => JSON.stringify(value || ['all']),
                from: (value) => value ? JSON.parse(value) : ['all']
            }
        }
    }
});
