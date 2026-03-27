'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useGame } from '../context/GameProvider';
import { useRouter } from 'next/navigation';

const OpCode = {
    GameStateUpdate: 1,
    SymbolAssign: 2,
    PlayerMove: 20,
}

const GameplayScreen: React.FC = () => {

    const redirectSeconds = useRef(10);
    const [countdown, setCountdown] = useState(10);
    const router = useRouter();
    const { socket, session, matchId, mySymbol, board, currentTurn, winner, setBoard, setCurrentTurn, setWinner } = useGame();

    // Listen to match events
    useEffect(() => {
        if (!socket) return;

        socket.onmatchdata = (matchData) => {
            const data = JSON.parse(new TextDecoder().decode(matchData.data));

            switch (matchData.op_code) {
                case OpCode.GameStateUpdate:
                    setBoard(data.board);
                    setCurrentTurn(data.currentTurn);
                    setWinner(data.winner);
                    break;
            }
        };
    }, [socket]);

    useEffect(() => {
        if (!winner) return;

        redirectSeconds.current = 10;
        setCountdown(10);

        const interval = setInterval(() => {
            redirectSeconds.current -= 1;
            setCountdown(redirectSeconds.current);

            if (redirectSeconds.current <= 0) {
                clearInterval(interval);
                router.push('/leaderboard');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [winner]);

    const handleCellClick = useCallback((index: number) => {
        if (!matchId) return;
        if (board[index] !== null) return;
        if (currentTurn !== session!.user_id) return;
        if (winner) return;

        socket!.sendMatchState(matchId, OpCode.PlayerMove, JSON.stringify({ boardPosition: index }));
    }, [matchId, board, currentTurn, winner]);

    const isMyTurn = currentTurn === session!.user_id;

    return (
        <div className="min-h-screen w-full bg-[#00bfa5] flex flex-col items-center justify-between py-12 px-6 font-sans select-none">

            {/* Header */}
            <div className="text-center">
                <div className="flex justify-center items-center space-x-12 mb-4 uppercase tracking-widest font-bold text-[#0a0f12]/80">
                    <div className="flex flex-col items-center">
                        <span className="text-sm opacity-60 italic normal-case font-normal">(you)</span>
                        <span className="text-xl">{mySymbol}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-sm opacity-60 italic normal-case font-normal">(opp)</span>
                        <span className="text-xl">{mySymbol === 'X' ? 'O' : 'X'}</span>
                    </div>
                </div>

                {/* Status */}
                <div className="text-[#0a0f12] text-4xl font-bold">
                    {winner
                        ? winner === 'draw'
                            ? "It's a draw!"
                            : winner === session!.user_id
                                ? 'You win!'
                                : 'You lose!'
                        : isMyTurn
                            ? 'Your turn'
                            : 'Their turn'
                    }
                </div>
            </div>

            {/* The Grid */}
            <div className="relative w-full max-w-[320px] aspect-square grid grid-cols-3 grid-rows-3">
                <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                    <div className="border-r-2 border-[#0a0f12]/30 h-full"></div>
                    <div className="border-r-2 border-[#0a0f12]/30 h-full"></div>
                </div>
                <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                    <div className="border-b-2 border-[#0a0f12]/30 w-full"></div>
                    <div className="border-b-2 border-[#0a0f12]/30 w-full"></div>
                </div>

                {board.map((cell: string | null, index: number) => {
                    const isClickable = cell === null && isMyTurn && !winner;
                    return (
                        <div
                            key={index}
                            onClick={() => handleCellClick(index)}
                            className={[
                                'flex items-center justify-center text-6xl font-light',
                                isClickable ? 'cursor-pointer' : 'cursor-default',
                            ].join(' ')}
                        >
                            {cell === 'X' && (
                                <span className="text-[#0a0f12] transform scale-125">✕</span>
                            )}
                            {cell === 'O' && (
                                <div className="w-12 h-12 rounded-full border-[6px] border-white/90 shadow-sm"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <button
                onClick={() => {
                    socket!.leaveMatch(matchId!)
                    router.push('/')
                }}
                className="bg-[#0a0f12]/10 hover:bg-[#0a0f12]/20 border border-[#0a0f12]/20 
                           px-10 py-3 rounded-full text-[#0a0f12] font-semibold tracking-wide 
                           transition-all duration-200"
            >
                Leave room
            </button>
            {winner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center w-72 flex flex-col gap-3">
                        <p className="text-lg font-semibold text-[#0a0f12]">
                            {winner === 'draw' ? "It's a draw!" : winner === session!.user_id ? 'You win!' : 'You lose!'}
                        </p>
                        <p className="text-sm text-gray-400">
                            Redirecting to leaderboard in <span className="font-semibold text-[#0a0f12]">{countdown}s</span>
                        </p>
                        <button
                            onClick={() => router.push('/leaderboard')}
                            className="bg-[#0a0f12] text-white py-2.5 rounded-full font-semibold text-sm"
                        >
                            Go to leaderboard
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="border border-[#0a0f12]/20 text-[#0a0f12] py-2.5 rounded-full font-semibold text-sm hover:bg-[#0a0f12]/5 transition-colors"
                        >
                            Play again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameplayScreen;