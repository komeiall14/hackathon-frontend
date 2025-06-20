import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from "firebase/auth";
import { fireAuth } from "./firebase";
import toast from 'react-hot-toast';
import { FaSignOutAlt } from 'react-icons/fa';
import { InitialAvatar } from './InitialAvatar';


const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

interface LoginFormProps {
  loginUser: FirebaseUser | null;
  onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loginUser, onLoginSuccess }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const signOutWithGoogle = async () => {
        try {
            await signOut(fireAuth);
            toast.success("ログアウトしました");
            setIsMenuOpen(false);
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    if (!loginUser) {
        return (
            <div className="auth-button-container">
                <button onClick={signInWithGoogle} className="pill-button primary">
                    Googleでログイン
                </button>
            </div>
        );
    }

    return (
        <div className="user-info-menu-container" ref={menuRef}>
            <div className="user-info-container" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {/* ▼▼▼ 修正箇所 ▼▼▼ */}
                <div className="user-info-avatar">
                  {loginUser.photoURL && loginUser.photoURL.startsWith('http') ? (
                    <img 
                        src={loginUser.photoURL} 
                        alt="user avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                    />
                  ) : (
                    <InitialAvatar name={loginUser.displayName || ""} size={32} />
                  )}
                </div>
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