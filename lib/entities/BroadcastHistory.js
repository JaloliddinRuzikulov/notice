const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'BroadcastHistory',
    tableName: 'broadcast_history',
    columns: {
        id: {
            type: 'varchar',
            primary: true,
            generated: false
        },
        broadcast_name: {
            type: 'varchar',
            nullable: false
        },
        audio_file: {
            type: 'varchar',
            nullable: true
        },
        target_group: {
            type: 'varchar',
            nullable: true
        },
        target_district: {
            type: 'varchar',
            nullable: true
        },
        target_department: {
            type: 'varchar',
            nullable: true
        },
        total_recipients: {
            type: 'integer',
            default: 0
        },
        completed_calls: {
            type: 'integer',
            default: 0
        },
        failed_calls: {
            type: 'integer',
            default: 0
        },
        confirmed_calls: {
            type: 'integer',
            default: 0
        },
        status: {
            type: 'varchar',
            default: 'pending'
        },
        started_at: {
            type: 'datetime',
            nullable: true
        },
        completed_at: {
            type: 'datetime',
            nullable: true
        },
        started_by: {
            type: 'varchar',
            nullable: true
        },
        created_at: {
            type: 'datetime',
            createDate: true
        }
    },
    indices: [
        {
            name: 'idx_broadcast_history_status',
            columns: ['status']
        },
        {
            name: 'idx_broadcast_history_started_at',
            columns: ['started_at']
        }
    ]
});
