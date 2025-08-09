import React from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { useAuth } from "wasp/client/auth";
import { MainPage } from "../MainPage";
import { WelcomePage } from "./WelcomePage";

export function HomeRouter() {
    const { data: user } = useAuth();

    return <ThemeProvider>{user ? <MainPage /> : <WelcomePage />}</ThemeProvider>;
}
