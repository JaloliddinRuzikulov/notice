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
        subject: {
            type: 'varchar',
            nullable: true
        },
        message: {
            type: 'text',
            nullable: true
        },
        audio_file: {
            type: 'varchar',
            nullable: true
        },
        original_audio_file: {
            type: 'varchar',
            nullable: true
        },
        employee_ids: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(value) : null,
                from: (value) => value ? JSON.parse(value) : []
            }
        },
        sip_accounts: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(value) : null,
                from: (value) => value ? JSON.parse(value) : []
            }
        },
        created_at: {
            type: 'datetime',
            nullable: true
        },
        created_by: {
            type: 'varchar',
            nullable: true
        },
        created_by_name: {
            type: 'varchar',
            nullable: true
        },
        created_by_username: {
            type: 'varchar',
            nullable: true
        },
        status: {
            type: 'varchar',
            default: 'pending'
        },
        total_recipients: {
            type: 'integer',
            default: 0
        },
        confirmed_count: {
            type: 'integer',
            default: 0
        },
        confirmations: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(value) : null,
                from: (value) => value ? JSON.parse(value) : []
            }
        },
        call_attempts: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(value) : null,
                from: (value) => value ? JSON.parse(value) : {}
            }
        },
        sms_message: {
            type: 'text',
            nullable: true
        },
        sms_results: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(value) : null,
                from: (value) => value ? JSON.parse(value) : []
            }
        },
        sms_sent_to: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(Array.from(value || [])) : null,
                from: (value) => value ? new Set(JSON.parse(value)) : new Set()
            }
        },
        error: {
            type: 'text',
            nullable: true
        },
        active_calls: {
            type: 'integer',
            default: 0
        },
        channel_status: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value) => value ? JSON.stringify(value) : null,
                from: (value) => value ? JSON.parse(value) : null
            }
        },
        saved_at: {
            type: 'datetime',
            nullable: true
        }
    },
    indices: [
        {
            name: 'idx_broadcast_history_status',
            columns: ['status']
        },
        {
            name: 'idx_broadcast_history_created_at',
            columns: ['created_at']
        },
        {
            name: 'idx_broadcast_history_created_by',
            columns: ['created_by']
        }
    ]
});
