'use client'

import React, { useState, useEffect } from 'react';
import { Client, Socket, Session } from '@heroiclabs/nakama-js';
import { GameProvider } from '../context/GameProvider';

const defaultKey = process.env.NEXT_PUBLIC_DEFAULT_KEY;
const host = process.env.NEXT_PUBLIC_HOST
const port = process.env.NEXT_PUBLIC_PORT   

export const client = new Client(defaultKey, host, port, true);

function getOrCreateDeviceId(): string {
    const key = 'ttt_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    const authenticate = async (nickname: string) => {
        const deviceId = getOrCreateDeviceId();
        const newSession = await client.authenticateDevice(deviceId, true);
        await client.updateAccount(newSession, { display_name: nickname });
        setSession(newSession);

        const newSocket = client.createSocket(true);
        await newSocket.connect(newSession, false);
        setSocket(newSocket);
    };

    // Silently restore session for returning users (device ID already exists)
    useEffect(() => {
        const existingDeviceId = localStorage.getItem('ttt_device_id');
        if (!existingDeviceId) return; // new user — wait for nickname submit

        async function restoreSession() {
            const restoredSession = await client.authenticateDevice(existingDeviceId!, false); // false = don't create
            setSession(restoredSession);

            const restoredSocket = client.createSocket(true);
            await restoredSocket.connect(restoredSession, false);
            setSocket(restoredSocket);
        }

        restoreSession();
    }, []);

    return (
        <GameProvider client={client} session={session} socket={socket} authenticate={authenticate}>
            {children}
        </GameProvider>
    );
}