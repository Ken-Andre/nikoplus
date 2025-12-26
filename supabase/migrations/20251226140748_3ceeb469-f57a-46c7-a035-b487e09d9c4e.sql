-- Insert realistic test sales for Mr IsGroot (Douala) and Gerard Konde (Kribi)
-- Mr IsGroot: ~230,000 XAF total on 250,000 XAF target = 92%
-- Gerard Konde: ~120,000 XAF total on 500,000 XAF target = 24%

-- Sales for Mr IsGroot (seller in Douala) - December 2025
INSERT INTO sales (reference, boutique_id, seller_id, total_amount, payment_method, status, created_at, client_name, client_phone) VALUES
-- December 2025 sales for Mr IsGroot (~230k total)
('VTE-251201-001', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 45000, 'cash', 'completed', '2025-12-01 10:30:00+00', 'Client Douala 1', '+237 690 111 111'),
('VTE-251203-002', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 32000, 'mobile_money', 'completed', '2025-12-03 14:15:00+00', 'Client Douala 2', '+237 690 222 222'),
('VTE-251205-003', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 28000, 'cash', 'completed', '2025-12-05 09:45:00+00', 'Client Douala 3', NULL),
('VTE-251207-004', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 15000, 'mobile_money', 'completed', '2025-12-07 16:20:00+00', NULL, NULL),
('VTE-251209-005', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 22000, 'card', 'completed', '2025-12-09 11:00:00+00', 'Client Douala 4', '+237 690 333 333'),
('VTE-251211-006', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 18000, 'cash', 'completed', '2025-12-11 15:30:00+00', 'Client Douala 5', NULL),
('VTE-251213-007', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 12000, 'mobile_money', 'completed', '2025-12-13 10:00:00+00', NULL, NULL),
('VTE-251215-008', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 8500, 'cash', 'completed', '2025-12-15 14:45:00+00', 'Client Douala 6', '+237 690 444 444'),
('VTE-251217-009', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 16000, 'bank_transfer', 'completed', '2025-12-17 09:30:00+00', 'Client Douala 7', NULL),
('VTE-251219-010', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 9500, 'cash', 'completed', '2025-12-19 16:00:00+00', NULL, NULL),
('VTE-251221-011', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 24000, 'mobile_money', 'completed', '2025-12-21 11:15:00+00', 'Client Douala 8', '+237 690 555 555'),

-- November 2025 sales for Mr IsGroot (historical data for forecasts)
('VTE-251105-012', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 35000, 'cash', 'completed', '2025-11-05 10:00:00+00', 'Client Nov 1', NULL),
('VTE-251110-013', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 42000, 'mobile_money', 'completed', '2025-11-10 14:30:00+00', 'Client Nov 2', '+237 690 666 666'),
('VTE-251115-014', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 28000, 'cash', 'completed', '2025-11-15 09:00:00+00', NULL, NULL),
('VTE-251120-015', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 55000, 'card', 'completed', '2025-11-20 15:45:00+00', 'Client Nov 3', '+237 690 777 777'),
('VTE-251125-016', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 19000, 'mobile_money', 'completed', '2025-11-25 11:30:00+00', NULL, NULL),
('VTE-251128-017', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 31000, 'cash', 'completed', '2025-11-28 16:15:00+00', 'Client Nov 4', NULL),
('VTE-251130-018', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 23000, 'cash', 'completed', '2025-11-30 10:45:00+00', 'Client Nov 5', '+237 690 888 888'),

-- Sales for Gerard Konde (seller in Kribi) - December 2025 (~120k total)
('VTE-251202-019', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 18000, 'cash', 'completed', '2025-12-02 10:00:00+00', 'Client Kribi 1', '+237 691 111 111'),
('VTE-251204-020', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 15000, 'mobile_money', 'completed', '2025-12-04 14:30:00+00', 'Client Kribi 2', NULL),
('VTE-251206-021', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 22000, 'cash', 'completed', '2025-12-06 09:15:00+00', NULL, NULL),
('VTE-251210-022', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 8500, 'cash', 'completed', '2025-12-10 16:00:00+00', 'Client Kribi 3', '+237 691 222 222'),
('VTE-251214-023', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 12000, 'mobile_money', 'completed', '2025-12-14 11:30:00+00', NULL, NULL),
('VTE-251218-024', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 25000, 'card', 'completed', '2025-12-18 14:00:00+00', 'Client Kribi 4', '+237 691 333 333'),
('VTE-251222-025', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 19500, 'cash', 'completed', '2025-12-22 10:45:00+00', 'Client Kribi 5', NULL),

-- November 2025 sales for Gerard Konde (historical)
('VTE-251108-026', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 28000, 'cash', 'completed', '2025-11-08 10:30:00+00', 'Client K Nov 1', NULL),
('VTE-251112-027', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 35000, 'mobile_money', 'completed', '2025-11-12 15:00:00+00', 'Client K Nov 2', '+237 691 444 444'),
('VTE-251118-028', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 16000, 'cash', 'completed', '2025-11-18 09:45:00+00', NULL, NULL),
('VTE-251122-029', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 42000, 'card', 'completed', '2025-11-22 14:20:00+00', 'Client K Nov 3', '+237 691 555 555'),
('VTE-251126-030', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 21000, 'mobile_money', 'completed', '2025-11-26 11:00:00+00', NULL, NULL),

-- October 2025 historical sales for forecasts
('VTE-251005-031', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 48000, 'cash', 'completed', '2025-10-05 10:00:00+00', 'Client Oct 1', NULL),
('VTE-251012-032', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 33000, 'mobile_money', 'completed', '2025-10-12 14:30:00+00', 'Client Oct 2', '+237 690 999 999'),
('VTE-251020-033', '45e80e1e-82ea-477b-b6de-a61de9bef112', 'fb9d6112-fc57-4920-9389-e50621b3ea28', 27000, 'cash', 'completed', '2025-10-20 09:00:00+00', NULL, NULL),
('VTE-251025-034', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 38000, 'cash', 'completed', '2025-10-25 15:45:00+00', 'Client K Oct 1', NULL),
('VTE-251028-035', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', '433b7364-c00c-4226-ad7b-c82f01c5f411', 29000, 'mobile_money', 'completed', '2025-10-28 11:30:00+00', 'Client K Oct 2', '+237 691 666 666');

-- Create sales objectives for December 2025
-- Mr IsGroot: 250,000 XAF target (will be at ~92% with ~230k sales)
-- Gerard Konde: 500,000 XAF target (will be at ~24% with ~120k sales)
INSERT INTO sales_objectives (seller_id, boutique_id, month, year, target_amount, created_by) VALUES
('fb9d6112-fc57-4920-9389-e50621b3ea28', '45e80e1e-82ea-477b-b6de-a61de9bef112', 12, 2025, 250000, 'f2f38266-b824-49cf-87a0-364b754fb047'),
('433b7364-c00c-4226-ad7b-c82f01c5f411', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', 12, 2025, 500000, 'f2f38266-b824-49cf-87a0-364b754fb047');

-- Also add objectives for November 2025 for historical comparison
INSERT INTO sales_objectives (seller_id, boutique_id, month, year, target_amount, created_by) VALUES
('fb9d6112-fc57-4920-9389-e50621b3ea28', '45e80e1e-82ea-477b-b6de-a61de9bef112', 11, 2025, 200000, 'f2f38266-b824-49cf-87a0-364b754fb047'),
('433b7364-c00c-4226-ad7b-c82f01c5f411', 'fce6594d-5b33-47c6-95aa-d18ee3dd15e8', 11, 2025, 150000, 'f2f38266-b824-49cf-87a0-364b754fb047');