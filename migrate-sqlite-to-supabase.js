require('dotenv').config();
const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

const sqlite = new Database(process.env.DB_PATH || path.join(__dirname, 'africanartistshop.db'), { readonly: true });
const pg = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
const tables = ['users','login_tokens','artists','artworks','supplies','orders','order_items','transactions','training_requests','artist_daily_stats','settings'];

async function run(){
  if(!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL is required');
  await pg.connect();
  for(const table of tables){
    const rows = sqlite.prepare('select * from '+table).all();
    if(!rows.length) continue;
    const columns = Object.keys(rows[0]);
    for(const row of rows){
      const values = columns.map(c => row[c] === undefined ? null : row[c]);
      const placeholders = values.map((_,i) => '$'+(i+1)).join(',');
      await pg.query('insert into '+table+' ('+columns.join(',')+') values ('+placeholders+') on conflict do nothing', values);
    }
    console.log('Copied '+table+': '+rows.length);
  }
  console.log('Migration copy complete. Keep SQLite until the runtime has been switched and verified.');
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{sqlite.close();pg.end().catch(()=>{})});
