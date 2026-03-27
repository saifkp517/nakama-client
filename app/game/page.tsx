'use client'
import GameplayScreen from "../components/GamePlay";
import React from "react";
import { useGame } from "../context/GameProvider";
import { useRouter } from "next/navigation";

export default function Gameplay() {

    const { matchId } = useGame();
    const router = useRouter();

    if(!matchId) {
        router.push('/');
        return null;
    }

    return <GameplayScreen />
}
