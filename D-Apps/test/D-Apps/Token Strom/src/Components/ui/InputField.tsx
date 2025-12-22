export interface InputFormProps {
    label: string
    placeholder: string
    value?: string
    type?: string
    large?: boolean
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function InputForm({ label, placeholder, value, type, large, onChange }: InputFormProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-zinc-350 font-medium text-sm mt-6">{label}</label>
            {large ? (
                <textarea
                 className={`bg-white py-2 px-3 border border-zinc-300 placeholder:text-zinc-500 text-zinc-900 shadow-xs rounded-lg focus:ring-[4px] focus:ring-blue-400/30 focus:border-blue-400 focus:outline-none h-24 align-text-top transition-all duration-200 hover:border-zinc-400 active:bg-blue-50`}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                />
            ) : (
                <input
                    className={`bg-white py-2 px-3 border border-zinc-300 placeholder:text-zinc-500 text-zinc-900 shadow-xs rounded-lg focus:ring-[4px] focus:ring-blue-400/30 focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-zinc-400 active:bg-blue-50`}
                    type={type}
                    placeholder={placeholder}   
                    value={value || ''}
                    onChange={onChange}
                />
            )}
        </div>
    )
}