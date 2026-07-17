import { generateAmida, assignPrizesToGoals, calculateFallPath } from '@/lib/amidaAlgorithm';
import { Participant, AmidaData } from '@/types';

describe('Amida Algorithm', () => {
  it('should generate valid amida', () => {
    const seed = 'test-seed';
    const amida = generateAmida(5, seed);

    expect(amida.columns).toBe(5);
    expect(amida.bars).toBeDefined();
    expect(amida.seed).toBe(seed);
  });

  it('should assign prizes to goals', () => {
    const seed = 'test-seed';
    const amida = generateAmida(3, seed);
    const prizes = [
      { id: '1', lottery_id: 'test', name: 'Prize A', quantity: 1, created_at: '2024-01-01' },
      { id: '2', lottery_id: 'test', name: 'Prize B', quantity: 1, created_at: '2024-01-01' },
      { id: '3', lottery_id: 'test', name: 'Prize C', quantity: 1, created_at: '2024-01-01' },
    ];

    const result = assignPrizesToGoals(amida, prizes);

    expect(result.goals).toHaveLength(3);
    result.goals.forEach((goal) => {
      expect(goal.column).toBeDefined();
      expect(goal.prize_id).toBeDefined();
      expect(goal.prize_name).toBeDefined();
    });
  });

  it('should calculate fall path correctly', () => {
    const seed = 'test-seed';
    let amida = generateAmida(3, seed);
    const prizes = [
      { id: '1', lottery_id: 'test', name: 'Prize A', quantity: 1, created_at: '2024-01-01' },
      { id: '2', lottery_id: 'test', name: 'Prize B', quantity: 1, created_at: '2024-01-01' },
      { id: '3', lottery_id: 'test', name: 'Prize C', quantity: 1, created_at: '2024-01-01' },
    ];
    amida = assignPrizesToGoals(amida, prizes);

    const participant: Participant = {
      id: 'p1',
      lottery_id: 'test',
      line_user_id: 'U123',
      line_display_name: 'Test User',
      assigned_column: 0,
      created_at: '2024-01-01',
    };

    const prizeMap = new Map(prizes.map((p) => [p.id, p]));
    const fallPath = calculateFallPath(participant, amida, prizeMap);

    expect(fallPath.participant_id).toBe('p1');
    expect(fallPath.assigned_column).toBe(0);
    expect(fallPath.final_column).toBeLessThan(3);
    expect(fallPath.result_prize).toBeDefined();
  });
});
