import { login } from './actions'
import { Building2 } from 'lucide-react'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: '#dce3ed',
        }}>

            {/* Left Side - Illustration (desktop only via CSS media query) */}
            <div style={{
                display: 'none',
                position: 'relative',
                overflow: 'hidden',
                borderTopRightRadius: '2.5rem',
                borderBottomRightRadius: '2.5rem',
                backgroundImage: 'url(/login-illustration.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '45%',
                flexShrink: 0,
            }}
                className="login-illustration-panel"
            >
                {/* Logo overlay */}
                <div style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '2rem',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}>
                    <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(124,104,238,0.25)',
                        border: '1px solid rgba(124,104,238,0.4)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Building2 size={20} style={{ color: '#a78bfa' }} />
                    </div>
                    <span style={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        letterSpacing: '-0.5px',
                        fontFamily: 'var(--font-outfit), sans-serif',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        TMK TEAM
                    </span>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
            }}>
                <div style={{ width: '100%', maxWidth: '26rem' }}>

                    {/* Mobile Logo */}
                    <div className="login-mobile-logo" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '2.5rem',
                    }}>
                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(124,104,238,0.12)',
                            border: '1px solid rgba(124,104,238,0.2)',
                        }}>
                            <Building2 size={20} style={{ color: '#7c68ee' }} />
                        </div>
                        <span style={{
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            color: '#1a1a2e',
                            fontFamily: 'var(--font-outfit), sans-serif',
                        }}>
                            TMK TEAM
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: 700,
                        color: '#1a1a2e',
                        marginBottom: '0.5rem',
                        fontFamily: 'var(--font-outfit), sans-serif',
                        letterSpacing: '-0.5px',
                    }}>
                        เข้าสู่ระบบ
                    </h1>
                    <p style={{
                        fontSize: '0.875rem',
                        color: '#7a7a95',
                        marginBottom: '2rem',
                    }}>
                        เข้าสู่ระบบด้วยบัญชีพนักงานของคุณ
                    </p>

                    {/* White Form Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1.25rem',
                        padding: '2rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                    }}>
                        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label htmlFor="email" style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginBottom: '0.5rem',
                                    color: '#4a4a6a',
                                }}>
                                    อีเมล (Email)
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="name@tmkteam.com"
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        fontSize: '0.875rem',
                                        background: '#f8f9fb',
                                        border: '1px solid #e5e7eb',
                                        color: '#1a1a2e',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginBottom: '0.5rem',
                                    color: '#4a4a6a',
                                }}>
                                    รหัสผ่าน (Password)
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        fontSize: '0.875rem',
                                        background: '#f8f9fb',
                                        border: '1px solid #e5e7eb',
                                        color: '#1a1a2e',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {searchParams?.message && (
                                <div style={{
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>พบข้อผิดพลาด</p>
                                    <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#ef4444' }}>{searchParams.message}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'center',
                                    borderRadius: '0.75rem',
                                    padding: '0.875rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'white',
                                    background: '#4285f4',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(66, 133, 244, 0.35)',
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                เข้าสู่ระบบ (Login)
                            </button>
                        </form>
                    </div>

                    <p style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        marginTop: '1.5rem',
                        color: '#9ca3af',
                    }}>
                        © 2026 TMK TEAM. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Responsive CSS for the illustration panel */}
            <style>{`
                @media (min-width: 1024px) {
                    .login-illustration-panel {
                        display: block !important;
                    }
                    .login-mobile-logo {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
