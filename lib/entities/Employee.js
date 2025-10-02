const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Employee',
    tableName: 'employees',
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
        position: {
            type: 'varchar',
            nullable: true
        },
        rank: {
            type: 'varchar',
            nullable: true
        },
        department: {
            type: 'varchar',
            nullable: true
        },
        phone_number: {
            type: 'varchar',
            nullable: false
        },
        service_phone: {
            type: 'varchar',
            nullable: true
        },
        district: {
            type: 'varchar',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        },
        updated_at: {
            type: 'datetime',
            updateDate: true
        },
        deleted: {
            type: 'boolean',
            default: false
        },
        created_by: {
            type: 'varchar',
            nullable: true
        }
    },
    indices: [
        {
            name: 'idx_employees_district',
            columns: ['district']
        },
        {
            name: 'idx_employees_deleted',
            columns: ['deleted']
        },
        {
            name: 'idx_employees_phone',
            columns: ['phone_number']
        }
    ]
});
