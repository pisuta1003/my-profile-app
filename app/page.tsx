'use client'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

interface Profile {
  id: string
  username: string
  bio: string
  band_count: string
  part: string // 追加
}

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [bandCount, setBandCount] = useState('')
  const [part, setPart] = useState('') // 追加
  const [myId, setMyId] = useState<string>('')

  useEffect(() => {
    let savedId = localStorage.getItem('my_profile_id')
    if (!savedId) {
      savedId = 'user-' + Math.random().toString(36).substring(2, 11)
      localStorage.setItem('my_profile_id', savedId)
    }
    setMyId(savedId)
    fetchAllProfiles()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllProfiles())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })
    if (data) setProfiles(data)
  }

  const saveProfile = async () => {
    if (!username) return alert('名前を入力してください')
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: myId, 
        username, 
        bio, 
        band_count: bandCount,
        part: part, // 追加
        updated_at: new Date() 
      })
    if (error) alert('保存に失敗しました')
  }

  const deleteProfile = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    await supabase.from('profiles').delete().eq('id', id)
  }

  const startEdit = (profile: Profile) => {
    setUsername(profile.username)
    setBio(profile.bio)
    setBandCount(profile.band_count || '')
    setPart(profile.part || '') // 追加
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 bg-white min-h-screen text-black">
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold">プロフィールを編集</h2>
        
        <div>
          <label className="text-sm font-bold text-gray-600">サークルネーム</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-3 rounded-lg border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* --- 新しい入力欄 --- */}
        <div>
          <label className="text-sm font-bold text-gray-600">組みたい正規バンド数</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              value={bandCount}
              onChange={(e) => setBandCount(e.target.value)}
              className="w-24 border p-3 rounded-lg border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <span className="font-bold text-gray-700">個</span>
            <input
             placeholder="第1希望パート"
             value={part}
             onChange={(e) => setPart(e.target.value)}
             className="flex-1 border p-3 rounded-lg border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {/* ------------------ */}

        <div>
          <label className="text-sm font-bold text-gray-600">自己紹介・意気込み</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border p-3 rounded-lg h-32 border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button onClick={saveProfile} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-blue-700">
          保存して公開する
        </button>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h2 className="text-xl font-bold mb-6">みんなのプロフィール</h2>
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className={`p-5 rounded-xl border shadow-sm ${profile.id === myId ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-blue-700">{profile.username}</h3>
                  {/* --- 表示側 --- */}
                  <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold my-1">
                    組みたい正規バンド数：{profile.band_count || 0} 個
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    第1希望パート:{profile.part || '未設定'}
                  </div>
                  {/* -------------- */}
                </div>
                {profile.id === myId && (
                  <div className="space-x-2">
                    <button onClick={() => startEdit(profile)} className="text-sm text-gray-600 underline">編集</button>
                    <button onClick={() => deleteProfile(profile.id)} className="text-sm text-red-500 underline">削除</button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed border-t pt-2 mt-2">{profile.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}