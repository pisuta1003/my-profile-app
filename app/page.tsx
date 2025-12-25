'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'

interface Profile {
  id: string
  username: string
  school_info: string
  favorite_artists: string
  band_image: string
  line_name: string
  other_sns: string
  remarks: string
  band_count: string
  kikaku_count: string
  current_regular: string
  current_kikaku: string
  part: string
  part2: string
  part3: string
  part4: string
  vocal_range: string
  generation: number
  avatar_url: string
}

const PART_OPTIONS = ["未設定", "Lead", "1st", "2nd", "3rd", "4th", "Bass", "Perc"]

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [username, setUsername] = useState('')
  const [schoolInfo, setSchoolInfo] = useState('')
  const [favoriteArtists, setFavoriteArtists] = useState('')
  const [bandImage, setBandImage] = useState('')
  const [lineName, setLineName] = useState('')
  const [otherSns, setOtherSns] = useState('')
  const [remarks, setRemarks] = useState('')
  const [bandCount, setBandCount] = useState('')
  const [kikakuCount, setKikakuCount] = useState('')
  const [currentRegular, setCurrentRegular] = useState('')
  const [currentKikaku, setCurrentKikaku] = useState('')
  const [part, setPart] = useState('未設定')
  const [part2, setPart2] = useState('未設定')
  const [part3, setPart3] = useState('未設定')
  const [part4, setPart4] = useState('未設定')
  const [vocalRange, setVocalRange] = useState('')
  const [generation, setGeneration] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [myId, setMyId] = useState<string>('')

  const [searchGen, setSearchGen] = useState<string>('')
  const [searchPart, setSearchPart] = useState<string>('全パート')

  const fetchAllProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      if (data) setProfiles(data)
    } catch (e) {
      console.error("読み込みエラー:", e)
    }
  }, [])

  useEffect(() => {
    let savedId = localStorage.getItem('my_profile_id')
    if (!savedId) {
      savedId = 'user-' + Math.random().toString(36).substring(2, 11)
      localStorage.setItem('my_profile_id', savedId)
    }
    setMyId(savedId)
    fetchAllProfiles()
  }, [fetchAllProfiles])

  // 画像アップロード機能の改善
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      // ファイル名を固定（id.ext）にせずタイムスタンプを入れることで再アップロード時に確実に更新されるようにします
      const fileName = `${myId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '0' // キャッシュを無効化
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('profile_images').getPublicUrl(fileName)
      
      // クエリパラメータを付けてブラウザに「新しい画像」だと認識させる
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
      alert('画像をアップロードしました。保存ボタンを押すと反映されます。')
    } catch (error: any) {
      console.error(error)
      alert(`アップロード失敗: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!username) return alert('名前を入力してください')
    try {
      const { error } = await supabase.from('profiles').upsert({ 
        id: myId, username, school_info: schoolInfo, favorite_artists: favoriteArtists,
        band_image: bandImage, line_name: lineName, other_sns: otherSns, remarks,
        band_count: bandCount, kikaku_count: kikakuCount, current_regular: currentRegular,
        current_kikaku: currentKikaku, part, part2, part3, part4, vocal_range: vocalRange,
        generation: generation ? parseInt(generation) : null, avatar_url: avatarUrl, updated_at: new Date() 
      })
      if (error) throw error
      alert('保存しました！')
      fetchAllProfiles()
    } catch (e) {
      alert('保存に失敗しました')
    }
  }

  const deleteProfile = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('profiles').delete().eq('id', id)
    fetchAllProfiles()
  }

  const startEdit = (p: Profile) => {
    setUsername(p.username); setSchoolInfo(p.school_info || ''); setFavoriteArtists(p.favorite_artists || '');
    setBandImage(p.band_image || ''); setLineName(p.line_name || ''); setOtherSns(p.other_sns || '');
    setRemarks(p.remarks || ''); setBandCount(p.band_count || ''); setKikakuCount(p.kikaku_count || '');
    setCurrentRegular(p.current_regular || ''); setCurrentKikaku(p.current_kikaku || '');
    setPart(p.part || '未設定'); setPart2(p.part2 || '未設定'); setPart3(p.part3 || '未設定'); setPart4(p.part4 || '未設定');
    setVocalRange(p.vocal_range || ''); setGeneration(p.generation?.toString() || ''); setAvatarUrl(p.avatar_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredProfiles = profiles.filter(p => {
    const genMatch = !searchGen || p.generation?.toString() === searchGen
    const partMatch = searchPart === '全パート' || [p.part, p.part2, p.part3, p.part4].includes(searchPart)
    return genMatch && partMatch
  })

  return (
    <div className="p-2 md:p-8 max-w-3xl mx-auto space-y-6 bg-[#FEFDF5] min-h-screen text-[#454235] font-sans">
      {/* 編集セクション */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] border-2 border-[#F2EFD5] shadow-sm space-y-6">
        <h2 className="text-xl md:text-2xl font-black text-[#5C8D46] flex items-center">
          <span className="bg-[#A7C957] w-2 h-6 md:w-2.5 md:h-7 rounded-full mr-3"></span>
          プロフィール編集
        </h2>
        
        <div className="flex flex-col items-center space-y-3 py-6 bg-[#FAF9F0] rounded-3xl border-2 border-dashed border-[#E5E2C5]">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-full border-4 border-white shadow-sm" />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 bg-[#EAE8D5] rounded-full flex items-center justify-center text-[#9E9A85] font-bold border-4 border-white text-[10px]">画像なし</div>
            )}
          </div>
          {/* ローディング表示 */}
          {uploading && <p className="text-[10px] text-[#F4A261] font-bold animate-pulse">アップロード中...</p>}
          <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="text-[10px] text-[#8E8679]" />
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <div className="col-span-3">
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">サークルネーム</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] outline-none focus:border-[#F4A261] text-sm md:text-base" />
            </div>
            <div className="col-span-1">
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 text-center">期</label>
              <input type="number" value={generation} onChange={(e) => setGeneration(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] text-center outline-none focus:border-[#F4A261] text-sm md:text-base" />
            </div>
          </div>

          <div>
            <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">学校 / 学部 / 学科</label>
            <textarea 
              value={schoolInfo} 
              onChange={(e) => setSchoolInfo(e.target.value)} 
              rows={2}
              placeholder="見切れる場合は改行して入力してください"
              className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] outline-none focus:border-[#F4A261] text-sm md:text-base leading-snug resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div>
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">LINE名</label>
              <input type="text" value={lineName} onChange={(e) => setLineName(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] text-sm outline-none focus:border-[#F4A261]" />
            </div>
            <div>
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">その他SNS</label>
              <input type="text" value={otherSns} onChange={(e) => setOtherSns(e.target.value)} placeholder="X（Twitter）等" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] text-sm outline-none focus:border-[#F4A261]" />
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#F9F7E8] rounded-[2rem] border-2 border-[#EBE8D0]">
            <label className="text-[15px] font-black text-[#8C896B] mb-3 block text-center uppercase tracking-widest">希望パート選択</label>
            <div className="grid grid-cols-2 gap-2">
              {[{l:"第1希望", v:part, s:setPart, c:"bg-[#F4A261] text-white"}, 
                {l:"第2希望", v:part2, s:setPart2, c:"bg-[#E5E2C5] text-[#726F52]"}, 
                {l:"第3希望", v:part3, s:setPart3, c:"bg-[#E5E2C5] text-[#726F52]"}, 
                {l:"第4希望", v:part4, s:setPart4, c:"bg-[#E5E2C5] text-[#726F52]"}]
                .map((p, i) => (
                <div key={i} className="flex flex-col bg-white p-2 rounded-xl border border-[#DEDABA] shadow-sm">
                  <span className={`text-[15px] font-black py-1 px-2 rounded-lg mb-1 text-center ${p.c}`}>{p.l}</span>
                  <select value={p.v} onChange={(e) => (p.s as any)(e.target.value)} className="w-full text-[20px] font-bold bg-transparent outline-none text-[#5C5A40]">
                    {PART_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[12px] font-black text-[#B2AE91] block ml-1 underline decoration-[#F4A261] decoration-2">希望バンド数(正規/企画)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="正規" value={bandCount} onChange={(e) => setBandCount(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-2 rounded-xl bg-[#FFF] outline-none focus:border-[#F4A261] text-center text-sm" />
                  <input type="number" placeholder="企画" value={kikakuCount} onChange={(e) => setKikakuCount(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-2 rounded-xl bg-[#FFF] outline-none focus:border-[#F4A261] text-center text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-black text-[#B2AE91] block ml-1 underline decoration-[#FFFF00] decoration-2">現在バンド数(正規/企画)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="正規" value={currentRegular} onChange={(e) => setCurrentRegular(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-2 rounded-xl bg-[#FFF] outline-none focus:border-[#A7C957] text-center text-sm" />
                  <input type="number" placeholder="企画" value={currentKikaku} onChange={(e) => setCurrentKikaku(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-2 rounded-xl bg-[#FFF] outline-none focus:border-[#A7C957] text-center text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">好きなアーティスト / 曲</label>
              <textarea value={favoriteArtists} onChange={(e) => setFavoriteArtists(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] text-sm outline-none focus:border-[#A7C957] h-20" />
            </div>
            <div>
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">組みたいバンドのイメージ</label>
              <textarea value={bandImage} onChange={(e) => setBandImage(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] text-sm outline-none focus:border-[#A7C957] h-20" />
            </div>
            <div>
              <label className="text-[15px] md:text-xs font-black text-[#B2AE91] block mb-1 ml-1">その他・備考</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="意気込みなど" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl bg-[#FFF] text-sm outline-none focus:border-[#A7C957] h-20" />
            </div>
          </div>

          <button onClick={saveProfile} className="bg-[#F4A261] text-white p-4 rounded-[2rem] font-black w-full shadow-lg active:scale-95 transition-all text-base md:text-lg tracking-widest border-b-4 border-[#E76F51]">
            プロフィールを保存する
          </button>
        </div>
      </div>

      {/* 検索・一覧エリア */}
      <div className="flex items-center space-x-4 py-6">
        <div className="flex-1 h-[2px] bg-[#EBE8D0]"></div>
        <h2 className="text-[25px] md:text-base font-black text-[#B2AE91] italic tracking-widest">メンバー</h2>
        <div className="flex-1 h-[2px] bg-[#EBE8D0]"></div>
      </div>

      {/* 検索フォーム */}
      <div className="flex justify-center mb-8 px-1">
        <div className="flex gap-2 bg-[#F9F7E8] p-2 rounded-[2rem] border-2 border-[#EBE8D0] shadow-sm w-full max-w-md">
          <div className="flex-1 flex items-center bg-white rounded-2xl px-3 py-2">
            <span className="text-[25px] mr-2">🔍</span>
            <input type="number" placeholder="期" value={searchGen} onChange={(e) => setSearchGen(e.target.value)} className="w-full bg-transparent font-bold outline-none text-[25px] text-[#5C5A40]" />
          </div>
          <select value={searchPart} onChange={(e) => setSearchPart(e.target.value)} className="flex-1 bg-white rounded-2xl font-bold text-[25px] px-2 py-2 outline-none text-[#5C5A40]">
            <option value="全パート">全パート</option>
            {PART_OPTIONS.filter(o => o !== "未設定").map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-8 pb-24">
        {filteredProfiles.map((p) => (
          <div key={p.id} className={`p-5 md:p-6 rounded-[2.5rem] border-2 bg-white shadow-md space-y-5 relative overflow-hidden ${p.id === myId ? 'border-[#F4A261] ring-4 ring-[#F4A261]/10' : 'border-[#F2EFD5]'}`}>
            {p.id === myId && <div className="absolute top-0 right-0 bg-[#F4A261] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">マイプロフィール</div>}

            <div className="flex items-center space-x-4">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-3xl border-2 border-[#F2EFD5] shadow-sm" />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FAF9F0] rounded-3xl border-2 border-dashed border-[#E5E2C5] flex items-center justify-center text-[10px] text-[#B2AE91] font-bold">画像なし</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                  <span className="bg-[#A7C957] text-white text-[20px] px-2 py-0.5 rounded-lg font-black shrink-0">{p.generation || '??'}期</span>
                  <h3 className="font-black text-xl md:text-2xl text-[#454235] truncate leading-none">{p.username}</h3>
                </div>
                <p className="text-[13px] md:text-sm text-[#8C896B] font-bold opacity-80 whitespace-pre-wrap leading-tight">{p.school_info || '学校情報未設定'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[p.part, p.part2, p.part3, p.part4].map((pt, i) => pt && pt !== '未設定' && (
                <div key={i} className={`text-center p-1.5 rounded-xl border-2 ${i === 0 ? 'bg-[#F4A261] border-[#F4A261] text-white' : 'bg-[#FFF] border-[#F2EFD5]'}`}>
                  <p className="text-[15px] font-black mb-0.5">第{i+1}希望</p>
                  <p className="text-[20px] md:text-xs font-black">{pt}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#F4A261] text-white p-2.5 rounded-[1.5rem] shadow-sm">
                <span className="text-[15px] font-black opacity-80 block mb-0.5 uppercase tracking-tighter">希望バンド数</span>
                <div className="flex items-center justify-center space-x-3">
                  <div><span className="text-[15px] block font-bold opacity-70">正規</span><span className="text-lg font-black">{p.band_count || 0}</span></div>
                  <div><span className="text-[15px] block font-bold opacity-70">企画</span><span className="text-lg font-black">{p.kikaku_count || 0}</span></div>
                </div>
              </div>
              <div className="bg-[#FFFFCC] text-[#8C896B] p-2.5 rounded-[1.5rem] border-2 border-[#F2EFD5] shadow-sm">
                <span className="text-[15px] font-black text-[#333333] opacity-60 block mb-0.5 uppercase tracking-tighter">現在のバンド数</span>
                <div className="flex items-center justify-center space-x-3 leading-none">
                  <div><span className="text-[15px] block font-bold text-[#333333] opacity-50">正規</span><span className="text-lg font-black text-[#454235]">{p.current_regular || 0}</span></div>
                  <div><span className="text-[15px] block font-bold text-[#333333] opacity-50">企画</span><span className="text-lg font-black text-[#454235]">{p.current_kikaku || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {p.favorite_artists && (
                <div className="bg-[#FFF] p-3.5 rounded-2xl border-2 border-[#F2EFD5]">
                  <span className="font-black text-[17px] text-[#B2AE91] block mb-1 tracking-widest">好きなアーティスト/曲</span>
                  <p className="text-[18px] md:text-sm font-bold text-[#5C5A40] whitespace-pre-wrap">{p.favorite_artists}</p>
                </div>
              )}
              {p.band_image && (
                <div className="bg-[#FFF] p-3.5 rounded-2xl border-2 border-[#F2EFD5]">
                  <span className="font-black text-[17px] text-[#B2AE91] block mb-1 tracking-widest uppercase">組みたいバンドのイメージ</span>
                  <p className="text-[18px] md:text-sm font-bold text-[#5C5A40] whitespace-pre-wrap">{p.band_image}</p>
                </div>
              )}
              {p.remarks && (
                <div className="bg-[#FAF9F0] p-3.5 rounded-2xl border-2 border-[#EBE8D0]">
                  <span className="font-black text-[15px] text-[#8C896B] block mb-1 tracking-widest uppercase">備考</span>
                  <p className="text-[15px] md:text-sm font-bold text-[#5C5A40] whitespace-pre-wrap">{p.remarks}</p>
                </div>
              )}
              {(p.line_name || p.other_sns) && (
                <div className="bg-[#F4A261]/10 p-3.5 rounded-2xl border-2 border-[#F4A261]/20 flex flex-wrap gap-x-6 gap-y-2">
                  {p.line_name && <div><span className="font-black text-[15px] text-[#F4A261] block tracking-widest uppercase">LINE</span><p className="text-[15px] font-black text-[#454235]">{p.line_name}</p></div>}
                  {p.other_sns && <div><span className="font-black text-[15px] text-[#F4A261] block tracking-widest uppercase">SNS</span><p className="text-[15px] font-black text-[#454235]">{p.other_sns}</p></div>}
                </div>
              )}
            </div>

            {p.id === myId && (
              <div className="flex space-x-2 pt-2">
                <button onClick={() => startEdit(p)} className="flex-1 text-[20px] md:text-xs font-black text-white bg-[#F4A261] py-3 rounded-xl shadow-md transition-all active:scale-95">編集する</button>
                <button onClick={() => deleteProfile(p.id)} className="text-[15px] md:text-xs font-black text-[#B2AE91] bg-[#FFFF99] px-4 py-3 rounded-xl">削除</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}