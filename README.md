# AfricanArtistShop V4 — production starter

This is a real full-stack starter you can turn into a hosted marketplace.

## Included
- Customer registration/login/session authentication
- Artist accounts and artist applications
- Artist dashboard
- Artwork upload with image storage
- Admin role + moderation endpoints
- Artwork approval workflow
- Artist approval workflow
- Marketplace search/filtering
- Individual artwork views
- Artist storefronts
- Cart
- Order records
- WhatsApp handoff
- SQLite database
- Payment architecture placeholder
- Responsive frontend

## Demo accounts
Admin:
admin@africanartistshop.com
password: demo1234

Artist demo:
peace@example.com
password: demo1234

## Run
Node.js 18+ recommended.

npm install
npm start

Open http://localhost:3000

## Before public launch
1. Change SESSION_SECRET.
2. Remove demo passwords/accounts.
3. Put the database on managed PostgreSQL (or another production DB).
4. Move image uploads to object storage such as S3-compatible storage.
5. Connect a payment provider and verify payment webhooks server-side.
6. Set a real WhatsApp Business number.
7. Add HTTPS and secure cookies in production.
8. Add email verification, password reset and rate limiting.
9. Add proper admin UI for moderation.
10. Define and implement listing fees, sales commissions, refunds, seller payouts, shipping, taxes and terms.
11. Replace all demo images with licensed/owned artist/product photography.
12. Add backups, monitoring and audit logs.

## Payment note
The starter intentionally does NOT pretend to have live payment processing. Orders are stored and handed off to WhatsApp; a payment provider can be connected using server-side credentials and webhooks.
