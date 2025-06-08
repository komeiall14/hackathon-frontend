import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { fireAuth } from "./firebase"; // fireAuthをインポート
import toast from 'react-hot-toast';

export const LoginForm: React.FC = () => {
    // Googleでログインする関数
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider(); // Google認証プロバイダを利用
        try {
            const res = await signInWithPopup(fireAuth, provider); // ログイン用のポップアップを表示
            const user = res.user;
            toast.success(`ようこそ、${user.displayName}さん！`); 
        } catch (err: any) { // エラーハンドリング
            const errorMessage = err.message;
            toast.error(errorMessage); 
        }
    };

    // ログアウトする関数
    const signOutWithGoogle = async () => {
        try {
            await signOut(fireAuth);
            toast.success("ログアウトしました"); 
        } catch (err: any) { // エラーハンドリング
            toast.error(err.message);
        }
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <button onClick={signInWithGoogle} style={{ marginRight: '10px', padding: '10px 20px', fontSize: '16px' }}>
                Googleでログイン
            </button>
            <button onClick={signOutWithGoogle} style={{ padding: '10px 20px', fontSize: '16px' }}>
                ログアウト
            </button>
        </div>
    );
};