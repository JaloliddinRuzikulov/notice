const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'SIPAccount',
    tableName: 'sip_accounts',
    columns: {
        id: {
            type: 'varchar',
            primary: true,
            generated: false
        },
        extension: {
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
        server: {
            type: 'varchar',
            nullable: false
        },
        active: {
            type: 'boolean',
            default: true
        },
        channels: {
            type: 'integer',
            default: 1
        },
        created_at: {
            type: 'datetime',
            createDate: true
        },
        updated_at: {
            type: 'datetime',
            updateDate: true
        }
    }
});
