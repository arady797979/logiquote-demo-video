-- Fictional demo data for recording. Safe to re-run (wipes demo tables first).
TRUNCATE conversations, conversation_messages, rfqs, quotes, agent_decisions, pipeline_events, rfq_tags, customers RESTART IDENTITY;

INSERT INTO tag_definitions (name, color_hex, description) VALUES
  ('VIP', '#F59E0B', 'Top-tier account'),
  ('HotRFQ', '#EF4444', 'Pickup within 7 days'),
  ('Expedited', '#8B5CF6', 'Tight delivery window')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customers (customer_id, primary_email, display_name, company_name, tier, phone, last_seen_at) VALUES
  ('CUS-NLF', 'dana.whitfield@northlinefoods.com', 'Dana Whitfield', 'Northline Foods', 'VIP', '+1 312 555 0142', now() - interval '4 minutes'),
  ('CUS-SBS', 'marco.ruiz@summitbuildsupply.com', 'Marco Ruiz', 'Summit Build Supply', 'PREFERRED', '+1 713 555 0188', now() - interval '38 minutes'),
  ('CUS-BRH', 'priya.nair@bluerivergoods.com', 'Priya Nair', 'Blue River Home Goods', 'STANDARD', '+1 404 555 0117', now() - interval '2 hours'),
  ('CUS-CPA', 'tom.becker@cascadeparts.com', 'Tom Becker', 'Cascade Auto Parts', 'PREFERRED', '+1 206 555 0163', now() - interval '5 hours'),
  ('CUS-HLB', 'lena.ortiz@harborlinebev.com', 'Lena Ortiz', 'Harborline Beverages', 'STANDARD', '+1 305 555 0129', now() - interval '1 day');

INSERT INTO conversations (thread_id, customer_email, customer_id, customer_name, subject_snippet, status, email_category, rfq_id, unread_ops, last_message_at) VALUES
  ('thr-demo-1042', 'dana.whitfield@northlinefoods.com', 'CUS-NLF', 'Dana Whitfield · Northline Foods', 'RFQ: 42,000 lb dry van, Chicago → Dallas, pickup Oct 14', 'PENDING_APPROVAL', 'RFQ', 'RFQ-2026-1042', true, now() - interval '4 minutes'),
  ('thr-demo-1041', 'marco.ruiz@summitbuildsupply.com', 'CUS-SBS', 'Marco Ruiz · Summit Build Supply', 'Flatbed quote needed: Houston → New Orleans, 3 loads', 'QUOTED', 'RFQ', 'RFQ-2026-1041', true, now() - interval '38 minutes'),
  ('thr-demo-1039', 'priya.nair@bluerivergoods.com', 'CUS-BRH', 'Priya Nair · Blue River Home Goods', 'Atlanta → Miami dry van, Friday pickup?', 'SENT', 'RFQ', 'RFQ-2026-1039', false, now() - interval '2 hours'),
  ('thr-demo-1036', 'tom.becker@cascadeparts.com', 'CUS-CPA', 'Tom Becker · Cascade Auto Parts', 'Re: Seattle → LA quote — can you hold the rate until Monday?', 'NEEDS_REVIEW', 'CUSTOMER_FOLLOWUP', NULL, false, now() - interval '5 hours'),
  ('thr-demo-1033', 'lena.ortiz@harborlinebev.com', 'CUS-HLB', 'Lena Ortiz · Harborline Beverages', 'Reefer pricing for weekly NYC → Philadelphia lane', 'QUOTING', 'RFQ', 'RFQ-2026-1033', false, now() - interval '1 day');

INSERT INTO conversation_messages (conversation_id, thread_id, gmail_message_id, direction, from_email, snippet, received_at)
SELECT c.id, c.thread_id || '-m1', 'msg-' || c.thread_id, 'INBOUND', c.customer_email, c.subject_snippet, c.last_message_at FROM conversations c;

INSERT INTO rfqs (rfq_id, status, thread_id, raw_email_subject, customer_id, customer_email, customer_name, customer_tier,
  origin_zip, origin_city, origin_state, destination_zip, destination_city, destination_state,
  equipment_type, freight_mode, weight_lbs, pickup_date, delivery_date, requested_accessorials, received_at, quoted_at) VALUES
  ('RFQ-2026-1042', 'PENDING_APPROVAL', 'thr-demo-1042', 'RFQ: 42,000 lb dry van, Chicago → Dallas, pickup Oct 14', 'CUS-NLF', 'dana.whitfield@northlinefoods.com', 'Dana Whitfield', 'VIP',
   '60601', 'Chicago', 'IL', '75201', 'Dallas', 'TX', 'FTL_DRY_VAN', 'FTL', '42000', '2026-10-14', '2026-10-16', '["LIFTGATE","APPOINTMENT"]', now() - interval '4 minutes', now() - interval '3 minutes'),
  ('RFQ-2026-1041', 'QUOTED', 'thr-demo-1041', 'Flatbed quote needed: Houston → New Orleans, 3 loads', 'CUS-SBS', 'marco.ruiz@summitbuildsupply.com', 'Marco Ruiz', 'PREFERRED',
   '77001', 'Houston', 'TX', '70112', 'New Orleans', 'LA', 'FTL_FLATBED', 'FTL', '38500', '2026-10-09', '2026-10-10', '["TARPS"]', now() - interval '38 minutes', now() - interval '36 minutes'),
  ('RFQ-2026-1039', 'SENT', 'thr-demo-1039', 'Atlanta → Miami dry van, Friday pickup?', 'CUS-BRH', 'priya.nair@bluerivergoods.com', 'Priya Nair', 'STANDARD',
   '30301', 'Atlanta', 'GA', '33101', 'Miami', 'FL', 'FTL_DRY_VAN', 'FTL', '29000', '2026-10-09', '2026-10-11', '[]', now() - interval '2 hours', now() - interval '118 minutes'),
  ('RFQ-2026-1033', 'QUOTING', 'thr-demo-1033', 'Reefer pricing for weekly NYC → Philadelphia lane', 'CUS-HLB', 'lena.ortiz@harborlinebev.com', 'Lena Ortiz', 'STANDARD',
   '10001', 'New York', 'NY', '19101', 'Philadelphia', 'PA', 'FTL_REEFER', 'FTL', '36000', '2026-10-12', '2026-10-12', '["APPOINTMENT"]', now() - interval '1 day', NULL);

