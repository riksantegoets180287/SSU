/*
# Seed initial data for Summa Plus

## Overview
Populates all tables with the same seed data that was previously
hardcoded in storage.ts (INITIAL_CATEGORIES, INITIAL_MATERIALS,
INITIAL_MENU_ITEMS, INITIAL_TICKETS). This ensures the app has
data on first load when using Supabase instead of localStorage.

## Tables affected
1. categories — 5 rows
2. materials — 19 rows
3. menu_items — 4 rows
4. service_tickets — 4 rows (3 service + 1 horeca)
5. meal_order_items — 2 rows (linked to horeca tickets)

## Notes
- Uses ON CONFLICT DO NOTHING so re-running is safe.
- Students and teachers tables are intentionally left empty
  (INITIAL_STUDENTS and INITIAL_TEACHERS were empty arrays).
- Loans table is left empty (INITIAL_LOANS was empty).
*/

INSERT INTO categories (id, name) VALUES
  ('cat-servies', 'Servies & Keuken'),
  ('cat-opladers', 'Opladers & ICT'),
  ('cat-schoonmaak', 'Schoonmaak & Facilitair'),
  ('cat-diensten', 'Diensten & Balie'),
  ('cat-overig', 'Overig')
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (id, name, category_id, total_quantity, optional_barcode, optional_image_url, notes, created_at) VALUES
  ('mat-bord', 'Bord', 'cat-servies', 30, 'SUM-SRV-001', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80', 'Porseleinen plat dinerbord (wit) voor lunch, bijeenkomsten en catering.', now()),
  ('mat-broodmes', 'Broodmes', 'cat-servies', 4, 'SUM-SRV-002', 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80', 'Gekarteld RVS broodmes voor het snijden van stokbrood en broden.', now()),
  ('mat-emmer', 'Emmer', 'cat-schoonmaak', 8, 'SUM-SCH-003', 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80', 'Stevige schoonmaakemmer (10 liter) met ergonomisch handvat.', now()),
  ('mat-gebaksvorkje', 'Gebaksvorkje', 'cat-servies', 35, 'SUM-SRV-004', 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80', 'RVS klein gebaksvorkje voor taart, vieringen en presentaties.', now()),
  ('mat-iphone-oplader-usbc', 'iPhone Oplader USB-C', 'cat-opladers', 8, 'SUM-ICT-005', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80', 'Apple snellader adapter met USB-C kabel voor iPhone en iPad.', now()),
  ('mat-kop-en-schotel', 'Kop en Schotel', 'cat-servies', 24, 'SUM-SRV-006', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 'Klassiek wit porseleinen koffiekopje inclusief bijpassend schoteltje.', now()),
  ('mat-kopieerservice', 'Kopieerservice', 'cat-diensten', 10, 'SUM-DNS-007', 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80', 'Baliedienst: printen, kopiëren en scannen van lesmateriaal en formulieren (A4/A3).', now()),
  ('mat-stofzuiger', 'Stofzuiger', 'cat-schoonmaak', 3, 'SUM-SCH-008', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80', 'Professionele sledestofzuiger met telescopische stang en combizuigmond.', now()),
  ('mat-trappenhal-opruimen', 'Trappenhal opruimen en stofzuigen', 'cat-diensten', 5, 'SUM-DNS-009', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80', 'Facilitair team voor het netjes maken, vegen en stofzuigen van de trappenhal en overlopen.', now()),
  ('mat-veger-en-blik', 'Veger en Blik', 'cat-schoonmaak', 8, 'SUM-SCH-010', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80', 'Handveger met fijne borstelharen en stevig metalen/kunststof blik.', now()),
  ('mat-vork', 'Vork', 'cat-servies', 40, 'SUM-SRV-011', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', 'RVS diner vork voor lunch en buffet.', now()),
  ('mat-lamineerservice', 'Lamineerservice', 'cat-diensten', 6, 'SUM-DNS-012', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80', 'Baliedienst: lamineren van instructiebladen, badges en leskaarten (A4 en A3).', now()),
  ('mat-lepel', 'Lepel', 'cat-servies', 40, 'SUM-SRV-013', 'https://images.unsplash.com/photo-1589135233689-d562f1d94068?auto=format&fit=crop&w=600&q=80', 'RVS diner lepel / eetlepel voor soep en gerechten.', now()),
  ('mat-mes', 'Mes', 'cat-servies', 40, 'SUM-SRV-014', 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80', 'RVS dinermes voor lunch en maaltijden.', now()),
  ('mat-microvezeldoekje', 'Microvezeldoekje', 'cat-schoonmaak', 25, 'SUM-SCH-015', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80', 'Zacht microvezel schoonmaakdoekje voor bureaus, touchscreens en meubilair.', now()),
  ('mat-oplader-laptop-pin', 'Oplader Laptop (Ronde Pin)', 'cat-opladers', 6, 'SUM-ICT-016', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80', 'Universele laptopvoeding met ronde DC pin aansluiting (geschikt voor HP/Lenovo).', now()),
  ('mat-oplader-laptop-usbc', 'Oplader Laptop (USB-C 65W)', 'cat-opladers', 10, 'SUM-ICT-017', 'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?auto=format&fit=crop&w=600&q=80', 'Snelle 65W USB-C Power Delivery oplader voor moderne laptops, Chromebooks en MacBooks.', now()),
  ('mat-samsung-oplader-usbc', 'Samsung Oplader USB-C', 'cat-opladers', 8, 'SUM-ICT-018', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80', 'Originele Samsung 25W Super Fast Charger adapter met USB-C naar USB-C kabel.', now()),
  ('mat-schoteltje', 'Schoteltje', 'cat-servies', 25, 'SUM-SRV-019', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', 'Los porseleinen schoteltje voor koffie, cake, koekjes of theezakjes.', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, name, description, price, category, image_url, max_daily_portions, active, dietary_tag) VALUES
  ('dish-boerenkool', 'Boerenkool met Ambachtelijke Rookworst', 'Verse romige boerenkoolstamppot met knapperige spekjes, Gelderse rookworst en huisgemaakte mosterdjus.', '€ 4,50', 'hoofdgerecht', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 25, true, 'Specialiteit vd Week'),
  ('dish-tomatensoep', 'Verse Romige Tomaten-Groentesoep', 'Rijkgevulde huisgemaakte soep met soepballetjes en verse kruiden, geserveerd met een ovenvers breekbroodje en kruidenboter.', '€ 3,00', 'soep', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', 20, true, 'Huisgemaakt'),
  ('dish-broodje-warm-vlees', 'Broodje Warm Vlees met Satésaus', 'Knapperig pistoletje rijkelijk belegd met gekruid warm varkensvlees, warme pindasaus en krokante gebakken uitjes.', '€ 3,75', 'broodje', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', 18, true, 'Warm belegd'),
  ('dish-quiche-vega', 'Vegetarische Seizoensquiche & Salade', 'Ambachtelijk gebakken hartige taart met seizoensgroenten en geitenkaas, geserveerd met een frisse gemengde rauwkostsalade.', '€ 4,00', 'hoofdgerecht', 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=800&q=80', 15, true, 'Vegetarisch 🌱')
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_tickets (id, ticket_number, title, description, category, priority, location, requester_name, requester_team, status, created_at) VALUES
  ('ticket-ict-1', 'TK-1001', 'Digibord scherm blijft zwart in lokaal 2.14', 'Digibord gaat niet aan via wandpaneel of HDMI-kabel. Graag nakijken voor volgende les.', 'ict_av', 'spoed', 'Lokaal 2.14', 'Marlies van der Linden', 'VOAT', 'open', now()),
  ('ticket-meubilair-1', 'TK-1002', '12 extra stoelen en 2 tafels plaatsen in 1.05', 'Voor toetsafname zijn er extra tafels en stoelen nodig in een rechte opstelling.', 'meubilair', 'normaal', 'Lokaal 1.05', 'Peter Bakker', 'Entree', 'in_behandeling', now()),
  ('ticket-vergader-1', 'TK-1003', 'Vergaderruimte klaarzetten: Bestuurskamer 0.12 (U-vorm)', '📋 TAAK: Vergaderruimte klaarzetten
📍 Lokaal / Ruimte: Bestuurskamer 0.12
📐 Gewenste Opstelling: U-vorm (14 personen)
☕ Koffie & Thee: JA, graag klaarzetten met kannen/bekers
🗓 Datum & Tijd: Vandaag om 13:30 uur
📝 Bijzonderheden: Flipover en whiteboardstiften klaarleggen.', 'evenement', 'normaal', 'Bestuurskamer 0.12', 'Astrid Somers', 'OOP', 'open', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_tickets (id, ticket_number, title, description, category, priority, location, requester_name, requester_team, status, desired_date, meal_pickup_time, total_portions, created_at) VALUES
  ('ticket-horeca-1', 'HC-2001', 'Maaltijdbestelling: 2x Boerenkool met Rookworst', 'Maaltijdbestelling geplaatst voor afhalen om 12:15 aan de DV Balie.
Bestelde gerechten: 2x Boerenkool met Ambachtelijke Rookworst
Dieetwensen: Geen', 'horeca', 'normaal', 'Summa Plus DV Balie (Blécourtstraat)', 'Koen de Vries', 'VIA', 'open', CURRENT_DATE::text, '12:15', 2, now()),
  ('ticket-horeca-2', 'HC-2002', 'Maaltijdbestelling: 1x Broodje Warm Vlees', 'Maaltijdbestelling geplaatst voor afhalen om 11:45 aan de DV Balie.
Bestelde gerechten: 1x Broodje Warm Vlees met Satésaus
Dieetwensen: Geen', 'horeca', 'normaal', 'Summa Plus DV Balie (Blécourtstraat)', 'Ingrid Meijer', 'VOAT', 'afgerond', CURRENT_DATE::text, '11:45', 1, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO meal_order_items (ticket_id, menu_item_id, name, portions, price, category) VALUES
  ('ticket-horeca-1', 'dish-boerenkool', 'Boerenkool met Ambachtelijke Rookworst', 2, '€ 4,50', 'hoofdgerecht'),
  ('ticket-horeca-2', 'dish-broodje-warm-vlees', 'Broodje Warm Vlees met Satésaus', 1, '€ 3,75', 'broodje')
ON CONFLICT DO NOTHING;
