import { publicPosts } from '@/services/communityService'
export const dynamic = 'force-dynamic'
export default function PostsPage() {
  const posts = publicPosts()
  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Bảng tin cứu trợ</h1>
    <p className="text-slate-600">Thông tin do admin biên tập từ report. Bài đăng không phải quyết định giải ngân.</p>
    {!posts.length && <p>Chưa có bài đăng. Người dân có thể gửi report để admin tiếp nhận.</p>}
    {posts.map(post => <article key={post.id} className="space-y-2 rounded-lg border bg-white p-5">
      <p className="text-sm text-blue-700">{post.region} · {new Date(post.publishedAt).toLocaleString('vi-VN')}</p>
      <h2 className="text-xl font-semibold">{post.title}</h2>
      <p className="whitespace-pre-wrap">{post.content}</p>
    </article>)}
  </div>
}
