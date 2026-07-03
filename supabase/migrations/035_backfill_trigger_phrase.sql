-- 035_backfill_trigger_phrase.sql
-- 기존 wrong_answers 42개 row의 explanation을 분석해 trigger_phrase 역추출 백필
-- (1회성 데이터 백필 — wrong_answers_rows.csv가 프로젝트에 없어 DB에서 직접 조회 후 작성)

UPDATE wrong_answers SET trigger_phrase = 'direct quote (FC per $)' WHERE id = '9f947672-5d95-4d2e-b9b8-b5a55f3fe621';
UPDATE wrong_answers SET trigger_phrase = '"Units of FC per dollar" decreases' WHERE id = 'bf3cee81-74c0-4435-8e47-766b584452d6';
UPDATE wrong_answers SET trigger_phrase = 'interest payable June 30 and December 31' WHERE id = 'a40b666e-07f2-4473-8a3f-34c409bbce04';
UPDATE wrong_answers SET trigger_phrase = 'quarterly payment' WHERE id = 'a417e3e2-93f0-422a-982e-630319ed0b5f';
UPDATE wrong_answers SET trigger_phrase = 'units of foreign currency per dollar' WHERE id = '0f6915a3-5452-48f4-af67-d3354be6ce5f';
UPDATE wrong_answers SET trigger_phrase = 'Yield 7% < coupon 8%' WHERE id = '7b851e81-c1aa-4ff4-aef5-7e2503f8c897';
UPDATE wrong_answers SET trigger_phrase = 'NOT subject to intraperiod income tax allocation' WHERE id = '4359e4b1-4c05-4e72-81f6-7a88f7f407ab';
UPDATE wrong_answers SET trigger_phrase = 'tax-basis accounting' WHERE id = '8b636e5d-9ef3-4b68-932d-f5a0af5d31e9';
UPDATE wrong_answers SET trigger_phrase = 'Life insurance proceeds (nontaxable)' WHERE id = '945abf60-ac89-45e9-a14c-7a7895bf0fad';
UPDATE wrong_answers SET trigger_phrase = 'Equipment FV excess $100K × 40% ÷ 5 years' WHERE id = '9aacd27f-315f-477a-b631-d7f1e16f66df';
UPDATE wrong_answers SET trigger_phrase = 'units of foreign currency per dollar' WHERE id = '363b83fd-df6a-423b-b273-d351c146f243';
UPDATE wrong_answers SET trigger_phrase = 'RE = $395,000' WHERE id = '6b73fdad-0f0c-4d2b-b42e-c93771a3e8cd';
UPDATE wrong_answers SET trigger_phrase = 'Year 1 FV $245,000' WHERE id = 'd75066c5-86d6-42c9-a1be-60b1ea9da1c1';
UPDATE wrong_answers SET trigger_phrase = 'Year 1 FV $51,000' WHERE id = 'e90d9d4e-60c3-4aca-b867-766bb324a536';
UPDATE wrong_answers SET trigger_phrase = 'after-tax interest adjustment' WHERE id = '7035db29-afe5-413a-b5b3-e9b5b1c04384';
UPDATE wrong_answers SET trigger_phrase = 'were recorded' WHERE id = '4cf8d969-f5cc-4da5-b069-993d979e2394';
UPDATE wrong_answers SET trigger_phrase = 'What is the effect on December 31 inventory' WHERE id = '74d24dce-06a8-49cb-9b82-54ef369e27ff';
UPDATE wrong_answers SET trigger_phrase = 'agrees to reroute' WHERE id = '10193755-249d-433b-a79e-3fa107fb752b';
UPDATE wrong_answers SET trigger_phrase = 'collects the remaining $300,000 pledge receivable' WHERE id = '264acc13-fca5-4e95-9902-2205d3f5cf54';
UPDATE wrong_answers SET trigger_phrase = 'cash used carries donor restrictions' WHERE id = 'febe7de2-33e9-47e1-9b70-50e051c14fb3';
UPDATE wrong_answers SET trigger_phrase = '3 mechanisms for recognizing impairment' WHERE id = '581329a3-17df-4635-8378-9407a4b9079d';
UPDATE wrong_answers SET trigger_phrase = '4 application axes' WHERE id = 'f8b43076-bf41-4b20-a2a7-c1dfce78d506';
UPDATE wrong_answers SET trigger_phrase = 'issued at par' WHERE id = '8674a1b4-f9de-41f7-8955-9eb341dba057';
UPDATE wrong_answers SET trigger_phrase = 'Dividends of $6,500 are received' WHERE id = '45eb89e6-3fdf-4410-a71d-dd1635a5c291';
UPDATE wrong_answers SET trigger_phrase = 'Interest Payable increases by $10,000' WHERE id = 'f761f98a-264d-4f36-8530-26dfec326727';
UPDATE wrong_answers SET trigger_phrase = 'paid on Drexon company stock' WHERE id = 'c48e1fab-38d2-4a18-8773-15493f5eb803';
UPDATE wrong_answers SET trigger_phrase = 'sold a tract of land for $40,000 cash' WHERE id = 'eaef8730-b773-4133-b119-c5a2181a0348';
UPDATE wrong_answers SET trigger_phrase = 'a note for $60,000, payable in 95 days' WHERE id = '60d2f36c-f6cc-40b0-bca8-c38193facede';
UPDATE wrong_answers SET trigger_phrase = '6,000 shares of the company''s no-par common stock' WHERE id = '4a3254f5-d72c-41da-8dfb-0936aa73d6d3';
UPDATE wrong_answers SET trigger_phrase = 'under the net method' WHERE id = '0211a3d4-d7ec-4321-9bb0-e1aa93690766';
UPDATE wrong_answers SET trigger_phrase = 'under the gross method' WHERE id = 'e1520865-40f8-45ed-a98b-41ad4d34d053';
UPDATE wrong_answers SET trigger_phrase = 'produced as a discrete project' WHERE id = 'c9cc1716-7c6b-42a6-9b76-32cbbb41476a';
UPDATE wrong_answers SET trigger_phrase = 'accumulated depreciation of $35,000' WHERE id = '5f6bdb2c-7074-4935-ae30-15f05d9aead6';
UPDATE wrong_answers SET trigger_phrase = 'two requirements for recognizing a cost as a contract cost asset' WHERE id = 'bf54eaa2-7e49-43fa-a891-626c236923ca';
UPDATE wrong_answers SET trigger_phrase = 'Style paid $5,000 dividends' WHERE id = 'ed40ff8e-52a9-41c0-802b-20324a5bd6c3';
UPDATE wrong_answers SET trigger_phrase = 'Statement of Stockholders'' Equity' WHERE id = '4ab13806-9b0c-4221-b176-5d0bd8a2ea09';
UPDATE wrong_answers SET trigger_phrase = 'incorrectly recorded' WHERE id = 'b25e1662-af2c-4072-8bd5-a8922d197933';
UPDATE wrong_answers SET trigger_phrase = '3-for-1 stock split' WHERE id = 'fec0466e-730f-4a03-b657-c52ec9855bac';
UPDATE wrong_answers SET trigger_phrase = 'impaired from $40,000 to $35,000' WHERE id = 'a2379780-6129-4287-82f6-6e97dbb62baa';
UPDATE wrong_answers SET trigger_phrase = '$18,000 net loss in Year 1 at a constant rate' WHERE id = '56506023-bc6e-41b9-9f27-452cf43f3143';
UPDATE wrong_answers SET trigger_phrase = 'Gain on disposal of discontinued segment' WHERE id = 'f41801e5-edcc-4d69-8489-4da8c807f986';
UPDATE wrong_answers SET trigger_phrase = 'collected full payment' WHERE id = '6ef636f7-3f1f-48d9-859b-25104d41710b';
