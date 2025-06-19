// src/LoginForm.tsx をこの内容に丸ごと置き換えてください

import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from "firebase/auth";
import { fireAuth } from "./firebase";
import toast from 'react-hot-toast';
import { FaSignOutAlt } from 'react-icons/fa'; // アイコンを追加

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

// ★ loginUser を受け取るように props を更新
interface LoginFormProps {
  loginUser: FirebaseUser | null;
  onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loginUser, onLoginSuccess }) => {
    // ★ ドロップダウンメニューの開閉を管理するstate
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Googleでログインする関数 (変更なし)
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const res = await signInWithPopup(fireAuth, provider);
            const user = res.user;
            const token = await user.getIdToken();
            const response = await fetch(`${BACKEND_API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token }),
            });
            if (!response.ok) throw new Error('データベースとの同期に失敗しました。');
            toast.success(`ようこそ、${user.displayName}さん！`); 
            onLoginSuccess();
        } catch (err: any) {
            toast.error(`ログインに失敗しました: ${err.message}`);
        }
    };

    // ログアウトする関数 (変更なし)
    const signOutWithGoogle = async () => {
        try {
            await signOut(fireAuth);
            toast.success("ログアウトしました");
            setIsMenuOpen(false); // メニューを閉じる
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    // ★ メニューの外側をクリックしたときにメニューを閉じる処理
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    // ★ ログイン状態によって表示を切り替える
    if (!loginUser) {
        // ログアウト時の表示
        return (
            <div className="auth-button-container">
                <button onClick={signInWithGoogle} className="pill-button primary">
                    Googleでログイン
                </button>
            </div>
        );
    }

    // ログイン時の表示
    return (
        <div className="user-info-menu-container" ref={menuRef}>
            <div className="user-info-container" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <img 
                    src={loginUser.photoURL || '/default-avatar.png'} 
                    alt="user avatar" 
                    className="user-info-avatar"
                />
                <span className="user-info-name">{loginUser.displayName}</span>
            </div>

            {isMenuOpen && (
                <div className="logout-menu">
                    <button className="logout-menu-item" onClick={signOutWithGoogle}>
                        <FaSignOutAlt />
                        <span>ログアウト</span>
                    </button>
                </div>
            )}
        </div>
    );
};