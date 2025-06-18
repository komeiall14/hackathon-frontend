// src/LoginForm.tsx

import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { fireAuth } from "./firebase";
import toast from 'react-hot-toast';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

// ★ 修正点1: LoginFormが受け取るpropsの型を定義します
interface LoginFormProps {
  onLoginSuccess: () => void;
}

// ★ 修正点2: コンポーネントがpropsを受け取るように変更します
export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    // Googleでログインする関数
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // 手順1: Firebaseでログイン
            const res = await signInWithPopup(fireAuth, provider);
            const user = res.user;

            // 手順2: バックエンドにユーザー情報を同期
            console.log("Firebaseログイン成功。バックエンドにユーザー情報を同期します。");
            
            const token = await user.getIdToken();

            const response = await fetch(`${BACKEND_API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token }),
            });

            if (!response.ok) {
                throw new Error('データベースとの同期に失敗しました。');
            }

            console.log("バックエンドとの同期が成功しました。");
            toast.success(`ようこそ、${user.displayName}さん！`); 
            
            // ★ 修正点3: 同期成功後、親から渡されたonLoginSuccess関数を呼び出します
            onLoginSuccess();

        } catch (err: any) {
            const errorMessage = err.message;
            toast.error(`ログインに失敗しました: ${errorMessage}`); 
            console.error("ログインまたは同期処理のエラー:", err);
        }
    };

    // ログアウトする関数
    const signOutWithGoogle = async () => {
        try {
            await signOut(fireAuth);
            toast.success("ログアウトしました"); 
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="auth-button-container">
            <button onClick={signInWithGoogle} className="pill-button secondary">
                Googleでログイン
            </button>
            <button onClick={signOutWithGoogle} className="pill-button secondary">
                ログアウト
            </button>
        </div>
    );
};