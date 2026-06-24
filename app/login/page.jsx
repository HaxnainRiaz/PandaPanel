"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Input, Button } from "@/components/ui";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        const result = await login(email, password);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#e63946] text-white mb-4 shadow-md">
                        <span className="font-black text-lg">P</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1a1a2e]">
                        Panda<span className="text-[#e63946]">E-Mart</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Admin sign in</p>
                </div>

                <div className="admin-card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            icon={Mail}
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                icon={Lock}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-[#1a1a2e] transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-[10px] text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-[10px] font-semibold text-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </div>

                <p className="text-center mt-6 text-xs text-gray-400">
                    Panda E-Mart Admin · Secure access only
                </p>
            </div>
        </div>
    );
}
