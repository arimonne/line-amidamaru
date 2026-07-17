'use client';

import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { supabase } from '@/lib/supabaseClient';
import { Lottery, Participant, AmidaData, FallPath } from '@/types';
import { calculateFallPath } from '@/lib/amidaAlgorithm';

const LIFFPage: React.FC = () => {
  const [liffReady, setLiffReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [lottery, setLottery] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [fallPath, setFallPath] = useState(null);
  const [phase, setPhase] = useState('registration');
  const [lotteryList, setLotteryList] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    liff
      .init({ liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID! })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          setLiffReady(true);
          const profile = liff.getProfile();
          setUserProfile(profile);
        }
      })
      .catch((error) => {
        console.error('LIFF initialization error:', error);
      });
  }, []);

  useEffect(() => {
    if (!liffReady || !userProfile) return;

    const fetchLotteries = async () => {
      const groupId = liff.getContext()?.groupId;
      if (!groupId) return;

      const { data, error } = await supabase
        .from('lotteries')
        .select('*')
        .eq('group_line_id', groupId)
        .eq('phase', 'registration');

      if (!error && data) {
        setLotteryList(data);
      }
    };

    fetchLotteries();
  }, [liffReady, userProfile]);

  const handleRegister = async (lotteryId: string) => {
    try {
      const response = await fetch('/api/phase1/register-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lottery_id: lotteryId,
          line_user_id: userProfile.userId,
          line_display_name: userProfile.displayName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setParticipant(data.participant);
        setLottery(lotteryList.find((l) => l.id === lotteryId) || null);
        setPhase('amida');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed');
    }
  };

  const handleStartFall = async () => {
    if (!lottery || !participant || !lottery.amida_data) return;

    setIsAnimating(true);

    setTimeout(async () => {
      const { data: prizes } = await supabase.from('prizes').select('*').eq('lottery_id', lottery.id);

      if (prizes) {
        const prizeMap = new Map(prizes.map((p) => [p.id, p]));
        const fall = calculateFallPath(participant, lottery.amida_data, prizeMap);
        setFallPath(fall);
        setPhase('result');
      }

      setIsAnimating(false);
    }, 3000);
  };

  if (!liffReady) {
    return <div className="text-center py-8">LIFF を読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      {phase === 'registration' && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">🎉 あみだくじ</h1>
          {lotteryList.length === 0 ? (
            <p className="text-white text-center">参加可能なあみだくじがありません</p>
          ) : (
            lotteryList.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                onClick={() => handleRegister(l.id)}
              >
                <h2 className="text-xl font-bold mb-2">{l.title}</h2>
                <p className="text-gray-600 mb-4">{l.description}</p>
                <button className="bg-purple-500 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-600 transition w-full">
                  参加する
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {phase === 'amida' && lottery && participant && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">🎂 {lottery.title}</h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">あなたのスタート位置</p>
            <div className="text-6xl font-bold text-purple-600 mb-6">{(participant.assigned_column || 0) + 1}列</div>
            <button
              onClick={handleStartFall}
              disabled={isAnimating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:shadow-lg transition disabled:opacity-50 w-full"
            >
              {isAnimating ? '落下中...' : '結果を確認'}
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && fallPath && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">🎆 結果発表！</h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">あなたの結果</p>
            <div className="text-4xl font-bold text-pink-600 mb-6">🎁 {fallPath.result_prize.name}</div>
            <p className="text-gray-500 text-sm mb-6">位置：第{fallPath.final_column + 1}列</p>
            <button
              onClick={() => {
                setPhase('registration');
                setParticipant(null);
                setLottery(null);
                setFallPath(null);
              }}
              className="bg-purple-500 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-600 transition w-full"
            >
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LIFFPage;
