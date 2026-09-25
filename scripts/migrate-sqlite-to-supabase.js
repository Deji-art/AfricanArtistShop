require('dotenv').config();
const path=require('path');
const fs=require('fs');
const Database=require('better-sqlite3');
const {Client}=require('pg');

async function migrate(){
  const sqlitePath=process.env.DB_PATH||path.join(__dirname,'..','africanartistshop.db');
  const url=process.env.SUPABASE_DB_URL;
  if(!url) throw new Error('SUPABASE_DB_URL is required.');
  if(!fs.existsSync(sqlitePath)){
    console.log('No local SQLite database found yet; migration skipped. The app will initialize its database on startup.');
    return {ok:true,skipped:true};
  }

  const tables=[
    ['users',['id','name','email','password_hash','role','created_at']],
    ['login_tokens',['token_hash','user_id','expires_at','created_at']],
    ['artists',['id','user_id','name','specialty','bio','image_url','artist_type','age_group','guardian_name','guardian_phone','status','created_at','registration_paid','payment_reference','registration_currency','registration_amount']],
    ['artworks',['id','artist_id','title','medium','size','price','description','image_url','availability','age_group','status','created_at']],
    ['supplies',['id','name','category','description','image_url','price','stock','unit','active','created_at']],
    ['orders',['id','user_id','customer_name','customer_email','whatsapp','address','total','listing_fees','commission','status','created_at']],
    ['order_items',['id','order_id','item_type','item_id','title','price','quantity','artist_id']],
    ['transactions',['id','order_id','user_id','provider','reference','status','amount','currency','purpose','artist_type','created_at','metadata']],
    ['training_requests',['id','user_id','child_name','child_age','guardian_name','guardian_phone','email','location','training_type','notes','status','created_at']],
    ['artist_daily_stats',['id','artist_id','day','views','sales']],
    ['settings',['key','value']]
  ];

  const schema=[
    "CREATE TABLE IF NOT EXISTS users(id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer',created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS login_tokens(token_hash TEXT PRIMARY KEY,user_id BIGINT NOT NULL,expires_at BIGINT NOT NULL,created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS artists(id BIGSERIAL PRIMARY KEY,user_id BIGINT UNIQUE,name TEXT NOT NULL,specialty TEXT,bio TEXT,image_url TEXT,artist_type TEXT DEFAULT 'professional',age_group TEXT DEFAULT 'adult',guardian_name TEXT,guardian_phone TEXT,status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,registration_paid INTEGER DEFAULT 0,payment_reference TEXT,registration_currency TEXT,registration_amount NUMERIC DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS artworks(id BIGSERIAL PRIMARY KEY,artist_id BIGINT NOT NULL,title TEXT NOT NULL,medium TEXT NOT NULL,size TEXT,price NUMERIC NOT NULL,description TEXT,image_url TEXT NOT NULL,availability TEXT DEFAULT 'Available',age_group TEXT DEFAULT 'adult',status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS supplies(id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,description TEXT,image_url TEXT NOT NULL,price NUMERIC NOT NULL,stock INTEGER DEFAULT 0,unit TEXT DEFAULT 'piece',active INTEGER DEFAULT 1,created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS orders(id BIGSERIAL PRIMARY KEY,user_id BIGINT,customer_name TEXT,customer_email TEXT,whatsapp TEXT,address TEXT,total NUMERIC NOT NULL,listing_fees NUMERIC DEFAULT 0,commission NUMERIC DEFAULT 0,status TEXT DEFAULT 'pending',created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS order_items(id BIGSERIAL PRIMARY KEY,order_id BIGINT,item_type TEXT NOT NULL,item_id BIGINT,title TEXT,price NUMERIC,quantity INTEGER,artist_id BIGINT)",
    "CREATE TABLE IF NOT EXISTS transactions(id BIGSERIAL PRIMARY KEY,order_id BIGINT,user_id BIGINT,provider TEXT,reference TEXT,status TEXT,amount NUMERIC,currency TEXT,purpose TEXT,artist_type TEXT,created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,metadata TEXT)",
    "CREATE TABLE IF NOT EXISTS training_requests(id BIGSERIAL PRIMARY KEY,user_id BIGINT,child_name TEXT NOT NULL,child_age INTEGER NOT NULL,guardian_name TEXT NOT NULL,guardian_phone TEXT NOT NULL,email TEXT,location TEXT,training_type TEXT,notes TEXT,status TEXT DEFAULT 'pending',created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS artist_daily_stats(id BIGSERIAL PRIMARY KEY,artist_id BIGINT NOT NULL,day TEXT NOT NULL,views INTEGER DEFAULT 0,sales INTEGER DEFAULT 0,UNIQUE(artist_id,day))",
    "CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT)"
  ];

  const sqlite=new Database(sqlitePath,{readonly:true});
  const client=new Client({connectionString:url,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:15000});
  try{
    await client.connect();
    console.log('Connected to Supabase/Postgres.');
    await client.query('BEGIN');
    for(const statement of schema) await client.query(statement);

    for(const [table,cols] of tables){
      const rows=sqlite.prepare('SELECT '+cols.map(c=>'"'+c+'"').join(',')+' FROM "'+table+'"').all();
      console.log(table+': '+rows.length+' rows');
      if(!rows.length) continue;
      const placeholders=cols.map((_,i)=>'$'+(i+1)).join(',');
      const sql='INSERT INTO "'+table+'" ('+cols.map(c=>'"'+c+'"').join(',')+') VALUES ('+placeholders+') ON CONFLICT DO NOTHING';
      for(const row of rows) await client.query(sql,cols.map(c=>row[c]===undefined?null:row[c]));
    }

    for(const table of ['users','artists','artworks','supplies','orders','order_items','transactions','training_requests','artist_daily_stats']){
      await client.query("SELECT setval(pg_get_serial_sequence('"+table+"','id'),COALESCE((SELECT MAX(id) FROM \""+table+"\"),1),true)");
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
    return {ok:true};
  }catch(e){
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Migration failed:',e.message);
    throw e;
  }finally{
    sqlite.close();
    await client.end().catch(()=>{});
  }
}

if(require.main===module) migrate().catch(()=>process.exitCode=1);
module.exports={migrate};
