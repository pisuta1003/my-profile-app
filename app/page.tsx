'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'

// --- 型定義 ---
interface Profile {
  id: string; username: string; school_info: string; favorite_artists: string;
  band_image: string; line_name: string; other_sns: string; remarks: string;
  band_count: string; kikaku_count: string; current_regular: string;
  current_kikaku: string; part: string; part2: string; part3: string;
  part4: string; vocal_range: string; gaibu_iyoku: string; 
  generation: number; avatar_url: string; deleted_at?: string | null;
}

// ... BandPost interface は変更なしのため中略 ...
interface BandPost {
  id: string; profile_id: string; title: string; content: string; created_at: string;
  post_type: '正規' | '企画' | '考え中';
  theme: string;
  members: string;
  target_parts: string;
  start_period: string;
  extra_remarks: string;
  profiles: { username: string; avatar_url: string };
  post_likes: { profile_id: string }[];
  post_comments: { id: string; content: string; profile_id: string; profiles: { username: string } }[];
}

const PART_OPTIONS = ["未設定", "Lead", "1st", "2nd", "3rd", "4th", "Bass", "Perc"]

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [posts, setPosts] = useState<BandPost[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'board'>('profile');
  const [myId, setMyId] = useState<string>('')
  
  // 自分のプロフィールが論理削除状態かどうか
  const [isMyProfileDeleted, setIsMyProfileDeleted] = useState(false);

  // プロフィール編集用ステート（中略：以前と同じ）
  const [username, setUsername] = useState(''); const [schoolInfo, setSchoolInfo] = useState('');
  const [favoriteArtists, setFavoriteArtists] = useState(''); const [bandImage, setBandImage] = useState('');
  const [lineName, setLineName] = useState(''); const [otherSns, setOtherSns] = useState('');
  const [remarks, setRemarks] = useState(''); const [bandCount, setBandCount] = useState('');
  const [kikakuCount, setKikakuCount] = useState(''); const [currentRegular, setCurrentRegular] = useState('');
  const [currentKikaku, setCurrentKikaku] = useState(''); const [part, setPart] = useState('未設定');
  const [part2, setPart2] = useState('未設定'); const [part3, setPart3] = useState('未設定');
  const [part4, setPart4] = useState('未設定'); const [vocalRange, setVocalRange] = useState('');
  const [gaibuIyoku, setGaibuIyoku] = useState('なし'); const [generation, setGeneration] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState(''); const [uploading, setUploading] = useState(false);

  // 掲示板用ステート（中略：以前と同じ）
  const [postType, setPostType] = useState<'正規' | '企画' | '考え中'>('正規')
  const [theme, setTheme] = useState(''); const [members, setMembers] = useState('');
  const [targetParts, setTargetParts] = useState(''); const [startPeriod, setStartPeriod] = useState('');
  const [extraRemarks, setExtraRemarks] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});
  const [searchGen, setSearchGen] = useState<string>(''); const [searchPart, setSearchPart] = useState<string>('全パート');

  const fetchAllProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    if (data) {
      setProfiles(data);
      // 自分のデータが削除されているかチェック
      const myProfile = data.find(p => p.id === myId);
      setIsMyProfileDeleted(!!myProfile?.deleted_at);
    }
  }, [myId])

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase.from('band_posts').select('*, profiles(username, avatar_url), post_likes(profile_id), post_comments(*, profiles(username))').order('created_at', { ascending: false });
    if (data) setPosts(data as any)
  }, [])

  useEffect(() => {
    let savedId = localStorage.getItem('my_profile_id')
    if (!savedId) { 
      savedId = 'user-' + Math.random().toString(36).substring(2, 11); 
      localStorage.setItem('my_profile_id', savedId); 
    }
    setMyId(savedId); fetchAllProfiles(); fetchPosts()
  }, [fetchAllProfiles, fetchPosts])

  const saveProfile = async () => {
    if (!username) return alert('名前を入力してください')
    await supabase.from('profiles').upsert({ 
      id: myId, username, school_info: schoolInfo, favorite_artists: favoriteArtists, band_image: bandImage, 
      line_name: lineName, other_sns: otherSns, remarks, band_count: bandCount, kikaku_count: kikakuCount, 
      current_regular: currentRegular, current_kikaku: currentKikaku, part, part2, part3, part4, 
      vocal_range: vocalRange, gaibu_iyoku: gaibuIyoku, generation: generation ? parseInt(generation) : null, 
      avatar_url: avatarUrl, updated_at: new Date(),
      deleted_at: null // 保存時は復活させる
    })
    alert('保存しました！'); fetchAllProfiles();
  }

  // --- 削除・復元機能 ---
  const handleDeleteProfile = async (id: string) => {
    if (!confirm('プロフィールを一覧から削除しますか？（後で復元できます）')) return
    await supabase.from('profiles').update({ deleted_at: new Date() }).eq('id', id);
    fetchAllProfiles();
  }

  const handleRestoreProfile = async () => {
    await supabase.from('profiles').update({ deleted_at: null }).eq('id', myId);
    alert('プロフィールを復元しました！');
    fetchAllProfiles();
  }

  const startEditProfile = (p: Profile) => {
    setMyId(p.id); setUsername(p.username); setSchoolInfo(p.school_info || '');
    setFavoriteArtists(p.favorite_artists || ''); setBandImage(p.band_image || '');
    setLineName(p.line_name || ''); setOtherSns(p.other_sns || ''); setRemarks(p.remarks || '');
    setBandCount(p.band_count || ''); setKikakuCount(p.kikaku_count || '');
    setCurrentRegular(p.current_regular || ''); setCurrentKikaku(p.current_kikaku || '');
    setPart(p.part || '未設定'); setPart2(p.part2 || '未設定'); setPart3(p.part3 || '未設定'); setPart4(p.part4 || '未設定');
    setVocalRange(p.vocal_range || ''); setGaibuIyoku(p.gaibu_iyoku || 'なし');
    setGeneration(p.generation?.toString() || ''); setAvatarUrl(p.avatar_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ... savePost, deletePost, handleLike, handleComment などの掲示板ロジックは変更なしのため省略 ...
  const savePost = async () => {
    if (!theme || !targetParts) return alert('テーマと欲しいパートを入力してください')
    const postData = {
      profile_id: myId, post_type: postType, theme, members, target_parts: targetParts,
      start_period: startPeriod, extra_remarks: extraRemarks, title: theme
    }
    if (editingPostId) {
      await supabase.from('band_posts').update(postData).eq('id', editingPostId)
      setEditingPostId(null)
    } else {
      await supabase.from('band_posts').insert(postData)
    }
    setTheme(''); setMembers(''); setTargetParts(''); setStartPeriod(''); setExtraRemarks('');
    fetchPosts(); alert(editingPostId ? '更新しました！' : '投稿しました！');
  }

  const startEditPost = (post: BandPost) => {
    setEditingPostId(post.id); setPostType(post.post_type); setTheme(post.theme);
    setMembers(post.members); setTargetParts(post.target_parts); setStartPeriod(post.start_period);
    setExtraRemarks(post.extra_remarks);
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deletePost = async (id: string) => {
    if (!confirm('この募集を削除しますか？')) return
    await supabase.from('band_posts').delete().eq('id', id)
    fetchPosts()
  }

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (hasLiked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('profile_id', myId)
    else await supabase.from('post_likes').insert({ post_id: postId, profile_id: myId })
    fetchPosts()
  }

  const handleComment = async (postId: string) => {
    const content = commentInput[postId]; if (!content) return
    await supabase.from('post_comments').insert({ post_id: postId, profile_id: myId, content })
    setCommentInput({ ...commentInput, [postId]: '' }); fetchPosts();
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true); const file = event.target.files?.[0]; if (!file) return;
    const fileName = `${myId}/${Date.now()}.${file.name.split('.').pop()}`;
    await supabase.storage.from('profile_images').upload(fileName, file);
    const { data } = supabase.storage.from('profile_images').getPublicUrl(fileName);
    setAvatarUrl(data.publicUrl); setUploading(false);
  }

  // リスト表示用フィルタ（他人の削除済みは見せない、自分のはステート次第）
  const filteredProfiles = profiles.filter(p => {
    if (p.id === myId) return !isMyProfileDeleted; // 自分が削除済みなら非表示
    return !p.deleted_at; // 他人は常に削除済み非表示
  })

  return (
    <div className="p-2 md:p-8 max-w-3xl mx-auto space-y-6 bg-[#FEFDF5] min-h-screen text-[#454235]">
      {/* タブ */}
      <div className="flex bg-[#F2EFD5] p-1 rounded-2xl mb-6 shadow-inner">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-[#5C8D46]' : 'text-[#8C896B]'}`}>プロフィール</button>
        <button onClick={() => setActiveTab('board')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'board' ? 'bg-white shadow-sm text-[#F4A261]' : 'text-[#8C896B]'}`}>バンド募集掲示板</button>
      </div>

      {activeTab === 'profile' ? (
        <>
          {/* プロフィール編集フォーム */}
          <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border-2 border-[#F2EFD5] shadow-sm space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-[#5C8D46] flex items-center"><span className="bg-[#A7C957] w-2 h-6 rounded-full mr-3"></span>プロフィール編集</h2>
            
            {/* 復元エリア：削除されている時だけ表示 */}
            {isMyProfileDeleted && (
              <div className="bg-[#FFF5F5] border-2 border-[#FF9999] p-4 rounded-2xl text-center space-y-3">
                <p className="font-black text-[#FF5192] text-[15px]">プロフィールは現在削除（非表示）されています</p>
                <button onClick={handleRestoreProfile} className="bg-[#FF5192] text-white px-6 py-2 rounded-xl font-black shadow-md hover:scale-105 transition-transform">
                  今すぐプロフィールを復元する
                </button>
              </div>
            )}

            <div className="flex flex-col items-center space-y-3 py-6 bg-[#FAF9F0] rounded-[2rem] border-2 border-dashed border-[#E5E2C5]">
              {avatarUrl ? <img src={avatarUrl} className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-sm" /> : <div className="w-24 h-24 bg-[#EAE8D5] rounded-full flex items-center justify-center text-[10px] text-[#9E9A85] font-bold">画像なし</div>}
              <input type="file" accept="image/*" onChange={uploadAvatar} className="text-[10px]" />
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3"><label className="text-[15px] font-black text-[#B2AE91] ml-2">名前</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl outline-none" /></div>
                <div className="col-span-1"><label className="text-[15px] font-black text-[#B2AE91] text-center block">期</label><input type="number" value={generation} onChange={(e) => setGeneration(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl text-center outline-none" /></div>
              </div>

              {/* ... プロフィール入力項目（中略） ... */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7E8] rounded-[2rem] border-2 border-[#EBE8D0]">
                <div className="space-y-2"><p className="text-[15px] font-black text-[#8C896B] text-center uppercase tracking-wider">希望(正規/企画)</p><div className="flex gap-2"><input type="text" value={bandCount} onChange={(e) => setBandCount(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border" /><input type="text" value={kikakuCount} onChange={(e) => setKikakuCount(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border" /></div></div>
                <div className="space-y-2"><p className="text-[15px] font-black text-[#8C896B] text-center uppercase tracking-wider">現在(正規/企画)</p><div className="flex gap-2"><input type="text" value={currentRegular} onChange={(e) => setCurrentRegular(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border" /><input type="text" value={currentKikaku} onChange={(e) => setCurrentKikaku(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border" /></div></div>
              </div>

              <div className="p-4 bg-[#FFFFCC] rounded-[2rem] border-2 border-[#EBE8D0] space-y-4">
                <label className="text-[20px] font-black text-[#8C896B] block text-center uppercase tracking-widest">希望パート</label>
                <div className="grid grid-cols-2 gap-2">
                  {[ {v:part, s:setPart, l:"第1希望"}, {v:part2, s:setPart2, l:"第2希望"}, {v:part3, s:setPart3, l:"第3希望"}, {v:part4, s:setPart4, l:"第4希望"} ].map((p, i) => (
                    <div key={i} className="bg-white p-2 rounded-xl border border-[#DEDABA]">
                      <span className="text-[15px] font-black block text-[#B2AE91]">{p.l}</span>
                      <select value={p.v} onChange={(e) => p.s(e.target.value)} className="w-full font-bold bg-transparent outline-none text-sm">{PART_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-[#cee4ae] rounded-[2rem] border-2 border-[#EBE8D0]">
                <div><label className="text-[18px] font-black text-[#8C896B] ml-2">音域</label><input type="text" value={vocalRange} onChange={(e) => setVocalRange(e.target.value)} placeholder="C3~G4など" className="w-full p-2 rounded-xl bg-white text-sm text-center" /></div>
                <div><label className="text-[18px] font-black text-[#8C896B] ml-2">外部意欲</label><select value={gaibuIyoku} onChange={(e) => setGaibuIyoku(e.target.value)} className="w-full p-2 rounded-xl bg-white text-sm font-bold"><option value="なし">なし</option><option value="あり">あり</option></select></div>
              </div>

              <div className="space-y-4">
                <input type="text" value={schoolInfo} onChange={(e) => setSchoolInfo(e.target.value)} placeholder="学校 / 学部 / 学科" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl" />
                <input type="text" value={favoriteArtists} onChange={(e) => setFavoriteArtists(e.target.value)} placeholder="好きなアーティスト / 曲" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl" />
                <input type="text" value={bandImage} onChange={(e) => setBandImage(e.target.value)} placeholder="組みたいバンドのイメージ" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="LINE名" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl" />
                  <input type="text" value={otherSns} onChange={(e) => setOtherSns(e.target.value)} placeholder="その他SNS" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl" />
                </div>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="その他備考" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl text-sm" />
              </div>

              <button onClick={saveProfile} className="bg-[#F4A261] text-white p-4 rounded-[2rem] font-black w-full shadow-lg">プロフィールを保存</button>
            </div>
          </div>

          <div className="space-y-8 pb-24 mt-8">
            {filteredProfiles.map((p) => (
              <div key={p.id} className={`p-5 md:p-6 rounded-[2.5rem] border-2 bg-white shadow-md space-y-5 relative overflow-hidden ${p.id === myId ? 'border-[#F4A261] ring-4 ring-[#F4A261]/10' : 'border-[#F2EFD5]'}`}>
                {p.id === myId && <div className="absolute top-0 right-0 bg-[#F4A261] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">マイプロフィール</div>}
                
                {/* プロフィール内容の表示（変更なし） */}
                <div className="flex items-center space-x-4">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-3xl border-2 border-[#F2EFD5]" /> : <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FAF9F0] rounded-3xl border-2 border-dashed border-[#E5E2C5] flex items-center justify-center text-[10px] text-[#B2AE91] font-bold">画像なし</div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                      <span className="bg-[#A7C957] text-white text-[20px] px-2 py-0.5 rounded-lg font-black shrink-0">{p.generation || '??'}期</span>
                      <h3 className="font-black text-xl md:text-2xl text-[#454235] truncate">{p.username}</h3>
                    </div>
                    <p className="text-[13px] md:text-sm text-[#8C896B] font-bold opacity-80">{p.school_info || '学校情報未設定'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[p.part, p.part2, p.part3, p.part4].map((pt, i) => pt && pt !== '未設定' && (
                    <div key={i} className={`text-center p-1.5 rounded-xl border-2 ${i === 0 ? 'bg-[#F4A261] border-[#F4A261] text-white' : 'bg-[#FFF] border-[#F2EFD5]'}`}>
                      <p className="text-[15px] font-black mb-0.5 opacity-80">第{i+1}希望</p>
                      <p className="text-[20px] font-black">{pt}</p>
                    </div>
                  ))}
                </div>

                {/* バンド数等の表示（中略） */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#F4A261] text-white p-2.5 rounded-[1.5rem] shadow-sm">
                    <span className="text-[15px] font-black opacity-80 block mb-0.5 uppercase tracking-tighter">希望バンド数</span>
                    <div className="flex items-center justify-center space-x-3">
                      <div><span className="text-[18px] block font-bold opacity-70 leading-tight">正規</span><span className="text-[20px] font-black">{p.band_count || 0}</span></div>
                      <div><span className="text-[18px] block font-bold opacity-70 leading-tight">企画</span><span className="text-[20px] font-black">{p.kikaku_count || 0}</span></div>
                    </div>
                  </div>
                  <div className="bg-[#FFFFCC] text-[#8C896B] p-2.5 rounded-[1.5rem] border-2 border-[#F2EFD5]">
                    <span className="text-[15px] font-black text-[#333333] opacity-60 block mb-0.5 uppercase tracking-tighter">現在のバンド数</span>
                    <div className="flex items-center justify-center space-x-3">
                      <div><span className="text-[18px] block font-bold text-[#333333] opacity-50 leading-tight">正規</span><span className="text-[20px] font-black text-[#454235]">{p.current_regular || 0}</span></div>
                      <div><span className="text-[18px] block font-bold text-[#333333] opacity-50 leading-tight">企画</span><span className="text-[20px] font-black text-[#454235]">{p.current_kikaku || 0}</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="bg-[#E6E6FA] px-3 py-1 rounded-full text-[15px] font-black text-[#8C896B]">音域: {p.vocal_range || '未入力'}</div>
                  <div className={`px-3 py-1 rounded-full text-[15px] font-black ${p.gaibu_iyoku === 'あり' ? 'bg-[#FF9999]/20 text-[#FF6666]' : 'bg-[#F2F0E4] text-[#8C896B]'}`}>外部意欲: {p.gaibu_iyoku}</div>
                </div>

                <div className="space-y-3">
                  {p.favorite_artists && <div className="bg-[#FFF] p-3.5 rounded-2xl border-2 border-[#F2EFD5]"><span className="font-black text-[15px] text-[#B2AE91] block mb-1 tracking-widest">好きなアーティスト/曲</span><p className="text-[18px] font-bold text-[#5C5A40] whitespace-pre-wrap">{p.favorite_artists}</p></div>}
                  {p.band_image && <div className="bg-[#FFF] p-3.5 rounded-2xl border-2 border-[#F2EFD5]"><span className="font-black text-[15px] text-[#B2AE91] block mb-1 tracking-widest uppercase">組みたいバンドのイメージ</span><p className="text-[18px] font-bold text-[#5C5A40] whitespace-pre-wrap">{p.band_image}</p></div>}
                  {p.remarks && <div className="bg-[#FAF9F0] p-3.5 rounded-2xl border-2 border-[#EBE8D0]"><span className="font-black text-[15px] text-[#8C896B] block mb-1 tracking-widest uppercase">備考</span><p className="text-[18px] font-bold text-[#5C5A40] whitespace-pre-wrap">{p.remarks}</p></div>}
                </div>

                <div className="flex space-x-2">
                  <button onClick={() => startEditProfile(p)} className="flex-1 text-[20px] font-black py-3 rounded-xl shadow-md bg-[#A7C957] text-white">内容を編集する</button>
                  <button onClick={() => handleDeleteProfile(p.id)} className="text-[15px] font-black text-[#FF5192] bg-[#FFFF66] px-4 py-3 rounded-xl">削除</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* --- 掲示板画面（変更なし） --- */
        <div className="space-y-6 pb-24">
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[#F4A261] shadow-md space-y-4">
            <h2 className="text-xl font-black text-[#F4A261] flex items-center gap-2">📢 {editingPostId ? '募集を編集' : 'メンバー募集を投稿'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[18px] font-black text-[#B2AE91] ml-2">募集の種類</label>
                <div className="flex gap-2 mt-1">
                  {['正規', '企画', '考え中'].map((type) => (
                    <button key={type} onClick={() => setPostType(type as any)} className={`flex-1 py-2 rounded-xl font-black text-[20px] border-2 transition-all ${postType === type ? 'bg-[#F4A261] text-white border-[#F4A261]' : 'bg-white text-[#B2AE91] border-[#F2EFD5]'}`}>{type}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-[18px] font-black text-[#B2AE91] ml-2">テーマ (曲名、方向性など)</label><input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full border-2 p-3 rounded-2xl font-bold outline-none bg-[#FFFFBB]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[18px] font-black text-[#B2AE91] ml-2">確定メンバー</label><input type="text" value={members} onChange={(e) => setMembers(e.target.value)} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none" /></div>
                <div><label className="text-[18px] font-black text-[#B2AE91] ml-2">募集パート</label><input type="text" value={targetParts} onChange={(e) => setTargetParts(e.target.value)} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none" /></div>
              </div>
              <div><label className="text-[18px] font-black text-[#B2AE91] ml-2">活動開始時期</label><input type="text" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none" /></div>
              <div><label className="text-[18px] font-black text-[#B2AE91] ml-2">その他備考</label><textarea value={extraRemarks} onChange={(e) => setExtraRemarks(e.target.value)} rows={3} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none" /></div>
              <div className="flex gap-2">
                <button onClick={savePost} className="text-[25px] flex-1 bg-[#F4A261] text-white p-4 rounded-[2rem] font-black shadow-lg">{editingPostId ? '更新する' : '投稿する'}</button>
                {editingPostId && <button onClick={() => {setEditingPostId(null); setTheme(''); setMembers(''); setTargetParts(''); setStartPeriod(''); setExtraRemarks('');}} className="bg-[#B2AE91] text-white px-6 rounded-[2rem] font-black">キャンセル</button>}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {posts.map((post) => {
              const hasLiked = post.post_likes?.some(l => l.profile_id === myId);
              const isOwner = post.profile_id === myId;
              const typeColor = post.post_type === '企画' ? 'bg-[#A7C957]' : post.post_type === '考え中' ? 'bg-[#B2AE91]' : 'bg-[#F4A261]';
              return (
                <div key={post.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-[#F2EFD5] shadow-md space-y-4 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${typeColor}`}></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {post.profiles?.avatar_url && <img src={post.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover border" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[20px] font-black px-2 py-0.5 rounded-md text-white ${typeColor}`}>{post.post_type}</span>
                          <h3 className="font-black text-lg text-[#454235]">{post.theme}</h3>
                        </div>
                        <p className="text-[20px] font-bold text-[#B2AE91]">by {post.profiles?.username || '不明'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={() => handleLike(post.id, !!hasLiked)} className={`px-4 py-2 rounded-full text-[20px] font-black ${hasLiked ? 'bg-[#FF9999] text-white' : 'bg-[#FAF9F0] text-[#B2AE91] border'}`}>❤ {post.post_likes?.length || 0}</button>
                        {isOwner && (
                            <div className="flex gap-1">
                                <button onClick={() => startEditPost(post)} className="text-[20px] font-black bg-[#A7C957] text-[white] px-2 py-1 rounded-md border">編集</button>
                                <button onClick={() => deletePost(post.id)} className="text-[20px] font-black bg-[#FFFF66] text-[#FF5192] px-2 py-1 rounded-md border border-[#FF9999]/30">削除</button>
                            </div>
                        )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[18px] font-bold">
                    <div className="bg-[#FAF9F0] p-3 rounded-2xl border border-[#F2F0E4]"><span className="text-[#8C896B] block text-[15px]">確定メンバー</span><span>{post.members || '特になし'}</span></div>
                    <div className="bg-[#F9F7E8] p-3 rounded-2xl border border-[#EBE8D0]"><span className="text-[#8C896B] block text-[15px]">募集パート</span><span className="text-[18px] text-[#F4A261] font-black">{post.target_parts || '特になし'}</span></div>
                  </div>
                  <div className="bg-[#FAF9F0] p-4 rounded-2xl border border-[#F2F0E4] space-y-2">
                    <p className="text-[15px] font-bold text-[#5C5A40]"><span className="text-[#8C896B] mr-2">【活動開始時期】</span>{post.start_period}</p>
                    <p className="text-[15px] font-bold text-[#5C5A40] leading-relaxed"><span className="text-[#8C896B] block mb-1">【備考】</span>{post.extra_remarks}</p>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-[#F2F0E4]">
                    <div className="space-y-2">
                      {post.post_comments?.map(c => (isOwner || c.profile_id === myId) && (
                        <div key={c.id} className="text-xs bg-[#F9F7E8] p-2.5 rounded-2xl border border-[#EBE8D0] flex items-start gap-2">
                          <span className="text-[12px] font-black text-[#8C896B]">{c.profiles?.username}: </span>
                          <span className="text-[15px] font-bold text-[#5C5A40]">{c.content}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 bg-[#FAF9F0] p-1.5 rounded-2xl border">
                      <input type="text" placeholder="コメント" value={commentInput[post.id] || ''} onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })} className="flex-1 bg-transparent px-3 py-1.5 text-[13px] font-bold outline-none" />
                      <button onClick={() => handleComment(post.id)} className="bg-[#F4A261] text-white px-4 py-2 rounded-xl text-[15px] font-black">送信</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}