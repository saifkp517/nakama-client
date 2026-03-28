'use client'

import React, { useEffect, useState } from 'react';
import { X, Users, Plus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGame } from '../context/GameProvider';

const OpCode = {
    GameStateUpdate: 1,
    SymbolAssign: 2,
    PlayerMove: 20,
}

type Mode = 'nickname' | 'choose' | 'searching' | 'create-room';

const OnboardingScreen: React.FC = () => {
    const [nickname, setNickname] = useState('');
    const [mode, setMode] = useState<Mode>('nickname');
    const [roomCode, setRoomCode] = useState('');
    const [createdRoomCode, setCreatedRoomCode] = useState('');
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const { socket, session, client, authenticate, setMatchId, setMySymbol, setBoard, setCurrentTurn, setWinner } = useGame();

    useEffect(() => {
        if (session) {
            async function checkDisplayName() {
                const account = await client.getAccount(session!);
                if (account.user?.display_name) {
                    setNickname(account.user.display_name);
                    setMode('choose');
                }
            }
            checkDisplayName();
        }
    }, [session]);

    const listenForMatch = (matchId: string) => {
        setMatchId(matchId);
        socket!.onmatchdata = (matchData: any) => {
            const data = JSON.parse(new TextDecoder().decode(matchData.data));
            switch (matchData.op_code) {
                case OpCode.SymbolAssign:
                    setMySymbol(data.symbol);
                    break;
                case OpCode.GameStateUpdate:
                    setBoard(data.board);
                    setWinner(null)
                    setCurrentTurn(data.currentTurn);
                    router.push(`/game?matchId=${matchId}`);
                    break;
            }
        };
    };

    const handleNicknameContinue = async () => {
        if (!nickname.trim()) return;
        await authenticate(nickname);
        // mode will flip to 'choose' via the session useEffect above,
        // but we set it here too for instant feedback with no flicker
        setMode('choose');
    };

    // --- Quick Match ---
    const handleQuickMatch = async () => {
        setMode('searching');
        await socket!.addMatchmaker('*', 2, 2);
        socket!.onmatchmakermatched = async (matched: any) => {
            const matchId = matched.match_id;
            await socket!.joinMatch(matchId);
            listenForMatch(matchId);
        };
    };

    // --- Create Room ---
    const handleCreateRoom = async () => {
        const result = await client.rpc(session!, 'create-match', { isPrivate: true });
        if (result.payload) {
            const code = (result.payload as { matchId: string }).matchId;
            setCreatedRoomCode(code);
            setMode('create-room');
            listenForMatch(code);
            await socket!.joinMatch(code);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(createdRoomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Join Room ---
    const handleJoinRoom = async () => {
        if (!roomCode.trim()) return;
        const matchId = roomCode.trim();
        setMatchId(matchId);
        listenForMatch(matchId);
        await socket!.joinMatch(matchId);
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0f12] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm bg-[#161d23] rounded-sm shadow-2xl border border-gray-800/50">

                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4">
                    <div className="flex items-center gap-2">
                        {(mode === 'choose' || mode === 'create-room') && (
                            <button
                                onClick={() => setMode(mode === 'create-room' ? 'choose' : 'nickname')}
                                className="text-gray-400 hover:text-white transition-colors mr-1"
                                aria-label="Back"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <h2 className="text-gray-100 text-lg font-semibold tracking-tight">
                            {mode === 'nickname' && 'Who are you?'}
                            {mode === 'choose' && 'How do you want to play?'}
                            {mode === 'searching' && 'Finding a match...'}
                            {mode === 'create-room' && 'Room created!'}
                        </h2>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-5 py-6">

                    {/* Step 1 — Nickname */}
                    {mode === 'nickname' && (
                        <div className="relative group">
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNicknameContinue()}
                                placeholder="Nickname"
                                className="w-full bg-[#1c262f] text-gray-100 placeholder-gray-500 py-4 px-5 rounded-md
                                           border-b-2 border-transparent focus:border-[#00bfa5] outline-none
                                           transition-all duration-300 text-center text-xl font-medium"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Step 2 — Choose mode */}
                    {mode === 'choose' && (
                        <div className="flex flex-col gap-3">
                            {/* Quick Match */}
                            <button
                                onClick={handleQuickMatch}
                                className="flex items-center gap-4 w-full bg-[#1c262f] hover:bg-[#243040] border border-gray-700/50
                                           hover:border-[#00bfa5]/50 rounded-md px-5 py-4 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#00bfa5]/10 flex items-center justify-center
                                                group-hover:bg-[#00bfa5]/20 transition-colors flex-shrink-0">
                                    <Users size={18} className="text-[#00bfa5]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-100 font-semibold text-sm">Quick Match</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Get paired with a random opponent</p>
                                </div>
                            </button>

                            {/* Create Room */}
                            <button
                                onClick={handleCreateRoom}
                                className="flex items-center gap-4 w-full bg-[#1c262f] hover:bg-[#243040] border border-gray-700/50
                                           hover:border-[#00bfa5]/50 rounded-md px-5 py-4 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#00bfa5]/10 flex items-center justify-center
                                                group-hover:bg-[#00bfa5]/20 transition-colors flex-shrink-0">
                                    <Plus size={18} className="text-[#00bfa5]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-100 font-semibold text-sm">Create Room</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Get a code and invite a friend</p>
                                </div>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-1">
                                <div className="flex-1 h-px bg-gray-700/50" />
                                <span className="text-gray-600 text-xs uppercase tracking-widest">or join one</span>
                                <div className="flex-1 h-px bg-gray-700/50" />
                            </div>

                            {/* Join Room */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    placeholder="Paste room code"
                                    className="flex-1 bg-[#1c262f] text-gray-100 placeholder-gray-500 py-3 px-4 rounded-md
                                               border-b-2 border-transparent focus:border-[#00bfa5] outline-none
                                               transition-all text-sm font-mono"
                                />
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={!roomCode.trim()}
                                    className={`px-4 py-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all
                                        ${roomCode.trim()
                                            ? 'bg-[#00bfa5] text-[#0a0f12] hover:bg-[#00d9bc] cursor-pointer'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Searching spinner */}
                    {mode === 'searching' && (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-8 h-8 rounded-full border-4 border-[#00bfa5] border-t-transparent animate-spin" />
                        </div>
                    )}

                    {/* Created Room — show code + waiting */}
                    {mode === 'create-room' && (
                        <div className="flex flex-col items-center gap-5">
                            <p className="text-gray-400 text-sm text-center">
                                Share this code with your friend. The game starts as soon as they join.
                            </p>
                            <button
                                onClick={handleCopyCode}
                                className="w-full bg-[#1c262f] border border-dashed border-[#00bfa5]/50 hover:border-[#00bfa5]
                                           rounded-md py-4 px-5 text-center transition-all group"
                            >
                                <p className="text-[#00bfa5] font-mono font-bold text-base tracking-widest break-all">
                                    {createdRoomCode}
                                </p>
                                <p className="text-gray-500 text-xs mt-1.5 group-hover:text-gray-400 transition-colors">
                                    {copied ? '✓ Copied!' : 'Click to copy'}
                                </p>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-[#00bfa5] border-t-transparent animate-spin" />
                                <p className="text-gray-500 text-sm">Waiting for opponent...</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                {mode === 'nickname' && (
                    <div className="px-5 pb-6 flex justify-end">
                        <button
                            onClick={handleNicknameContinue}
                            disabled={!nickname.trim()}
                            className={`px-8 py-2.5 rounded-md font-bold text-sm uppercase tracking-wider transition-all
                                ${nickname.trim()
                                    ? 'bg-[#00bfa5] text-[#0a0f12] hover:bg-[#00d9bc] cursor-pointer'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default OnboardingScreen;