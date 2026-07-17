-- Supabase SQL Schema for line-amidamaru
-- Execute this in the Supabase SQL Editor

-- 抽選イベント テーブル
CREATE TABLE IF NOT EXISTS lotteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_line_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'registration',
  max_participants INTEGER NOT NULL DEFAULT 100,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  amida_hash TEXT,
  amida_data JSONB,
  CONSTRAINT valid_phase CHECK (phase IN ('registration', 'closed', 'amida_generated', 'completed'))
);

-- 参加者 テーブル
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  line_display_name TEXT NOT NULL,
  assigned_column INTEGER,
  result_prize_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(lottery_id, line_user_id)
);

-- 景品 テーブル
CREATE TABLE IF NOT EXISTS prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  goal_column INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 抽選結果 テーブル
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prizes(id),
  final_column INTEGER NOT NULL,
  fall_path JSONB, -- 落下経路の記録
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_lotteries_group_line_id ON lotteries(group_line_id);
CREATE INDEX idx_lotteries_phase ON lotteries(phase);
CREATE INDEX idx_lotteries_deadline ON lotteries(registration_deadline);
CREATE INDEX idx_participants_lottery_id ON participants(lottery_id);
CREATE INDEX idx_participants_line_user_id ON participants(line_user_id);
CREATE INDEX idx_prizes_lottery_id ON prizes(lottery_id);
CREATE INDEX idx_results_lottery_id ON results(lottery_id);

-- Row Level Security (RLS) ポリシー
ALTER TABLE lotteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
