-- 038_wrong_answers_trap_category.sql
-- wrong_answers에 trap_category(1~4) 컬럼 추가 + 기존 42건 수동 재분류 백필
-- 1=개념선택실수 2=무관개념적용 3=트리거문구인식실패 4=계산절차실수
-- 분류 기준: 절차 누락처럼 보여도 원인이 개념 오류면 1·2로 분류 (2026-07-03 판단)

ALTER TABLE wrong_answers
  ADD COLUMN trap_category smallint CHECK (trap_category BETWEEN 1 AND 4);

COMMENT ON COLUMN wrong_answers.trap_category IS '1=개념선택실수 2=무관개념적용 3=트리거문구인식실패 4=계산절차실수';

UPDATE wrong_answers AS w
SET trap_category = t.category
FROM (VALUES
  ('a2379780-6129-4287-82f6-6e97dbb62baa'::uuid, 1),
  ('e90d9d4e-60c3-4aca-b867-766bb324a536'::uuid, 1),
  ('7b851e81-c1aa-4ff4-aef5-7e2503f8c897'::uuid, 1),
  ('7035db29-afe5-413a-b5b3-e9b5b1c04384'::uuid, 1),
  ('d75066c5-86d6-42c9-a1be-60b1ea9da1c1'::uuid, 1),
  ('56506023-bc6e-41b9-9f27-452cf43f3143'::uuid, 1),
  ('b25e1662-af2c-4072-8bd5-a8922d197933'::uuid, 1),
  ('9f947672-5d95-4d2e-b9b8-b5a55f3fe621'::uuid, 1),
  ('0211a3d4-d7ec-4321-9bb0-e1aa93690766'::uuid, 1),
  ('e1520865-40f8-45ed-a98b-41ad4d34d053'::uuid, 1),
  ('74d24dce-06a8-49cb-9b82-54ef369e27ff'::uuid, 1),
  ('f761f98a-264d-4f36-8530-26dfec326727'::uuid, 1),
  ('f41801e5-edcc-4d69-8489-4da8c807f986'::uuid, 1),
  ('581329a3-17df-4635-8378-9407a4b9079d'::uuid, 1),
  ('4359e4b1-4c05-4e72-81f6-7a88f7f407ab'::uuid, 1),
  ('4a3254f5-d72c-41da-8dfb-0936aa73d6d3'::uuid, 1),
  ('60d2f36c-f6cc-40b0-bca8-c38193facede'::uuid, 1),
  ('eaef8730-b773-4133-b119-c5a2181a0348'::uuid, 1),
  ('4ab13806-9b0c-4221-b176-5d0bd8a2ea09'::uuid, 1),

  ('945abf60-ac89-45e9-a14c-7a7895bf0fad'::uuid, 2),
  ('8b636e5d-9ef3-4b68-932d-f5a0af5d31e9'::uuid, 2),
  ('ed40ff8e-52a9-41c0-802b-20324a5bd6c3'::uuid, 2),
  ('c9cc1716-7c6b-42a6-9b76-32cbbb41476a'::uuid, 2),
  ('10193755-249d-433b-a79e-3fa107fb752b'::uuid, 2),
  ('febe7de2-33e9-47e1-9b70-50e051c14fb3'::uuid, 2),
  ('45eb89e6-3fdf-4410-a71d-dd1635a5c291'::uuid, 2),
  ('8674a1b4-f9de-41f7-8955-9eb341dba057'::uuid, 2),
  ('264acc13-fca5-4e95-9902-2205d3f5cf54'::uuid, 2),
  ('c48e1fab-38d2-4a18-8773-15493f5eb803'::uuid, 2),

  ('a40b666e-07f2-4473-8a3f-34c409bbce04'::uuid, 3),
  ('0f6915a3-5452-48f4-af67-d3354be6ce5f'::uuid, 3),
  ('363b83fd-df6a-423b-b273-d351c146f243'::uuid, 3),
  ('a417e3e2-93f0-422a-982e-630319ed0b5f'::uuid, 3),
  ('4cf8d969-f5cc-4da5-b069-993d979e2394'::uuid, 3),
  ('bf3cee81-74c0-4435-8e47-766b584452d6'::uuid, 3),

  ('6b73fdad-0f0c-4d2b-b42e-c93771a3e8cd'::uuid, 4),
  ('9aacd27f-315f-477a-b631-d7f1e16f66df'::uuid, 4),
  ('5f6bdb2c-7074-4935-ae30-15f05d9aead6'::uuid, 4),
  ('6ef636f7-3f1f-48d9-859b-25104d41710b'::uuid, 4),
  ('f8b43076-bf41-4b20-a2a7-c1dfce78d506'::uuid, 4),
  ('bf54eaa2-7e49-43fa-a891-626c236923ca'::uuid, 4),
  ('fec0466e-730f-4a03-b657-c52ec9855bac'::uuid, 4)
) AS t(id, category)
WHERE w.id = t.id;
