// monitor_db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./data/certificates.db');

function monitorDatabase() {
    console.log('\n=== DATABASE MONITORING ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Check all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) console.error(err);
        
        console.log('\nTables in database:', tables.map(t => t.name));
        
        tables.forEach(table => {
            db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
                if (err) console.error(err);
                console.log(`\n--- ${table.name} TABLE ---`);
                console.log('Row count:', rows.length);
                
                if (rows.length > 0) {
                    console.log('Sample data:');
                    rows.slice(0, 3).forEach((row, i) => {
                        console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
                    });
                }
            });
        });
    });
}

// Monitor every 2 seconds
setInterval(monitorDatabase, 2000);