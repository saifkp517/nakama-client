'use client'

import React, { createContext, useContext, useState } from 'react';
import { Client, Session, Socket } from '@heroiclabs/nakama-js';

interface GameContextType {
    client: Client,
    session: Session | null,
    socket: Socket | null,
    matchId: string | null,
    mySymbol: 'X' | 'O' | null,
    board: (string | null)[],
    currentTurn: string | null,
    winner: string | null,
    authenticate: (nickname: string) => Promise<void>,
    setMatchId: (matchId: string) => void,
    setMySymbol: (symbol: 'X' | 'O') => void,
    setBoard: (board: (string | null)[]) => void,
    setCurrentTurn: (userId: string) => void,
    setWinner: (winner: string | null) => void,
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{
    client: Client,
    session: Session | null,
    socket: Socket | null,
    authenticate: (nickname: string) => Promise<void>,
    children: React.ReactNode
}> = ({ client, session, socket, authenticate, children }) => {
    const [matchId, setMatchId] = useState<string | null>(null);
    const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [currentTurn, setCurrentTurn] = useState<string | null>(null);
    const [winner, setWinner] = useState<string | null>(null);

    return (
        <GameContext.Provider value={{
            client, session, socket, authenticate,
            matchId, mySymbol, board, currentTurn, winner,
            setMatchId, setMySymbol, setBoard, setCurrentTurn, setWinner,
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};