INSERT INTO quotes (quote_id, rfq_id, rate_source, confidence_score, confidence_breakdown_json, selected_option_tier, options_json, total_amount, expires_at) VALUES
  ('Q-2026-1042-A', 'RFQ-2026-1042', 'CONTRACTED_TARIFF', 94,
   '{"rateSource":40,"laneHistory":28,"dataCompleteness":26}',
   'STANDARD',
   '[{"tier":"ECONOMY","totalPrice":2148,"lineItems":[{"description":"Linehaul (925 mi @ $2.05)","amount":1896},{"description":"Fuel surcharge","amount":252}]},
     {"tier":"STANDARD","totalPrice":2318,"lineItems":[{"description":"Linehaul (925 mi @ $2.18)","amount":2017},{"description":"Fuel surcharge","amount":176},{"description":"Liftgate","amount":75.00},{"description":"Delivery appointment","amount":50.00}]},
     {"tier":"EXPRESS","totalPrice":2764,"lineItems":[{"description":"Team linehaul (925 mi @ $2.62)","amount":2424},{"description":"Fuel surcharge","amount":215},{"description":"Liftgate","amount":75.00},{"description":"Delivery appointment","amount":50.00}]}]',
   2318.00, now() + interval '48 hours'),
  ('Q-2026-1041-A', 'RFQ-2026-1041', 'CONTRACTED_TARIFF', 89, '{"rateSource":38,"laneHistory":27,"dataCompleteness":24}', 'STANDARD',
   '[{"tier":"STANDARD","totalPrice":1286.00,"lineItems":[{"description":"Linehaul (350 mi)","amount":1046.00},{"description":"Fuel surcharge","amount":140.00},{"description":"Tarping","amount":100.00}]}]', 1286.00, now() + interval '48 hours'),
  ('Q-2026-1039-A', 'RFQ-2026-1039', 'CONTRACTED_TARIFF', 92, '{"rateSource":40,"laneHistory":26,"dataCompleteness":26}', 'STANDARD',
   '[{"tier":"STANDARD","totalPrice":1612.00,"lineItems":[{"description":"Linehaul (662 mi)","amount":1403.00},{"description":"Fuel surcharge","amount":209.00}]}]', 1612.00, now() + interval '24 hours');

INSERT INTO agent_decisions (rfq_id, quote_id, auto_approve, confidence_score, sla_status_json, checked_rules_json, explanation) VALUES
  ('RFQ-2026-1042', 'Q-2026-1042-A', false, 94,
   '{"tier":"VIP","responseDueMinutes":30,"elapsedMinutes":4,"status":"ON_TRACK"}',
   '["Contracted tariff found for 60601 → 75201 (Werner, FTL dry van)","Margin 18.4% is within VIP band (15–22%)","All accessorials priced from rules table","Pickup Oct 14 is inside the 7-day hot window","VIP account: human approval required before send"]',
   'Priced from the contracted Werner tariff with live fuel surcharge. Margin and accessorials pass every rule; holding for approval because Northline Foods is a VIP account.'),
  ('RFQ-2026-1039', 'Q-2026-1039-A', true, 92, '{"tier":"STANDARD","status":"MET"}', '["Contracted tariff found","Margin within band"]', 'Auto-approved and sent.');

INSERT INTO rfq_tags (rfq_id, tag_id, tag_name, tag_color_hex, assigned_by)
SELECT 'RFQ-2026-1042', id, name, color_hex, 'AGENT_INGESTION' FROM tag_definitions WHERE name IN ('VIP', 'HotRFQ');

INSERT INTO pipeline_events (rfq_id, source, message, level, created_at) VALUES
  ('RFQ-2026-1042', 'GMAIL_WEBHOOK', 'New email from dana.whitfield@northlinefoods.com', 'info', now() - interval '240 seconds'),
  ('RFQ-2026-1042', 'INGESTION_AGENT', 'Classified as RFQ · extracted 11 fields (Chicago, IL → Dallas, TX, 42,000 lb, dry van)', 'info', now() - interval '232 seconds'),
  ('RFQ-2026-1042', 'QUOTING_AGENT', 'Matched contracted tariff WRN-001 · 3 options priced', 'info', now() - interval '214 seconds'),
  ('RFQ-2026-1042', 'DECISION_AGENT', 'Confidence 94% · VIP rule → awaiting human approval', 'info', now() - interval '205 seconds');
