require('dotenv').config();
const path=require('path'); const fs=require('fs'); const crypto=require('crypto');
const express=require('express'); const session=require('express-session');
const {Client,Pool}=require('pg');
const pgPool=process.env.SUPABASE_DB_URL?new Pool({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:false},max:3,idleTimeoutMillis:30000}):null;
class PostgresSessionStore extends session.Store{
  constructor(pool){super();this.pool=pool;this.ready=pool?pool.query("CREATE TABLE IF NOT EXISTS user_sessions (sid TEXT PRIMARY KEY, sess JSONB NOT NULL, expire TIMESTAMPTZ NOT NULL)"):Promise.resolve();}
  get(sid,cb){this.ready.then(()=>this.pool.query("SELECT sess FROM user_sessions WHERE sid=$1 AND expire>NOW()",[sid])).then(r=>cb(null,r.rows[0]?r.rows[0].sess:null)).catch(cb)}
  set(sid,sess,cb){const expire=sess.cookie&&sess.cookie.expires?new Date(sess.cookie.expires):new Date(Date.now()+86400000);this.ready.then(()=>this.pool.query("INSERT INTO user_sessions(sid,sess,expire) VALUES($1,$2,$3) ON CONFLICT(sid) DO UPDATE SET sess=EXCLUDED.sess,expire=EXCLUDED.expire",[sid,JSON.stringify(sess),expire])).then(()=>cb&&cb()).catch(e=>cb&&cb(e))}
  destroy(sid,cb){this.ready.then(()=>this.pool.query("DELETE FROM user_sessions WHERE sid=$1",[sid])).then(()=>cb&&cb()).catch(e=>cb&&cb(e))}
  touch(sid,sess,cb){const expire=sess.cookie&&sess.cookie.expires?new Date(sess.cookie.expires):new Date(Date.now()+86400000);this.ready.then(()=>this.pool.query("UPDATE user_sessions SET expire=$2,sess=$3 WHERE sid=$1",[sid,expire,JSON.stringify(sess)])).then(()=>cb&&cb()).catch(e=>cb&&cb(e))}
}
async function testSupabaseConnection(){
  const url=process.env.SUPABASE_DB_URL;
  if(!url){console.log('Supabase DB: SUPABASE_DB_URL not set; continuing with current database.');return}
  try{
    const u=new URL(url);
    console.log('Supabase DB target:',{host:u.hostname,port:u.port||'5432',user:u.username,database:u.pathname.startsWith('/')?u.pathname.slice(1):u.pathname});
    if(u.hostname.includes('pooler.supabase.com')&&u.username==='postgres') console.warn('Supabase DB warning: this looks like a Supabase pooler host using the direct postgres username. Re-copy the Session Pooler URI from Supabase; it normally includes the project reference in the username.');
  }catch(e){console.error('Supabase DB URL could not be parsed:',e.message)}
  const client=new Client({connectionString:url,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:10000});
  try{await client.connect();const r=await client.query('select current_database() as database, current_user as user, now() as server_time');console.log('Supabase DB connection OK:',r.rows[0]);}
  catch(e){console.error('Supabase DB connection failed:',e.message)}
  finally{await client.end().catch(()=>{})}
}
const bcrypt=require('bcryptjs'); const multer=require('multer'); const Database=require('better-sqlite3');
const SUPABASE_URL=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const SUPABASE_SERVICE_ROLE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
async function uploadToSupabaseStorage(file){
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase Storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  const safeName=(file.originalname||'artwork').replace(/[^a-zA-Z0-9._-]/g,'_');
  const objectPath='artworks/'+Date.now()+'-'+crypto.randomBytes(6).toString('hex')+'-'+safeName;
  const r=await fetch(SUPABASE_URL+'/storage/v1/object/'+objectPath,{method:'POST',headers:{Authorization:'Bearer '+SUPABASE_SERVICE_ROLE_KEY,apikey:SUPABASE_SERVICE_ROLE_KEY,'Content-Type':file.mimetype,'x-upsert':'false'},body:file.buffer});
  if(!r.ok) throw new Error('Supabase Storage upload failed: '+await r.text());
  return SUPABASE_URL+'/storage/v1/object/public/'+objectPath;
}
const app=express(); const PORT=process.env.PORT||3000;
app.set('trust proxy',1);
const DB_PATH=process.env.DB_PATH||path.join(__dirname,'africanartistshop.db');
const uploadDir=path.join(__dirname,'public','uploads'); fs.mkdirSync(uploadDir,{recursive:true});
const db=new Database(DB_PATH); db.pragma('journal_mode=WAL');
app.use(express.json({verify:(req,res,buf)=>{req.rawBody=buf}})); app.use(express.urlencoded({extended:true,limit:'1mb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');next()});
const OWNER_EMAIL=process.env.OWNER_EMAIL||'mojibolapeace@gmail.com';
const EMAIL_FROM=process.env.EMAIL_FROM||'onboarding@resend.dev';
async function sendEmail({to,subject,html}){if(!process.env.RESEND_API_KEY)return false;try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:EMAIL_FROM,to:Array.isArray(to)?to:[to],subject,html})});if(!r.ok){console.error('Email send failed',await r.text());return false}return true}catch(e){console.error('Email error',e.message);return false}}
const rateBuckets=new Map();
function escHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]) )}
function rateLimit(max=30,windowMs=60000){return (req,res,next)=>{const key=req.ip+':'+req.path;const now=Date.now();let b=rateBuckets.get(key);if(!b||now-b.start>windowMs)b={start:now,count:0};b.count++;rateBuckets.set(key,b);if(b.count>max)return res.status(429).json({error:'Too many requests. Please try again shortly.'});next()}};

