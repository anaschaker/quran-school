-- Seed default school settings in the Setting table.
-- Public pages read these values and fall back to src/config/school.ts when absent.

INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES
  ('school.name', 'مدرسة القرآن الكريم', datetime('now')),
  ('school.phone', '0500000000', datetime('now')),
  ('school.address', 'الرياض، المملكة العربية السعودية', datetime('now')),
  ('school.hours', '[{"days":"الأحد - الخميس","time":"8:00 صباحًا - 5:00 مساءً"},{"days":"السبت","time":"9:00 صباحًا - 1:00 مساءً"},{"days":"الجمعة","time":"مغلق"}]', datetime('now')),
  ('school.about.intro', 'مدرسة القرآن الكريم مساحة تعليمية تُعنى بخدمة كتاب الله تعالى وتعليمه للناشئة والأجيال، من خلال حلقات منتظمة ومعلمين متخصصين ومنهج متدرّج يراعي الفروق الفردية.', datetime('now'));
