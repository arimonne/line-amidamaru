// あみだくじ抽選の全体型定義

/**
 * 抽選イベントの状態
 */
export type LotteryPhase = 'registration' | 'closed' | 'amida_generated' | 'completed';

/**
 * 抽選イベント
 */
export interface Lottery {
  id: string;
  group_line_id: string;
  title: string;
  description?: string;
  phase: LotteryPhase;
  max_participants: number;
  registration_deadline: string; // ISO 8601
  created_at: string;
  updated_at: string;
  amida_hash?: string; // Phase 2で生成
  amida_data?: AmidaData; // Phase 4で公開
}

/**
 * 参加者
 */
export interface Participant {
  id: string;
  lottery_id: string;
  line_user_id: string;
  line_display_name: string;
  assigned_column?: number; // Phase 3で割り当て
  result_prize_id?: string; // Phase 4で確定
  created_at: string;
}

/**
 * 景品
 */
export interface Prize {
  id: string;
  lottery_id: string;
  name: string;
  description?: string;
  quantity: number;
  goal_column?: number; // Phase 2でシャッフル後に割り当て
  created_at: string;
}

/**
 * あみだくじの構造
 */
export interface AmidaData {
  columns: number; // 列数（参加者数と同じ）
  bars: Bar[]; // 横線の配列
  goals: GoalPosition[]; // ゴール位置の景品配置
  seed: string; // 乱数シード（ハッシュ検証用）
}

/**
 * あみだくじの横線
 */
export interface Bar {
  from_column: number;
  to_column: number;
}

/**
 * ゴール位置の景品
 */
export interface GoalPosition {
  column: number;
  prize_id: string;
  prize_name: string;
}

/**
 * あみだ落下の軌跡（アニメーション用）
 */
export interface FallPath {
  participant_id: string;
  line_user_id: string;
  assigned_column: number;
  path: number[]; // 各行での列番号の遷移
  final_column: number; // 最終ゴール列
  result_prize: Prize;
}
