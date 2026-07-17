'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Lottery, Prize, Participant } from '@/types';

const AdminPage: React.FC = () => {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMaxParticipants, setNewMaxParticipants] = useState(10);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeQuantity, setNewPrizeQuantity] = useState(1);

  useEffect(() => {
    fetchLotteries();
  }, []);

  const fetchLotteries = async () => {
    const { data, error } = await supabase.from('lotteries').select('*');
    if (!error && data) {
      setLotteries(data);
    }
  };

  const selectLottery = async (lottery: Lottery) => {
    setSelectedLottery(lottery);

    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .eq('lottery_id', lottery.id);

    const { data: prizes } = await supabase
      .from('prizes')
      .select('*')
      .eq('lottery_id', lottery.id);

    if (participants) setParticipants(participants);
    if (prizes) setPrizes(prizes);
  };

  const createLottery = async () => {
    if (!newTitle || !newDeadline) {
      alert('タイトルと締切を入力してください');
      return;
    }

    const { error } = await supabase.from('lotteries').insert({
      group_line_id: 'manual', // TODO: LINE Group IDを設定可能に
      title: newTitle,
      description: newDescription,
      max_participants: newMaxParticipants,
      registration_deadline: newDeadline,
      phase: 'registration',
    });

    if (!error) {
      setNewTitle('');
      setNewDescription('');
      setNewDeadline('');
      setNewMaxParticipants(10);
      fetchLotteries();
      alert('あみだを作成しました！');
    } else {
      alert(`エラー: ${error.message}`);
    }
  };

  const addPrize = async () => {
    if (!selectedLottery || !newPrizeName) {
      alert('景品名を入力してください');
      return;
    }

    const { error } = await supabase.from('prizes').insert({
      lottery_id: selectedLottery.id,
      name: newPrizeName,
      quantity: newPrizeQuantity,
    });

    if (!error) {
      setNewPrizeName('');
      setNewPrizeQuantity(1);
      selectLottery(selectedLottery);
      alert('景品を追加しました！');
    } else {
      alert(`エラー: ${error.message}`);
    }
  };

  const triggerPhase2 = async () => {
    if (!selectedLottery) return;

    try {
      const response = await fetch('/api/phase2/generate-amida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('Phase 2を実行しました！');
        fetchLotteries();
      } else {
        alert('Phase 2実行の読み込みが突〜
        }
      }
    } catch (error) {
      alert(`エラー: ${error}`);
    }
  };

  const triggerPhase3 = async () => {
    if (!selectedLottery) return;

    try {
      const response = await fetch('/api/phase3/assign-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lottery_id: selectedLottery.id }),
      });

      if (response.ok) {
        alert('Phase 3を実行しました！');
        selectLottery(selectedLottery);
      } else {
        alert('Phase 3実行の読み込みが突〜
      }
    } catch (error) {
      alert(`エラー: ${error}`);
    }
  };

  const triggerPhase4 = async () => {
    if (!selectedLottery) return;

    try {
      const response = await fetch('/api/phase4/execute-lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lottery_id: selectedLottery.id }),
      });

      if (response.ok) {
        alert('Phase 4を実行しました！');
        selectLottery(selectedLottery);
      } else {
        alert('Phase 4実行の読み込みが突〜
      }
    } catch (error) {
      alert(`エラー: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">🕐 管理画面</h1>

      <div className="grid grid-cols-3 gap-8">
        {/* 新規あみだ作成 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">新規あみだ</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="タイトル"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <textarea
              placeholder="説明"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded h-20"
            />
            <input
              type="number"
              placeholder="最大参加者数"
              value={newMaxParticipants}
              onChange={(e) => setNewMaxParticipants(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={createLottery}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600"
            >
              作成
            </button>
          </div>
        </div>

        {/* あみだリスト */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">あみだ一覧</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lotteries.map((lottery) => (
              <button
                key={lottery.id}
                onClick={() => selectLottery(lottery)}
                className={`w-full text-left px-4 py-2 rounded font-bold transition ${
                  selectedLottery?.id === lottery.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {lottery.title}
                <div className="text-sm font-normal">Phase: {lottery.phase}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 詳細情報 */}
        {selectedLottery && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">{{selectedLottery.title}}</h2>
            <div className="space-y-4">
              <p><strong>Phase:</strong> {selectedLottery.phase}</p>
              <p><strong>参加者:</strong> {participants.length}/{selectedLottery.max_participants}</p>
              <p><strong>締切:</strong> {new Date(selectedLottery.registration_deadline).toLocaleString()}</p>

              {/* Phaseボタン */}
              <div className="space-y-2 mt-6">
                <button
                  onClick={triggerPhase2}
                  disabled={selectedLottery.phase !== 'closed'}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 disabled:opacity-50"
                >
                  Phase 2 実行
                </button>
                <button
                  onClick={triggerPhase3}
                  disabled={selectedLottery.phase !== 'amida_generated'}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 disabled:opacity-50"
                >
                  Phase 3 実行
                </button>
                <button
                  onClick={triggerPhase4}
                  disabled={selectedLottery.phase !== 'amida_generated'}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 disabled:opacity-50"
                >
                  Phase 4 実行
                </button>
              </div>

              {/* 景品追加 */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-bold mb-2">景品を追加</h3>
                <input
                  type="text"
                  placeholder="景品名"
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                />
                <input
                  type="number"
                  placeholder="数量"
                  value={newPrizeQuantity}
                  onChange={(e) => setNewPrizeQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                />
                <button
                  onClick={addPrize}
                  className="w-full bg-purple-500 text-white px-4 py-2 rounded font-bold hover:bg-purple-600"
                >
                  追加
                </button>
              </div>

              {/* 景品一覧 */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-bold mb-2">景品一覧</h3>
                <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                  {prizes.map((prize) => (
                    <p key={prize.id}>
                      {prize.name} (x{prize.quantity})
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
