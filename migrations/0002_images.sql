-- 手记多图支持：新增 images（JSON 数组）列
ALTER TABLE records ADD COLUMN images TEXT NOT NULL DEFAULT '[]';
