import { login } from './actions'
import { Building2 } from 'lucide-react'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div className="login-wrapper" style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #eef2f6 0%, #e2e8f0 100%)',
            position: 'relative',
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
                boxShadow: '10px 0 30px rgba(0,0,0,0.1)',
            }}
                className="login-illustration-panel"
            >
                {/* Logo overlay */}
                <div style={{
                    position: 'absolute',
                    top: '2.5rem',
                    left: '2.5rem',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}>
                    <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                        <Building2 size={24} style={{ color: '#fff' }} />
                    </div>
                    <span style={{
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        letterSpacing: '-0.5px',
                        fontFamily: 'var(--font-outfit), sans-serif',
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    }}>
                        TMK TEAM
                    </span>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-form-container" style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                zIndex: 10,
            }}>
                <div style={{ width: '100%', maxWidth: '28rem' }}>

                    {/* Header Section */}
                    <div className="login-header" style={{ marginBottom: '2.5rem' }}>
                        {/* Mobile Logo */}
                        <div className="login-mobile-logo" style={{
                            width: '4rem',
                            height: '4rem',
                            borderRadius: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'white',
                            border: '1px solid rgba(124,104,238,0.15)',
                            boxShadow: '0 10px 25px rgba(124,104,238,0.15), 0 2px 5px rgba(0,0,0,0.02)',
                            marginBottom: '1.5rem',
                        }}>
                            <Building2 size={32} style={{ color: '#7c68ee' }} />
                        </div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: '#1a1a2e',
                            marginBottom: '0.5rem',
                            fontFamily: 'var(--font-thai), sans-serif',
                            letterSpacing: '-0.5px',
                        }}>
                            เข้าสู่ระบบ
                        </h1>
                        <p style={{
                            fontSize: '1rem',
                            color: '#64748b',
                            fontFamily: 'var(--font-thai), sans-serif',
                        }}>
                            เข้าสู่ระบบด้วยบัญชีพนักงานของคุณ
                        </p>
                    </div>

                    {/* White Form Card */}
                    <div className="login-card" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '1.5rem',
                        padding: '2.5rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                    }}>
                        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label htmlFor="email" style={{
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    marginBottom: '0.5rem',
                                    color: '#475569',
                                    fontFamily: 'var(--font-thai), system-ui, sans-serif',
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
                                    className="login-input"
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        borderRadius: '0.875rem',
                                        padding: '0.875rem 1rem',
                                        fontSize: '0.95rem',
                                        background: '#f8fafc',
                                        border: '1px solid #cbd5e1',
                                        color: '#1e293b',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        fontFamily: 'var(--font-inter), sans-serif',
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" style={{
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    marginBottom: '0.5rem',
                                    color: '#475569',
                                    fontFamily: 'var(--font-thai), system-ui, sans-serif',
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
                                    className="login-input"
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        borderRadius: '0.875rem',
                                        padding: '0.875rem 1rem',
                                        fontSize: '0.95rem',
                                        background: '#f8fafc',
                                        border: '1px solid #cbd5e1',
                                        color: '#1e293b',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        fontFamily: 'var(--font-inter), sans-serif',
                                        letterSpacing: '0.1em',
                                    }}
                                />
                            </div>

                            {searchParams?.message && (
                                <div style={{
                                    borderRadius: '0.875rem',
                                    padding: '1rem',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626', fontFamily: 'var(--font-thai), sans-serif' }}>พบข้อผิดพลาด</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#ef4444', fontFamily: 'var(--font-thai), sans-serif' }}>{searchParams.message}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="login-button"
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'center',
                                    borderRadius: '0.875rem',
                                    padding: '0.875rem',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: 'white',
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
                                    transition: 'all 0.2s',
                                    fontFamily: 'var(--font-thai), sans-serif',
                                    marginTop: '0.5rem',
                                }}
                            >
                                เข้าสู่ระบบ
                            </button>
                        </form>
                    </div>

                    <p style={{
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        marginTop: '2rem',
                        color: '#94a3b8',
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontWeight: 500,
                    }}>
                        © 2026 TMK TEAM. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Responsive CSS */}
            <style>{`
                .login-input:focus {
                    border-color: #7c68ee !important;
                    box-shadow: 0 0 0 3px rgba(124,104,238,0.1) !important;
                }
                .login-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4) !important;
                }
                @media (min-width: 1024px) {
                    .login-illustration-panel {
                        display: block !important;
                    }
                    .login-mobile-logo {
                        display: none !important;
                    }
                    .login-header {
                        text-align: left;
                    }
                }
                @media (max-width: 1023px) {
                    .login-header {
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .login-card {
                        padding: 2rem 1.5rem !important;
                    }
                    .login-form-container {
                        padding: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    )
}
