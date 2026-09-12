import React from "react"

export interface InputFormProps {
    label: string
    placeholder: string
    value?: string
    type?: string
    large?: boolean
    rows?: number
    disabled?: boolean
    error?: string
    hint?: string
    rightElement?: React.ReactNode
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function InputForm({
    label,
    placeholder,
    value,
    type = "text",
    large,
    rows = 4,
    disabled,
    error,
    hint,
    rightElement,
    onChange,
}: InputFormProps) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-medium text-xs tracking-wider uppercase">{label}</label>
                {rightElement && <div>{rightElement}</div>}
            </div>

            {large ? (
                <textarea
                    rows={rows}
                    disabled={disabled}
                    className={`w-full bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 font-mono text-sm px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        error
                            ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/20"
                            : "border-zinc-700/80 hover:border-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20"
                    }`}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={onChange}
                />
            ) : (
                <input
                    disabled={disabled}
                    className={`w-full bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 text-sm px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        error
                            ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/20"
                            : "border-zinc-700/80 hover:border-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20"
                    }`}
                    type={type}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={onChange}
                />
            )}

            {error && <span className="text-red-400 text-xs mt-0.5">{error}</span>}
            {hint && !error && <span className="text-zinc-400 text-xs mt-0.5">{hint}</span>}
        </div>
    )
}