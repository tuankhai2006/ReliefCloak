'use client'
// Hiện 🔒 + một đoạn ciphertext, hoặc plaintext nếu đã giải mã.
export default function EncryptedField({
  label,
  cipher,
  plain,
  error,
}: {
  label: string
  cipher: string
  plain?: string
  error?: string
}) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label}: </span>
      {plain ? (
        <span className="font-mono text-green-700">🔓 {plain}</span>
      ) : (
        <span className="font-mono text-slate-400" title={cipher}>
          🔒 {cipher.slice(0, 18)}…
        </span>
      )}
      {error && <div className="text-xs text-red-600">❌ {error}</div>}
    </div>
  )
}