if(process.env.NODE_ENV==='production'&&!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required in production.');
app.use(session({secret:process.env.SESSION_SECRET||'development-only-session-secret',resave:false,saveUninitialized:false,store:pgPool?new PostgresSessionStore(pgPool):undefined,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:1000*60*60*24*30}}));
const storage=multer.memoryStorage();
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(req,file,cb)=>{const allowed=['image/jpeg','image/png','image/webp','image/gif'];if(!allowed.includes(file.mimetype))return cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'));cb(null,true)}});
function init(){
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS login_tokens(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at INTEGER NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS artists(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER UNIQUE,name TEXT NOT NULL,specialty TEXT,bio TEXT,image_url TEXT,artist_type TEXT DEFAULT 'professional',age_group TEXT DEFAULT 'adult',guardian_name TEXT,guardian_phone TEXT,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS artworks(id INTEGER PRIMARY KEY AUTOINCREMENT,artist_id INTEGER NOT NULL,title TEXT NOT NULL,medium TEXT NOT NULL,size TEXT,price REAL NOT NULL,description TEXT,image_url TEXT NOT NULL,availability TEXT DEFAULT 'Available',age_group TEXT DEFAULT 'adult',status TEXT NOT NULL DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(artist_id) REFERENCES artists(id));
CREATE TABLE IF NOT EXISTS supplies(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,category TEXT NOT NULL,description TEXT,image_url TEXT NOT NULL,price REAL NOT NULL,stock INTEGER DEFAULT 0,unit TEXT DEFAULT 'piece',active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,customer_name TEXT,customer_email TEXT,whatsapp TEXT,address TEXT,total REAL NOT NULL,listing_fees REAL DEFAULT 0,commission REAL DEFAULT 0,status TEXT DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,item_type TEXT NOT NULL,item_id INTEGER,title TEXT,price REAL,quantity INTEGER,artist_id INTEGER,FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,user_id INTEGER,provider TEXT,reference TEXT,status TEXT,amount REAL,currency TEXT,purpose TEXT,artist_type TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS training_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,child_name TEXT NOT NULL,child_age INTEGER NOT NULL,guardian_name TEXT NOT NULL,guardian_phone TEXT NOT NULL,email TEXT,location TEXT,training_type TEXT,notes TEXT,status TEXT DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS artist_daily_stats(id INTEGER PRIMARY KEY AUTOINCREMENT,artist_id INTEGER NOT NULL,day TEXT NOT NULL,views INTEGER DEFAULT 0,sales INTEGER DEFAULT 0,UNIQUE(artist_id,day));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);
`);
const set=(k,v)=>db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').run(k,String(v));
const addColumn=(table,column,definition)=>{try{db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)}catch(e){}};
addColumn('artists','registration_paid',"INTEGER DEFAULT 0");
addColumn('artists','payment_reference',"TEXT");
addColumn('artists','registration_currency',"TEXT");
addColumn('artists','registration_amount',"REAL DEFAULT 0");
addColumn('transactions','user_id',"INTEGER");
addColumn('transactions','currency',"TEXT");
addColumn('transactions','purpose',"TEXT");
addColumn('transactions','artist_type',"TEXT");
addColumn('transactions','metadata',"TEXT");
const TIER_RULES={kid:{label:'Young / Kid Artist',min:3,max:5,fee:{NGN:4000,USD:3},age:'4-18'},professional:{label:'Professional Artist',min:5,max:7,fee:{NGN:13000,USD:10}},signature:{label:'Signature Artist',min:8,max:10,fee:{NGN:0,USD:0}}};
function tierRule(type){return TIER_RULES[type]||TIER_RULES.professional}
function currentDay(){return new Date().toISOString().slice(0,10)}
function recordArtistStat(artistId,field,amount=1){const d=currentDay();db.prepare('INSERT INTO artist_daily_stats(artist_id,day,views,sales) VALUES(?,?,0,0) ON CONFLICT(artist_id,day) DO NOTHING').run(artistId,d);db.prepare(`UPDATE artist_daily_stats SET ${field}=${field}+? WHERE artist_id=? AND day=?`).run(amount,artistId,d)}
async function paystack(pathname,options={}){if(!process.env.PAYSTACK_SECRET_KEY)throw new Error('Paystack is not configured. Add PAYSTACK_SECRET_KEY in your production environment variables.');const r=await fetch('https://api.paystack.co'+pathname,{...options,headers:{Authorization:'Bearer '+process.env.PAYSTACK_SECRET_KEY,'Content-Type':'application/json',...(options.headers||{})}});const data=await r.json();if(!r.ok||!data.status)throw new Error(data.message||'Paystack request failed');return data}
set('artist_listing_fee','5000'); set('sales_commission_percent','10');
const admin=db.prepare('SELECT id FROM users WHERE email=?').get('admin@africanartistshop.com');
if(!admin) db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('AfricanArtistShop Admin','admin@africanartistshop.com',bcrypt.hashSync('demo1234',10),'admin');
let a=db.prepare('SELECT id FROM users WHERE email=?').get('peace@example.com');
if(!a){const info=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run('Peace Ayodeji','peace@example.com',bcrypt.hashSync('demo1234',10),'artist');const ar=db.prepare('INSERT INTO artists(user_id,name,specialty,bio,image_url,artist_type,age_group,registration_paid,status) VALUES(?,?,?,?,?,?,?,?,?)').run(info.lastInsertRowid,'Peace Ayodeji','Painting','African artist and creator. Featured collection: Face of Time.','/peace-ayodeji-profile.svg','professional','adult',1,'approved');db.prepare('INSERT INTO artworks(artist_id,title,medium,size,price,description,image_url,availability,age_group,status) VALUES(?,?,?,?,?,?,?,?,?,?)').run(ar.lastInsertRowid,'Face of Time','Painting','24 x 36 in',85000,'Face of Time is an imaginative portrait exploring time, identity and expression.','/face-of-time.svg','Available','adult','approved');}else{db.prepare("UPDATE users SET name='Peace Ayodeji' WHERE id=?").run(a.id);db.prepare("UPDATE artists SET name='Peace Ayodeji',specialty='Painting',bio='African artist and creator. Featured collection: Face of Time.',image_url='/peace-ayodeji-profile.svg',artist_type='professional',age_group='adult',registration_paid=1,status='approved' WHERE user_id=?").run(a.id);const ar=db.prepare('SELECT id FROM artists WHERE user_id=?').get(a.id);if(ar){const w=db.prepare('SELECT id FROM artworks WHERE artist_id=? AND title=?').get(ar.id,'Face of Time');if(w)db.prepare("UPDATE artworks SET medium='Painting',size='24 x 36 in',description='Face of Time is an imaginative portrait exploring time, identity and expression.',image_url='/face-of-time.svg',availability='Available',age_group='adult',status='approved' WHERE id=?").run(w.id);else db.prepare('INSERT INTO artworks(artist_id,title,medium,size,price,description,image_url,availability,age_group,status) VALUES(?,?,?,?,?,?,?,?,?,?)').run(ar.id,'Face of Time','Painting','24 x 36 in',85000,'Face of Time is an imaginative portrait exploring time, identity and expression.','/face-of-time.svg','Available','adult','approved')}}
if(db.prepare('SELECT COUNT(*) c FROM supplies').get().c===0){
const ins=db.prepare('INSERT INTO supplies(name,category,description,image_url,price,stock,unit) VALUES(?,?,?,?,?,?,?)');
[
['Acrylic Paint Set','Paints','Rich starter acrylic set for canvas and mixed-media work.','https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',18500,20,'set'],
['Artist Brush Collection','Brushes','Assorted round, flat and detail brushes for artists.','https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80',9500,30,'pack'],
['Cotton Canvas 24 × 36 in','Canvas','Primed cotton canvas ready for painting.','https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80',12000,25,'piece'],
['Wooden Tabletop Easel','Easels','Compact wooden easel for studio or tabletop painting.','https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80',22000,12,'piece'],
['Watercolour Paper Pad','Paper','Acid-free paper for watercolour and ink studies.','https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',7500,35,'pad'],
['Palette Knife Set','Tools','Metal palette knives for texture and impasto techniques.','https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80',6500,18,'set']
].forEach(x=>ins.run(...x));
}}
/* Keep the catalogue images matched to the actual products even when the database was seeded on an older deployment. */
function refreshSupplyImages(){
  const imgs={
    'Acrylic Paint Set':'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
    'Artist Brush Collection':'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80',
    'Cotton Canvas 24 × 36 in':'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80',
    'Wooden Tabletop Easel':'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80',
    'Watercolour Paper Pad':'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',
    'Palette Knife Set':'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80'
  };
  const q=db.prepare('UPDATE supplies SET image_url=? WHERE name=?');
  Object.entries(imgs).forEach(([name,url])=>q.run(url,name));
}
init();
refreshSupplyImages();
testSupabaseConnection().catch(()=>{});

function seedExpandedSupplies(){
  const items=[
    ['Graphite Pencils','Tools','Graphite drawing pencils in assorted grades for sketching and shading.',1850,60,'set'],
    ['Charcoal Pencils','Tools','Charcoal pencils for controlled dark drawing and portrait work.',2200,50,'set'],
    ['Compressed Charcoal','Tools','Dense charcoal sticks for rich dark marks and tonal studies.',1800,45,'pack'],
    ['Willow / Vine Charcoal','Tools','Soft natural charcoal sticks for loose drawing and underdrawing.',1800,45,'pack'],
    ['Colored Pencils','Tools','Artist colored pencils for detailed layered drawing.',6500,40,'set'],
    ['Pastel Pencils','Tools','Hard pastel pencils for precise pastel drawing.',7200,35,'set'],
    ['Soft Pastels','Paints','Soft pastel sticks for expressive dry-media work.',6500,35,'set'],
    ['Oil Pastels','Paints','Creamy oil pastel sticks for bold colour and texture.',5000,40,'set'],
    ['Chalk Pastels','Paints','Chalk pastel sticks for soft matte colour studies.',4200,35,'set'],
    ['Watercolor Pencils','Paints','Water-soluble colored pencils for wet and dry techniques.',6500,35,'set'],
    ['Watercolor Paints','Paints','Artist watercolor paints for transparent washes and studies.',8500,35,'set'],
    ['Gouache','Paints','Opaque water-based paint for illustration and expressive studies.',7500,30,'set'],
    ['Oil Paints','Paints','Artist oil colours for traditional painting.',12000,25,'set'],
    ['Tempera Paints','Paints','Water-based tempera paints for studies and young artists.',5000,35,'set'],
    ['Poster Colors','Paints','Bright poster colours for illustration, school and craft work.',4500,40,'set'],
    ['Ink','Paints','Drawing and illustration ink for expressive line work.',3500,35,'bottle'],
    ['India Ink','Paints','Permanent black India ink for drawing and technical work.',3200,35,'bottle'],
    ['Acrylic Markers','Tools','Opaque acrylic markers for canvas, paper and mixed media.',6500,30,'set'],
    ['Paint Markers','Tools','Paint markers for bold lettering and mixed-media surfaces.',5000,30,'set'],
    ['Permanent Markers','Tools','Permanent markers for bold lines, labelling and illustration.',3000,40,'set'],
    ['Fineliners','Tools','Fine-tip drawing pens for line art and technical sketching.',3500,40,'set'],
    ['Technical Drawing Pens','Tools','Technical pens for controlled architectural and design lines.',6000,25,'set'],
    ['Brush Pens','Tools','Flexible brush pens for lettering, illustration and line variation.',4500,35,'set'],
    ['Sketchbooks','Paper','Portable sketchbooks for practice, ideas and studies.',4500,45,'book'],
    ['Drawing Paper','Paper','Smooth heavyweight drawing paper for graphite and charcoal.',3500,50,'pad'],
    ['Canvas Boards','Canvas','Rigid primed canvas boards for painting studies.',6500,30,'pack'],
    ['Illustration Boards','Paper','Smooth rigid boards for illustration and presentation.',5000,30,'pack'],
    ['Bristol Board','Paper','Very smooth heavyweight board for ink, marker and pencil work.',4500,30,'pack'],
    ['Pastel Paper','Paper','Textured paper designed to hold pastel pigments.',4500,35,'pad'],
    ['Craft Paper','Paper','Versatile brown craft paper for drawing, wrapping and mixed media.',2500,50,'pack'],
    ['Palette','Tools','Mixing palette for acrylic, oil and other paints.',2500,40,'piece'],
    ['Watercolor Brushes','Brushes','Soft brushes designed to hold water and pigment.',5500,35,'set'],
    ['Fan Brushes','Brushes','Fan-shaped brushes for texture, foliage and blending effects.',3500,30,'set'],
    ['Flat Brushes','Brushes','Flat brushes for blocks of colour, edges and washes.',4500,35,'set'],
    ['Round Brushes','Brushes','Round brushes for details, lines and controlled painting.',4500,35,'set'],
    ['Drawing Erasers','Tools','Standard drawing erasers for clean corrections.',1200,60,'pack'],
    ['Kneaded Erasers','Tools','Malleable erasers for lifting graphite and charcoal selectively.',1800,50,'pack'],
    ['Pencil Sharpeners','Tools','Artist pencil sharpeners for graphite and colored pencils.',1500,60,'piece'],
    ['Rulers','Tools','Straight rulers for drawing, measuring and layout.',1200,50,'piece'],
    ['French Curves','Tools','Curved templates for smooth technical and design lines.',2500,30,'set'],
    ['Drawing Compass','Tools','Compass for circles, geometry and technical drawing.',2800,30,'piece'],
    ['Masking Tape','Tools','Low-tack masking tape for clean edges and paper mounting.',1800,50,'roll'],
    ['Fixative Spray','Tools','Workable fixative for protecting charcoal, pastel and graphite studies.',5500,25,'can'],
    ['Gesso','Paints','Surface primer for preparing canvas, board and mixed-media supports.',6000,25,'bottle']
  ];
  const imgs=[
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80'
  ];
  const ins=db.prepare('INSERT INTO supplies(name,category,description,image_url,price,stock,unit) VALUES(?,?,?,?,?,?,?)');
  const exists=db.prepare('SELECT id FROM supplies WHERE name=?');
  items.forEach((x,i)=>{if(!exists.get(x[0]))ins.run(x[0],x[1],x[2],imgs[i%imgs.length],x[3],x[4],x[5]);});
}

seedExpandedSupplies();
/* Each catalogue item gets a material-specific image query instead of a rotating generic art photo. */
async function refreshExpandedSupplyImages(){
  const rows=db.prepare('SELECT id,name FROM supplies').all();

  const curated={
    'Acrylic Paint Set':'https://goodsstores.com/cdn/shop/files/paints_set_on_canvas.jpg?v=1776876090&width=900',
    'Artist Brush Collection':'https://i.ebayimg.com/images/g/tRUAAeSwmnZpMK9t/s-l1200.webp',
    'Cotton Canvas 24 × 36 in':'https://i5.walmartimages.com/asr/242f0fc4-cdba-4087-9288-bd083bbde5d1.cab6bbb8c418e65a030ccd72b54578e2.jpeg',
    'Wooden Tabletop Easel':'https://tcpglobal.com/cdn/shop/files/USAE-003_v1_1200x1200.jpg?v=1784961847',
    'Watercolour Paper Pad':'https://cdn.artezapaint.com/cdn/10194/2026/03/06/Arteza-Acrylic-Paint-Set-of-24-Colors-and-Watercolor-Paper-9x12-Inch-Pack-of-2-Painting-Art-Supplies-for-Artist-Hobby-Painters-amp-Beginners-7598837-6647.jpg',
    'Palette Knife Set':'https://productimages.withfloats.com/actual/696f313668009967b460a4f0.jpeg',
    'Graphite Pencils':'https://media.accobrands.com/media/560-560/566520.jpg',
    'Charcoal Pencils':'https://cdn.schoolspecialty.com/f57caaeb-7673-4a59-9e82-b2a400a5a693/373778_JPG%20Output.jpg?bg-color=ffffff&canvas=700%2C700&fit=bounds&height=700&width=700',
    'Compressed Charcoal':'https://zartart.com.au/cdn/shop/files/CRZ611_1.jpg?v=1728951145&width=2000',
    'Colored Pencils':'https://img.everymarket.uk/1c4dhmez65sj009ksneebfowezvj?format=jpg&height=800&width=800',
    'Pastel Pencils':'https://www.faber-castell.com.br/-/media/Products/Product-Repository/PITT-pastel-pencils/24-25-03-Colored-pencil/112112-Colour-pencil-PITT-PASTEL-tin-of-12/Images/112112_10_PM3.ashx?as=0&bc=ffffff&h=900&hash=FABE653E7E837584C5C19E702FA2758E&sc_lang=pt-BR&w=900',
    'Soft Pastels':'https://i.ebayimg.com/images/g/3FQAAOSwGOpjV1Hg/s-l1200.jpg',
    'Oil Pastels':'https://commons.wikimedia.org/wiki/Special:FilePath/Oilpastel.JPG?width=900',
    'Watercolor Pencils':'https://alwan.com.eg/cache/thumbnails/uploads__products__131-photo__878__0__0__0__1488977621.jpg',
    'Gouache':'https://wafuu.com/cdn/shop/files/holbein-opaque-watercolors-gouache-g713-15ml-18-colors-set-03713-924078_1200x1200.jpg?v=1739166726',
    'Oil Paints':'https://www.gordonharris.co.nz/cdn/shop/files/WN0172259.jpg?v=1759862464',
    'Poster Colors':'https://paperquirks.in/cdn/shop/files/PosterColour12.jpg?v=1704704288&width=1024',
    'India Ink':'https://cdn.webshopapp.com/shops/292744/files/372984069/winsor-newton-black-indian-ink.jpg',
    'Acrylic Markers':'https://www.bumbleberrys.co.uk/cdn/shop/files/art-materials-acrylic-marker-24-color-set-vol-1-31367730987111_540x_ea9a4104-d4d3-4343-a2c5-180fc49e7778_1024x1024.webp?v=1704885203',
    'Paint Markers':'https://www.ryman.co.uk/media/catalog/product/0/8/0845391069_1_1.jpg?bg-color=255%2C255%2C255&canvas=550%3A550&fit=bounds&height=550&quality=80&width=550',
    'Permanent Markers':'https://www.viroux.com/web/image/product.template/105755/image_1024?unique=b058e89',
    'Fineliners':'https://cld-assets.dick-blick.com/image/upload/c_limit%2Cw_1920/f_auto/q_auto/v1/21061-2025-M-4ww?_a=BAVAZGB00',
    'Technical Drawing Pens':'https://www.starboxretail.com/Images/products/PRDT2020112502833.jpg',
    'Brush Pens':'https://www.montmarte.com/cdn/shop/products/mont-marte-real-brush-pens-premium-36pc-mmpm0048_v02-f.jpg?v=1662959976',
    'Sketchbooks':'https://static.booktopia.com.au/internals/9788883701153-1.jpg',
    'Drawing Paper':'https://i5.walmartimages.com/seo/Drawing-Pad-by-Artist-s-Loft-9-x-12_a417a825-2bd4-463d-b095-f74f6be68000.9b54513ad7b7dbb144e29370a7c8b7ef.jpeg',
    'Canvas Boards':'https://uniquestrokes.com/cdn/shop/files/1_a9faaf60-1a92-44a8-95fe-e2ae0a11ec95.jpg?v=1721755136',
    'Illustration Boards':'https://www.jerrysartarama.com/media/catalog/product/cache/ecb49a32eeb5603594b082bd5fe65733/c/r/crescent-cold_press-illustration-board-no-size.jpg',
    'Bristol Board':'https://www.jacksonsart.com/cdn-cgi/image/quality%3D80%2Cbackground%3D%23ffffff%2Cfit%3Dscale-down/media/catalog/product/p/s/psm342-114.jpg',
    'Pastel Paper':'https://www.jerrysartarama.com/media/catalog/product/cache/1ed84fc5c90a0b69e5179e47db6d0739/c/a/canson-mi-teintes-9x12-assorted-sw-70629.jpg',
    'Craft Paper':'https://www.montmarte.com/cdn/shop/files/Mont-Marte-A4-Kraft-Paper-Pad-50-Sheets-115gsm-MSB0096_V03-F_1024x.jpg?v=1706511325',
    'Watercolor Brushes':'https://shop.emilylex.com/cdn/shop/files/paintbrush-set-wood_dd68410c-9164-45b0-ac7f-636d6fc2fb28.jpg?v=1763446396&width=1445',
    'Fan Brushes':'https://isomarsshop.in/cdn/shop/products/artist-brush-fan-set-of-7-3038068.jpg?crop=center&height=1200&v=1782729012&width=1200',
    'Flat Brushes':'https://isomarsshop.in/cdn/shop/files/Isomars_Flat_Paint_Brush_Set_of_7_Professional_Synthetic_Artist_Brushes.jpg?v=1777700321&width=1500',
    'Round Brushes':'https://artios.in/cdn/shop/products/81TJSxwa_DL._SL1500_749bbc66-e949-4a34-8b6e-7dfebc1c4ce1.jpg?v=1672228796&width=1445',
    'Kneaded Erasers':'https://i.ebayimg.com/images/g/p1QAAeSwFFRoGg~k/s-l1200.jpg',
    'Rulers':'https://www.schooldepot.co.nz/cdn/shop/files/StaedtlerMarsAluminumRuler56340withInkingEdge40cmPic2.jpg?v=1709189583&width=1445',
    'French Curves':'https://onton.com/images/webp/1024/539fc5ec-6be7-5219-8c5d-f613e22eb3d2',
    'Drawing Compass':'https://www.papelstore.es/media/catalog/product/cache/4/image/1800x/040ec09b1e35df139433887a97daa66f/1/8/186129-1.jpg',
    'Masking Tape':'https://www.alabamaart.com/cdn/shop/files/masking-tape-34-inch-x-60-yards-315488_600x_e3cec1bb-bc80-42ee-b5d0-f0424f7909df_1400x.webp?v=1700260391',
    'Fixative Spray':'https://www.gordonharris.co.nz/cdn/shop/files/SC50402040_grande.jpg?v=1759854434',
    'Gesso':'https://www.paperpencil.pk/cdn/shop/files/9404-9405_0a0b3ccd-13d5-42f1-a2ee-5bd2a8408825.png?v=1777526390&width=1946',
    'Willow / Vine Charcoal':'https://zartart.com.au/cdn/shop/files/CRZ611_1.jpg?v=1728951145&width=2000',
    'Chalk Pastels':'https://i.ebayimg.com/images/g/jqEAAOSwf9NnDLxh/s-l400.jpg',
    'Watercolor Paints':'https://mes.net.au/cdn/shop/files/N131606.._Watercolour_Tin_of_24_Half_Pans.png?v=1741655004',
    'Tempera Paints':'https://www.barbabook.it/files/barbabook_Files/Foto/330362.PNG',
    'Ink':'https://wowartsupplies.co.uk/cdn/shop/files/164029028-SimplyBlackIndiaInk295ml_grande.jpg?v=1720797333',
    'Palette':'https://media.bauhaus.cz/media/catalog/product/2/5/258336_p_img.jpg',
    'Drawing Erasers':'https://www.mangostationery.com/cdn/shop/files/Mont-Marte-Artist-Erasers-Signature-4pc-MAXX0005-V03-F_1200x1200.jpg?v=1733479360',
    'Pencil Sharpeners':'https://artspices.eu/cdn/shop/files/RX-9095000110PK.jpg?v=1713862950'
  };

  const q=db.prepare('UPDATE supplies SET image_url=? WHERE id=?');
  const fallback='https://commons.wikimedia.org/wiki/Special:FilePath/Art%20supplies%20clutter%20%28Unsplash%29.jpg?width=900';
  const searchTerm=name=>encodeURIComponent(
    name
      .replace(/\\s*\\d+\\s*[×x]\\s*\\d+[^ ]*/gi,'')
      .replace(/\\b(set|collection|pad|pack|piece|roll|book|bottle|can)\\b/gi,'')
      .trim()+' artist art supply'
  );
  const getCommonsImage=async(name)=>{
    try{
      const url='https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='+searchTerm(name)+'&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*';
      const r=await fetch(url);
      if(!r.ok)return null;
      const data=await r.json();
      const pages=Object.values(data.query?.pages||{});
      const usable=pages.find(p=>p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url);
      return usable?.imageinfo?.[0]?.thumburl||usable?.imageinfo?.[0]?.url||null;
    }catch(e){return null}
  };
  const concurrency=6;
  const reachable=async(url)=>{
    if(!url)return false;
    try{
      const r=await fetch(url,{method:'GET',headers:{Range:'bytes=0-32'}});
      return r.ok;
    }catch(e){return false}
  };
  for(let i=0;i<rows.length;i+=concurrency){
    const batch=rows.slice(i,i+concurrency);
    const images=await Promise.all(batch.map(async x=>{
      const preferred=curated[x.name];
      if(preferred && await reachable(preferred)) return preferred;
      return await getCommonsImage(x.name);
    }));
    images.forEach((url,j)=>q.run(url||curated[batch[j].name]||fallback,batch[j].id));
  }
}
refreshExpandedSupplyImages().catch(e=>console.error('Supply image refresh failed:',e.message));
testSupabaseConnection();
function cookieValue(req,name){const raw=req.headers.cookie||'';const part=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return part?decodeURIComponent(part.slice(name.length+1)):''}
function issueRememberToken(res,userId){const raw=crypto.randomBytes(32).toString('hex');const hash=crypto.createHash('sha256').update(raw).digest('hex');const expires=Date.now()+1000*60*60*24*30;db.prepare('INSERT INTO login_tokens(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hash,userId,expires);res.append('Set-Cookie',`aas_remember=${encodeURIComponent(raw)}; Max-Age=${60*60*24*30}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}`);return raw}
function forgetRememberToken(req,res){const raw=cookieValue(req,'aas_remember');if(raw){const hash=crypto.createHash('sha256').update(raw).digest('hex');db.prepare('DELETE FROM login_tokens WHERE token_hash=?').run(hash)}res.clearCookie('aas_remember',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'})}
app.use((req,res,next)=>{if(req.session.user)return next();const raw=cookieValue(req,'aas_remember');if(!raw)return next();try{const hash=crypto.createHash('sha256').update(raw).digest('hex');const row=db.prepare('SELECT lt.user_id,u.id,u.name,u.email,u.role FROM login_tokens lt JOIN users u ON u.id=lt.user_id WHERE lt.token_hash=? AND lt.expires_at>?').get(hash,Date.now());if(row){req.session.user={id:row.id,name:row.name,email:row.email,role:row.role};req.session.save(()=>next());return}db.prepare('DELETE FROM login_tokens WHERE token_hash=?').run(hash)}catch(e){}next()});
function auth(req,res,next){if(!req.session.user)return res.status(401).json({error:'Authentication required'});next()}
function role(r){return (req,res,next)=>{if(!req.session.user||req.session.user.role!==r)return res.status(403).json({error:'Forbidden'});next()}}
function setting(k){return Number(db.prepare('SELECT value FROM settings WHERE key=?').get(k)?.value||0)}
app.get('/api/health',(req,res)=>res.json({ok:true}));
app.get('/api/me',(req,res)=>res.json({user:req.session.user||null}));
app.post('/api/register',rateLimit(8,60000),(req,res)=>{try{const {name,email,password}=req.body;if(!name||!email||!password)return res.status(400).json({error:'Name, email and password are required'});const exists=db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());if(exists)return res.status(409).json({error:'Email already registered'});const info=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name,email.toLowerCase(),bcrypt.hashSync(password,10),'customer');const user={id:info.lastInsertRowid,name,email:email.toLowerCase(),role:'customer'};req.session.user=user;issueRememberToken(res,user.id);res.json(user)}catch(e){res.status(500).json({error:e.message})}});
app.post('/api/login',rateLimit(12,60000),(req,res)=>{const {email,password}=req.body;const u=db.prepare('SELECT * FROM users WHERE email=?').get((email||'').toLowerCase());if(!u||!bcrypt.compareSync(password||'',u.password_hash))return res.status(401).json({error:'Invalid email or password'});const user={id:u.id,name:u.name,email:u.email,role:u.role};req.session.user=user;issueRememberToken(res,user.id);res.json(user)});
app.post('/api/logout',(req,res)=>{forgetRememberToken(req,res);req.session.destroy(()=>res.json({ok:true}))});
app.get('/api/artworks',(req,res)=>{const q='%'+(req.query.q||'')+'%';const m=req.query.medium||'';let sql=`SELECT a.*,ar.name artist_name FROM artworks a JOIN artists ar ON ar.id=a.artist_id WHERE a.status='approved' AND ar.status='approved' AND (a.title LIKE ? OR a.medium LIKE ? OR ar.name LIKE ?)`;let params=[q,q,q];if(m){sql+=' AND a.medium=?';params.push(m)}if(req.query.age){sql+=' AND a.age_group=?';params.push(req.query.age)}sql+=' ORDER BY a.created_at DESC';res.json(db.prepare(sql).all(...params))});
app.get('/api/artworks/:id',(req,res)=>{const x=db.prepare(`SELECT a.*,ar.name artist_name,ar.artist_type FROM artworks a JOIN artists ar ON ar.id=a.artist_id WHERE a.id=? AND a.status='approved' AND ar.status='approved'`).get(req.params.id);if(!x)return res.status(404).json({error:'Artwork not found'});recordArtistStat(x.artist_id,'views');res.json(x)});
app.get('/api/artists',(req,res)=>{const type=req.query.type||'';const age=req.query.age_group||'';let sql=`SELECT id,name,specialty,bio,image_url,artist_type,age_group,registration_paid FROM artists WHERE status='approved'`;const p=[];if(type){sql+=' AND artist_type=?';p.push(type)}if(age){sql+=' AND age_group=?';p.push(age)}sql+=' ORDER BY name';res.json(db.prepare(sql).all(...p))});
app.get('/api/artists/:id',(req,res)=>{const x=db.prepare("SELECT id,name,specialty,bio,image_url FROM artists WHERE id=? AND status='approved'").get(req.params.id);if(!x)return res.status(404).json({error:'Artist not found'});x.artworks=db.prepare(`SELECT id,title,medium,size,price,image_url,availability,age_group FROM artworks WHERE artist_id=? AND status='approved' ORDER BY created_at DESC`).all(req.params.id);res.json(x)});
app.get('/api/supplies',(req,res)=>{let sql='SELECT * FROM supplies WHERE active=1';const q='%'+(req.query.q||'')+'%';if(req.query.q){sql+=' AND (name LIKE ? OR category LIKE ?)';return res.json(db.prepare(sql+' ORDER BY created_at DESC').all(q,q))}res.json(db.prepare(sql+' ORDER BY created_at DESC').all())});
app.get('/api/supplies/:id',(req,res)=>{const x=db.prepare('SELECT * FROM supplies WHERE id=? AND active=1').get(req.params.id);if(!x)return res.status(404).json({error:'Supply not found'});res.json(x)});
app.post('/api/artist/apply',auth,(req,res)=>{try{const u=req.session.user;const {name,specialty,bio,image_url,artist_type='professional',age_group='adult',guardian_name='',guardian_phone=''}=req.body;const rule=tierRule(artist_type);if(artist_type==='kid'&&(!guardian_name||!guardian_phone))return res.status(400).json({error:'Young artist registration requires parent/guardian details'});const existing=db.prepare('SELECT id FROM artists WHERE user_id=?').get(u.id);if(existing)return res.status(409).json({error:'Application already exists'});if(artist_type!=='signature')return res.status(402).json({error:'Complete registration payment before submitting your artist application'});const info=db.prepare('INSERT INTO artists(user_id,name,specialty,bio,image_url,artist_type,age_group,guardian_name,guardian_phone,registration_paid,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(u.id,name||u.name,specialty||'',bio||'',image_url||'',artist_type,'adult',guardian_name,guardian_phone,1,'pending');db.prepare("UPDATE users SET role='artist' WHERE id=?").run(u.id);req.session.user.role='artist';sendEmail({to:OWNER_EMAIL,subject:'AfricanArtistShop — Free Signature Artist Application #'+info.lastInsertRowid,html:'<h2>New Signature Artist Application</h2><p><b>Application:</b> #'+info.lastInsertRowid+'</p><p><b>Artist:</b> '+escHtml(name||u.name)+'<br><b>Specialty:</b> '+escHtml(specialty||'Not supplied')+'<br><b>Email:</b> '+escHtml(u.email||'')+'</p><p><b>Biography:</b><br>'+escHtml(bio||'Not supplied')+'</p><p><b>Profile image:</b> '+escHtml(image_url||'Not supplied')+'</p><p><b>Showcase:</b> '+rule.min+'–'+rule.max+' works</p>'}).catch(()=>{});res.json({id:info.lastInsertRowid,status:'pending',payment_required:false,minimum_works:rule.min,maximum_works:rule.max,email_notice:!!process.env.RESEND_API_KEY})}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/artist/dashboard',auth,role('artist'),(req,res)=>{const ar=db.prepare('SELECT * FROM artists WHERE user_id=?').get(req.session.user.id);const artworks=ar?db.prepare('SELECT * FROM artworks WHERE artist_id=? ORDER BY created_at DESC').all(ar.id):[];const orders=ar?db.prepare(`SELECT o.id,o.total,o.status,o.created_at,oi.title,oi.price,oi.quantity FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.artist_id=? ORDER BY o.created_at DESC`).all(ar.id):[];res.json({artist:ar,artworks,orders,listing_fee:setting('artist_listing_fee'),commission_percent:setting('sales_commission_percent')})});
app.post('/api/artist/artworks',auth,role('artist'),upload.single('image'),async(req,res)=>{const ar=db.prepare('SELECT * FROM artists WHERE user_id=?').get(req.session.user.id);if(!ar)return res.status(400).json({error:'Submit an artist application first'});const rule=tierRule(ar.artist_type);const count=db.prepare('SELECT COUNT(*) c FROM artworks WHERE artist_id=?').get(ar.id).c;if(ar.artist_type!=='signature'&&!ar.registration_paid)return res.status(402).json({error:'Complete registration payment before uploading artwork'});if(count>=rule.max)return res.status(400).json({error:`Your ${rule.label} plan allows a maximum of ${rule.max} works`});if(!req.file)return res.status(400).json({error:'Image is required'});const age=ar.artist_type==='kid'?'kid':'adult';const imageUrl=await uploadToSupabaseStorage(req.file);const info=db.prepare('INSERT INTO artworks(artist_id,title,medium,size,price,description,image_url,availability,age_group,status) VALUES(?,?,?,?,?,?,?,?,?,?)').run(ar.id,req.body.title,req.body.medium,req.body.size||'',Number(req.body.price),req.body.description||'',imageUrl,'Available',age,'pending');res.json({id:info.lastInsertRowid,status:'pending',minimum_works:rule.min,maximum_works:rule.max,image_url:imageUrl})});
app.post('/api/orders', (req,res)=>{try{const {customer_name,customer_email,whatsapp,address,items=[]}=req.body;if(!items.length)return res.status(400).json({error:'Cart is empty'});const arts=items.filter(i=>i.type==='art'),sups=items.filter(i=>i.type==='supply');const artIds=arts.map(i=>Number(i.id)).filter(Boolean),supIds=sups.map(i=>Number(i.id)).filter(Boolean);const artRows=artIds.length?db.prepare(`SELECT a.id,a.title,a.price,a.artist_id FROM artworks a WHERE a.status='approved' AND a.id IN (${artIds.map(()=>'?').join(',')})`).all(...artIds):[];const supRows=supIds.length?db.prepare(`SELECT id,name title,price,stock FROM supplies WHERE active=1 AND id IN (${supIds.map(()=>'?').join(',')})`).all(...supIds):[];if(artRows.length!==new Set(artIds).size||supRows.length!==new Set(supIds).size)return res.status(400).json({error:'One or more items are unavailable'});let subtotal=0;const norm=[];arts.forEach(i=>{const a=artRows.find(x=>x.id===Number(i.id));const q=Math.max(1,Number(i.quantity)||1);subtotal+=a.price*q;norm.push({...a,type:'art',quantity:q})});sups.forEach(i=>{const s=supRows.find(x=>x.id===Number(i.id));const q=Math.max(1,Number(i.quantity)||1);if(q>s.stock)return res.status(400).json({error:s.title+' does not have enough stock'});subtotal+=s.price*q;norm.push({...s,type:'supply',quantity:q})});const commission=arts.reduce((sum,i)=>{const a=artRows.find(x=>x.id===Number(i.id));return sum+a.price*Math.max(1,Number(i.quantity)||1)*setting('sales_commission_percent')/100},0);const tx=db.transaction(()=>{const o=db.prepare('INSERT INTO orders(user_id,customer_name,customer_email,whatsapp,address,total,commission) VALUES(?,?,?,?,?,?,?)').run(req.session.user?.id||null,customer_name||'',customer_email||'',whatsapp||'',address||'',subtotal,commission);const ins=db.prepare('INSERT INTO order_items(order_id,item_type,item_id,title,price,quantity,artist_id) VALUES(?,?,?,?,?,?,?)');const upd=db.prepare('UPDATE supplies SET stock=stock-? WHERE id=?');norm.forEach(i=>{ins.run(o.lastInsertRowid,i.type,i.id,i.title,i.price,i.quantity,i.artist_id||null);if(i.type==='supply')upd.run(i.quantity,i.id);if(i.type==='art')recordArtistStat(i.artist_id,'sales',i.quantity)});return o.lastInsertRowid})();const orderItemsHtml=norm.map(i=>'<li>'+escHtml(i.title)+' × '+i.quantity+' — '+escHtml(String(i.price))+'</li>').join('');const waText='Hello AfricanArtistShop, I would like to place order #'+tx+'. Total: '+subtotal+'\\nCustomer: '+(customer_name||'')+'\\nPhone/WhatsApp: '+(whatsapp||'')+'\\nAddress: '+(address||'Not supplied')+'\\nPlease confirm payment and delivery.';const whatsapp_url='https://wa.me/2347031484486?text='+encodeURIComponent(waText);sendEmail({to:OWNER_EMAIL,subject:'AfricanArtistShop — New Order #'+tx,html:'<h2>New order received</h2><p><b>Order:</b> #'+tx+'<br><b>Total:</b> ₦'+Number(subtotal).toLocaleString()+'</p><p><b>Customer:</b> '+escHtml(customer_name||'Not supplied')+'<br><b>Email:</b> '+escHtml(customer_email||'Not supplied')+'<br><b>WhatsApp:</b> '+escHtml(whatsapp||'Not supplied')+'<br><b>Address:</b> '+escHtml(address||'Not supplied')+'</p><h3>Items</h3><ul>'+orderItemsHtml+'</ul><p><a href="'+whatsapp_url+'">Open WhatsApp order chat</a></p>'}).catch(()=>{});if(customer_email)sendEmail({to:customer_email,subject:'AfricanArtistShop — Order #'+tx+' received',html:'<h2>Order received</h2><p>Thank you. We received order <b>#'+tx+'</b> for <b>₦'+Number(subtotal).toLocaleString()+'</b>.</p><p>We will contact you to confirm payment and delivery.</p><ul>'+orderItemsHtml+'</ul>'}).catch(()=>{});res.json({order_id:tx,total:subtotal,commission,items:norm,whatsapp_url})}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/orders',auth,(req,res)=>res.json(db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.session.user.id)));

// Artist registration payments: kid ₦4,000/$3, professional ₦13,000/$10, signature free.
app.get('/api/artist/tiers',(req,res)=>res.json(TIER_RULES));
app.post('/api/artist/registration/payment',auth,rateLimit(6,60000),async(req,res)=>{try{const u=req.session.user;const type=['kid','professional','signature'].includes(req.body.artist_type)?req.body.artist_type:'professional';const currency=['NGN','USD'].includes(req.body.currency)?req.body.currency:'NGN';const rule=tierRule(type);const amount=rule.fee[currency];if(!amount)return res.json({free:true,artist_type:type,minimum_works:rule.min,maximum_works:rule.max});const existing=db.prepare('SELECT id FROM artists WHERE user_id=?').get(u.id);if(existing)return res.status(409).json({error:'Application already exists'});if(type==='kid'&&(!req.body.guardian_name||!req.body.guardian_phone))return res.status(400).json({error:'Parent/guardian details are required for kid artist registration'});const reference='AAS-'+u.id+'-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex');const origin=req.protocol+'://'+req.get('host');const meta={name:req.body.name||u.name,specialty:req.body.specialty||'',bio:req.body.bio||'',image_url:req.body.image_url||'',artist_type:type,age_group:type==='kid'?'4-18':'adult',guardian_name:req.body.guardian_name||'',guardian_phone:req.body.guardian_phone||''};db.prepare('INSERT INTO transactions(user_id,provider,reference,status,amount,currency,purpose,artist_type,metadata) VALUES(?,?,?,?,?,?,?,?,?)').run(u.id,'paystack',reference,'pending',amount,currency,'artist_registration',type,JSON.stringify(meta));const data=await paystack('/transaction/initialize',{method:'POST',body:JSON.stringify({email:u.email,amount:String(Math.round(amount*100)),currency,reference,callback_url:origin+'/api/artist/payment/callback',metadata:meta})});res.json({free:false,authorization_url:data.data.authorization_url,reference,artist_type:type,minimum_works:rule.min,maximum_works:rule.max,amount,currency})}catch(e){res.status(500).json({error:e.message})}});
async function finalizeArtistPayment(reference,sessionUser=null){const tx=db.prepare("SELECT * FROM transactions WHERE reference=? AND purpose='artist_registration'").get(reference);if(!tx)return false;if(tx.status==='success'){db.prepare("UPDATE users SET role='artist' WHERE id=?").run(tx.user_id);if(sessionUser?.id===tx.user_id)sessionUser.role='artist';return true;}const data=await paystack('/transaction/verify/'+encodeURIComponent(reference));const ok=data.data?.status==='success'&&Number(data.data.amount)===Math.round(tx.amount*100)&&data.data.currency===tx.currency;if(!ok)return false;db.prepare("UPDATE transactions SET status='success' WHERE id=?").run(tx.id);let ar=db.prepare('SELECT id FROM artists WHERE user_id=?').get(tx.user_id);if(!ar){const m=JSON.parse(tx.metadata||'{}');const info=db.prepare('INSERT INTO artists(user_id,name,specialty,bio,image_url,artist_type,age_group,guardian_name,guardian_phone,registration_paid,payment_reference,registration_currency,registration_amount,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(tx.user_id,m.name||'Artist',m.specialty||'',m.bio||'',m.image_url||'',tx.artist_type||'professional',m.age_group||'adult',m.guardian_name||'',m.guardian_phone||'',1,reference,tx.currency,tx.amount,'pending');ar={id:info.lastInsertRowid}}else{db.prepare('UPDATE artists SET registration_paid=1,payment_reference=?,registration_currency=?,registration_amount=? WHERE id=?').run(reference,tx.currency,tx.amount,ar.id)}db.prepare("UPDATE users SET role='artist' WHERE id=?").run(tx.user_id);if(sessionUser?.id===tx.user_id)sessionUser.role='artist';const paidUser=db.prepare('SELECT name,email FROM users WHERE id=?').get(tx.user_id);const meta=JSON.parse(tx.metadata||'{}');sendEmail({to:OWNER_EMAIL,subject:'AfricanArtistShop — Artist Registration Payment #'+reference,html:'<h2>Artist registration payment received</h2><p><b>Artist:</b> '+escHtml(meta.name||paidUser?.name||'Artist')+'</p><p><b>Type:</b> '+escHtml(tx.artist_type||'professional')+'<br><b>Amount:</b> '+escHtml(tx.currency)+' '+Number(tx.amount).toLocaleString()+'<br><b>Reference:</b> '+escHtml(reference)+'</p><p><b>Customer email:</b> '+escHtml(paidUser?.email||'')+'</p>'}).catch(()=>{});if(paidUser?.email)sendEmail({to:paidUser.email,subject:'AfricanArtistShop — Artist registration payment confirmed',html:'<h2>Payment confirmed</h2><p>Your '+escHtml(tx.artist_type||'professional')+' artist registration payment has been verified.</p><p><b>Reference:</b> '+escHtml(reference)+'</p><p>Your artist application is now in the review process. You can sign in to access your artist dashboard and upload your works.</p>'}).catch(()=>{});return true}
app.get('/api/artist/payment/callback',async(req,res)=>{try{const ok=await finalizeArtistPayment(req.query.reference,req.session.user||null);res.redirect('/?artist_payment='+(ok?'success':'failed'))}catch(e){res.redirect('/?artist_payment=failed')}});
app.post('/api/paystack/webhook',(req,res)=>{try{const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return res.sendStatus(200);const sig=req.headers['x-paystack-signature'];const hash=crypto.createHmac('sha512',secret).update(req.rawBody||Buffer.from(JSON.stringify(req.body))).digest('hex');if(!sig||hash!==sig)return res.sendStatus(401);if(req.body.event==='charge.success'&&req.body.data?.reference){finalizeArtistPayment(req.body.data.reference).catch(()=>{});}res.sendStatus(200)}catch(e){res.sendStatus(200)}});
app.get('/api/top-artists',(req,res)=>{const rows=db.prepare(`SELECT ar.id,ar.name,ar.specialty,ar.image_url,ar.artist_type,ar.age_group,COALESCE(s.views,0) views,COALESCE(s.sales,0) sales,(COALESCE(s.views,0)+COALESCE(s.sales,0)*10) score FROM artists ar LEFT JOIN artist_daily_stats s ON s.artist_id=ar.id AND s.day=? WHERE ar.status='approved' ORDER BY score DESC,ar.name LIMIT 30`).all(currentDay());const groups={kid:[],professional:[],signature:[]};rows.forEach(x=>{if(groups[x.artist_type])groups[x.artist_type].push(x)});const out=[];let i=0;while(out.length<10&&(groups.kid.length||groups.professional.length||groups.signature.length)){const k=['kid','professional','signature'][i%3];if(groups[k].length)out.push(groups[k].shift());i++}rows.forEach(x=>{if(out.length<10&&!out.some(y=>y.id===x.id))out.push(x)});res.json(out.slice(0,10))});
app.post('/api/training-requests',async(req,res)=>{try{const {child_name,child_age,guardian_name,guardian_phone,email,location,training_type,notes}=req.body;if(!child_name||!Number.isInteger(Number(child_age))||Number(child_age)<4||Number(child_age)>18||!guardian_name||!guardian_phone)return res.status(400).json({error:'Training registration requires a young artist aged 4–18 plus guardian details'});const r=db.prepare('INSERT INTO training_requests(user_id,child_name,child_age,guardian_name,guardian_phone,email,location,training_type,notes) VALUES(?,?,?,?,?,?,?,?,?)').run(req.session.user?.id||null,child_name,Number(child_age),guardian_name,guardian_phone,email||'',location||'',training_type||'',notes||'');const ref=r.lastInsertRowid;sendEmail({to:OWNER_EMAIL,subject:'AfricanArtistShop — Young Artist Training Request #'+ref,html:'<h2>New Young Artist Training Request</h2><p><b>Reference:</b> #'+ref+'</p><p><b>Young artist:</b> '+escHtml(child_name)+'<br><b>Age:</b> '+Number(child_age)+'</p><p><b>Parent/Guardian:</b> '+escHtml(guardian_name)+'<br><b>Phone:</b> '+escHtml(guardian_phone)+'</p><p><b>Email:</b> '+escHtml(email||'Not supplied')+'<br><b>Location:</b> '+escHtml(location||'Not supplied')+'<br><b>Training:</b> '+escHtml(training_type||'Not supplied')+'</p><p>'+escHtml(notes||'')+'</p>'}).catch(()=>{});if(email)sendEmail({to:email,subject:'AfricanArtistShop — Training Request Received #'+ref,html:'<h2>Training request received</h2><p>Thank you. We received the young artist training request. Your reference is <b>#'+ref+'</b>.</p><p>Our team will review the request and contact the parent/guardian using the details provided.</p>'}).catch(()=>{});res.json({id:ref,status:'pending',email_notice:!!process.env.RESEND_API_KEY})}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/admin/stats',auth,role('admin'),(req,res)=>res.json({users:db.prepare('SELECT COUNT(*) c FROM users').get().c,artists:db.prepare('SELECT COUNT(*) c FROM artists').get().c,artworks:db.prepare('SELECT COUNT(*) c FROM artworks').get().c,orders:db.prepare('SELECT COUNT(*) c FROM orders').get().c,supplies:db.prepare('SELECT COUNT(*) c FROM supplies WHERE active=1').get().c}));
app.get('/api/admin/pending',auth,role('admin'),(req,res)=>res.json({artists:db.prepare("SELECT * FROM artists WHERE status='pending'").all(),artworks:db.prepare(`SELECT a.*,ar.name artist_name FROM artworks a JOIN artists ar ON ar.id=a.artist_id WHERE a.status='pending'`).all()}));
app.patch('/api/admin/artists/:id',auth,role('admin'),(req,res)=>{const status=['approved','rejected','pending'].includes(req.body.status)?req.body.status:'pending';const ar=db.prepare('SELECT * FROM artists WHERE id=?').get(req.params.id);if(!ar)return res.status(404).json({error:'Artist not found'});if(status==='approved'){const rule=tierRule(ar.artist_type);const count=db.prepare('SELECT COUNT(*) c FROM artworks WHERE artist_id=? AND status IN (\'approved\',\'pending\')').get(ar.id).c;if(ar.artist_type!=='signature'&&!ar.registration_paid)return res.status(402).json({error:'Registration payment has not been verified'});if(count<rule.min||count>rule.max)return res.status(400).json({error:`${rule.label} must showcase between ${rule.min} and ${rule.max} works before approval`})}db.prepare('UPDATE artists SET status=? WHERE id=?').run(status,req.params.id);res.json({ok:true,status})});
app.patch('/api/admin/artworks/:id',auth,role('admin'),(req,res)=>{const status=['approved','rejected','pending'].includes(req.body.status)?req.body.status:'pending';db.prepare('UPDATE artworks SET status=? WHERE id=?').run(status,req.params.id);res.json({ok:true,status})});
app.patch('/api/admin/supplies/:id',auth,role('admin'),(req,res)=>{const {price,stock,active}=req.body;db.prepare('UPDATE supplies SET price=COALESCE(?,price),stock=COALESCE(?,stock),active=COALESCE(?,active) WHERE id=?').run(price??null,stock??null,active??null,req.params.id);res.json({ok:true})});
app.use(express.static(path.join(__dirname,'public'))); app.get('/*splat',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`AfricanArtistShop running on port ${PORT}`));