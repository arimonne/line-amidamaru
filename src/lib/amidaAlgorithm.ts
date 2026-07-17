import { AmidaData, Bar, GoalPosition, FallPath, Prize, Participant } from '@/types';
import CryptoJS from 'crypto-js';

/**
 * あみだくじのコア実装
 */

/**
 * N列のあみだくじを生成
 * @param columns 列数（参加者数）
 * @param seed 乱数シード（再現性のため）
 * @returns あみだくじデータ
 */
export function generateAmida(columns: number, seed: string): AmidaData {
  // シードベースの疑似乱数生成器
  const random = createSeededRandom(seed);

  // 横線を生成（各列の連結を適度に作る）
  const bars: Bar[] = [];
  const connectedRows: Set<number>[] = Array.from({ length: columns }, () => new Set());

  // 各行で最大 floor(columns / 2) 本の横線を生成
  const rowCount = Math.max(10, columns * 2); // 行数を適度に
  for (let row = 0; row < rowCount; row++) {
    const possibleBars: [number, number][] = [];
    for (let col = 0; col < columns - 1; col++) {
      // 同じ行で隣同士の列がまだ接続されていない場合のみ可能
      if (!connectedRows[row]?.has(col) && !connectedRows[row]?.has(col + 1)) {
        possibleBars.push([col, col + 1]);
      }
    }

    // 可能な位置からランダムに選択して横線を配置
    for (const [col1, col2] of possibleBars) {
      if (random() < 0.5) {
        bars.push({ from_column: col1, to_column: col2 });
        connectedRows[row].add(col1);
        connectedRows[row].add(col2);
      }
    }
  }

  return {
    columns,
    bars,
    goals: [], // goalsは別途 assignPrizesToGoals() で設定
    seed,
  };
}

/**
 * シードベースの疑似乱数生成器
 */
function createSeededRandom(seed: string) {
  let value = hashToNumber(seed);
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * 文字列をハッシュして数値に変換
 */
function hashToNumber(str: string): number {
  const hash = CryptoJS.SHA256(str).toString();
  return parseInt(hash.substring(0, 8), 16);
}

/**
 * 景品をあみだのゴール位置にシャッフル配置
 * @param amida あみだくじデータ
 * @param prizes 景品リスト
 * @returns 更新されたあみだくじ
 */
export function assignPrizesToGoals(
  amida: AmidaData,
  prizes: Prize[]
): AmidaData {
  // 景品をコピーして順序をシャッフル
  const random = createSeededRandom(amida.seed);
  const shuffledPrizes = [...prizes].sort(() => random() - 0.5);

  // 各列にゴール位置として景品を割り当て
  const goals: GoalPosition[] = [];
  for (let col = 0; col < amida.columns; col++) {
    const prize = shuffledPrizes[col % shuffledPrizes.length];
    goals.push({
      column: col,
      prize_id: prize.id,
      prize_name: prize.name,
    });
  }

  return {
    ...amida,
    goals,
  };
}

/**
 * あみだくじのハッシュを生成（公平性確保用）
 */
export function generateAmidaHash(amida: AmidaData): string {
  const data = JSON.stringify({
    columns: amida.columns,
    bars: amida.bars,
    goals: amida.goals,
    seed: amida.seed,
  });
  return CryptoJS.SHA256(data).toString();
}

/**
 * ハッシュの整合性を検証
 */
export function verifyAmidaHash(amida: AmidaData, hash: string): boolean {
  return generateAmidaHash(amida) === hash;
}

/**
 * 参加者の落下パスを計算
 * @param participant 参加者
 * @param amida あみだくじ
 * @param prizes 景品リスト
 * @returns 落下パス
 */
export function calculateFallPath(
  participant: Participant,
  amida: AmidaData,
  prizes: Map<string, Prize>
): FallPath {
  const startColumn = participant.assigned_column!;
  const path: number[] = [startColumn];
  let currentColumn = startColumn;

  // 各横線を通す
  for (const bar of amida.bars) {
    if (bar.from_column === currentColumn) {
      currentColumn = bar.to_column;
    } else if (bar.to_column === currentColumn) {
      currentColumn = bar.from_column;
    }
    path.push(currentColumn);
  }

  // ゴール位置の景品を取得
  const goalPrizeId = amida.goals[currentColumn]?.prize_id;
  const resultPrize = prizes.get(goalPrizeId) || {
    id: 'unknown',
    lottery_id: '',
    name: '賞品情報エラー',
    quantity: 0,
    created_at: new Date().toISOString(),
  };

  return {
    participant_id: participant.id,
    line_user_id: participant.line_user_id,
    assigned_column: startColumn,
    path,
    final_column: currentColumn,
    result_prize: resultPrize,
  };
}

/**
 * 列番号をランダムに参加者に割り当て
 * @param participantCount 参加者数
 * @param seed シード
 * @returns 割り当てられた列番号の配列
 */
export function assignColumnsRandomly(
  participantCount: number,
  seed: string
): number[] {
  const columns = Array.from({ length: participantCount }, (_, i) => i);
  const random = createSeededRandom(seed);

  // Fisher-Yates シャッフル
  for (let i = columns.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [columns[i], columns[j]] = [columns[j], columns[i]];
  }

  return columns;
}
