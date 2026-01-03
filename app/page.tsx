'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'

// --- 型定義 ---
interface Profile {
  id: string; username: string; school_info: string; favorite_artists: string;
  band_image: string; line_name: string; other_sns: string; remarks: string;
  band_count: string; kikaku_count: string; current_regular: string;
  current_kikaku: string; part: string; part2: string; part3: string;
  part4: string; vocal_range: string; gaibu_iyoku: string; allergy: string; 
  generation: number; avatar_url: string; deleted_at?: string | null;
   // 経験年数なども追加があればここに定義
}

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
  // --- ステート定義 ---
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [posts, setPosts] = useState<BandPost[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'board'>('profile');
  
  // 認証関連ステート
  const [myId, setMyId] = useState<string>('')
  const [email, setEmail] = useState(''); // ユーザーIDではなくメールアドレスを使用
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 自分のプロフィール状態
  const [isMyProfileDeleted, setIsMyProfileDeleted] = useState(false);

  // プロフィール編集用ステート
  const [username, setUsername] = useState(''); 
  const [schoolInfo, setSchoolInfo] = useState('');
  const [favoriteArtists, setFavoriteArtists] = useState(''); 
  const [bandImage, setBandImage] = useState('');
  const [lineName, setLineName] = useState(''); 
  const [otherSns, setOtherSns] = useState('');
  const [remarks, setRemarks] = useState(''); 
  const [bandCount, setBandCount] = useState('');
  const [kikakuCount, setKikakuCount] = useState(''); 
  const [currentRegular, setCurrentRegular] = useState('');
  const [currentKikaku, setCurrentKikaku] = useState(''); 
  const [part, setPart] = useState('未設定');
  const [part2, setPart2] = useState('未設定'); 
  const [part3, setPart3] = useState('未設定'); 
  const [part4, setPart4] = useState('未設定'); 
  const [vocalRange, setVocalRange] = useState('');
  const [gaibuIyoku, setGaibuIyoku] = useState('なし'); 
  const [allergy, setAllergy] = useState('');
  const [generation, setGeneration] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState(''); 
  const [uploading, setUploading] = useState(false);

  // 検索・絞り込み用ステート
  const [searchGen, setSearchGen] = useState<string>(''); 
  const [searchPart, setSearchPart] = useState<string>('全パート');

  // 掲示板用ステート
  const [postType, setPostType] = useState<'正規' | '企画' | '考え中'>('正規')
  const [theme, setTheme] = useState(''); 
  const [members, setMembers] = useState('');
  const [targetParts, setTargetParts] = useState(''); 
  const [startPeriod, setStartPeriod] = useState('');
  const [extraRemarks, setExtraRemarks] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  // --- 認証機能 (メールアドレス版) ---

  // 新規登録
  const handleSignUp = async () => {
    if (!email || !password) return alert('メールアドレスとパスワードを入力してください');
    const { data, error } = await supabase.auth.signUp({ 
      email: email, 
      password: password
    });
    if (error) return alert('登録エラー: ' + error.message);
    alert('登録確認メールを送信しました（または登録完了）。ログインしてください。');
    setIsLoginView(true);
  };

  // ログイン
  const handleLogin = async () => {
    if (!email || !password) return alert('メールアドレスとパスワードを入力してください');
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email, 
      password: password
    });
    if (error) return alert('ログイン失敗: メールアドレスかパスワードが間違っています');
    
    setIsLoggedIn(true);
    if (data.user) setMyId(data.user.id);
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setMyId('');
    setEmail('');
    setPassword('');
  };

  // --- データ取得ロジック ---

  const fetchAllProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    if (data) {
      setProfiles(data);
      const myProfile = data.find(p => p.id === myId);
      setIsMyProfileDeleted(!!myProfile?.deleted_at);
    }
  }, [myId])

const fetchPosts = useCallback(async () => {
  // .select() の中身をシンプルにして、まずはデータが取れるか確認
  const { data, error } = await supabase
    .from('band_posts')
    .select(`
      *,
      profiles (username, avatar_url),
      post_likes (profile_id),
      post_comments (*, profiles(username))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("掲示板取得エラー:", error.message);
    return;
  }

  console.log("取得できた投稿数:", data?.length);
  console.log("投稿データの中身:", data);

  if (data) {
    setPosts(data as any);
  }
}, []);

  // 自動ログインチェック & データ読み込み
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyId(user.id);
        setIsLoggedIn(true);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllProfiles();
      fetchPosts();
    }
  }, [isLoggedIn, fetchAllProfiles, fetchPosts]);

  // --- プロフィール操作 ---

  const saveProfile = async () => {
    if (!username) return alert('名前を入力してください')
    
    const updateData = { 
      id: myId, // 重要：ログイン中のIDを使用
      username, 
      school_info: schoolInfo, 
      favorite_artists: favoriteArtists, 
      band_image: bandImage, 
      line_name: lineName, 
      other_sns: otherSns, 
      remarks, 
      band_count: bandCount, 
      kikaku_count: kikakuCount, 
      current_regular: currentRegular, 
      current_kikaku: currentKikaku, 
      part, part2, part3, part4, 
      vocal_range: vocalRange, 
      gaibu_iyoku: gaibuIyoku, 
      allergy: allergy, 
      generation: generation ? parseInt(generation) : null, 
      avatar_url: avatarUrl, 
      updated_at: new Date(),
      deleted_at: null 
    };

    const { error } = await supabase.from('profiles').upsert(updateData);

    if (error) {
      console.error(error);
      return alert('保存エラー: ' + error.message);
    }
    
    alert('保存しました！'); 
    fetchAllProfiles();
  }

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
    // 自分のプロフィールでない場合は編集させないガード（念のため）
    if (p.id !== myId) return alert("自分以外のプロフィールは編集できません");

    setUsername(p.username); setSchoolInfo(p.school_info || '');
    setFavoriteArtists(p.favorite_artists || ''); setBandImage(p.band_image || '');
    setLineName(p.line_name || ''); setOtherSns(p.other_sns || ''); setRemarks(p.remarks || '');
    setBandCount(p.band_count || ''); setKikakuCount(p.kikaku_count || '');
    setCurrentRegular(p.current_regular || ''); setCurrentKikaku(p.current_kikaku || '');
    setPart(p.part || '未設定'); setPart2(p.part2 || '未設定'); setPart3(p.part3 || '未設定'); setPart4(p.part4 || '未設定');
    setVocalRange(p.vocal_range || ''); setGaibuIyoku(p.gaibu_iyoku || 'なし');
    setGeneration(p.generation?.toString() || ''); setAvatarUrl(p.avatar_url || '');
    setAllergy(p.allergy || '');
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true); const file = event.target.files?.[0]; if (!file) return;
    const fileName = `${myId}/${Date.now()}.${file.name.split('.').pop()}`;
    await supabase.storage.from('profile_images').upload(fileName, file);
    const { data } = supabase.storage.from('profile_images').getPublicUrl(fileName);
    setAvatarUrl(data.publicUrl); setUploading(false);
  }

  // --- 掲示板操作 ---

  const savePost = async () => {
    if (!theme || !targetParts) return alert('テーマと募集パートを入力してください')
    const postData: any = {
      profile_id: myId, post_type: postType, theme, members, target_parts: targetParts,
      start_period: startPeriod, extra_remarks: extraRemarks, title: theme
    }
if (editingPostId) {
    // 編集時は「どの投稿か」を指定するために ID を使う
    await supabase.from('band_posts').update(postData).eq('id', editingPostId)
    setEditingPostId(null)
  } else {
    // 【重要】新規投稿時は ID を含めない（Supabaseに自動生成させる）
    const { error } = await supabase.from('band_posts').insert(postData)
    if (error) {
      console.error("投稿エラー詳細:", error);
      return alert("エラー: " + error.message);
    }
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
  if (!myId) return alert('ログインが必要です');

  if (hasLiked) {
    // 削除：自分のIDと投稿IDが一致するものだけを消す
    await supabase
      .from('post_likes')
      .delete()
      .match({ post_id: postId, profile_id: myId });
  } else {
    // 追加：念のため一回消してから入れる（409回避の裏技）
    await supabase
      .from('post_likes')
      .delete()
      .match({ post_id: postId, profile_id: myId });
      
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, profile_id: myId });

    if (error && error.code !== '23505') { // 重複エラー以外ならアラート
      console.error("追加エラー:", error.message);
    }
  }
  
  fetchPosts(); // 画面を更新
};

  const handleComment = async (postId: string) => {
  const content = commentInput[postId];
  if (!content || !myId) return;

  const { error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      profile_id: myId,
      content: content
    });

  if (error) {
    console.error("コメント送信エラー:", error.message);
    return alert('送信に失敗しました');
  }

  setCommentInput({ ...commentInput, [postId]: '' });
  fetchPosts(); // 再読み込み
};

  // --- 表示用フィルタリング ---
  const filteredProfiles = profiles.filter(p => {
    if (p.id === myId) {
        if (isMyProfileDeleted) return false;
    } else {
        if (p.deleted_at) return false;
    }
    if (searchGen && p.generation?.toString() !== searchGen) return false;
    if (searchPart !== '全パート') {
      const myParts = [p.part, p.part2, p.part3, p.part4];
      if (!myParts.includes(searchPart)) return false;
    }
    return true;
  })

  // --- メイン表示 (JSX) ---
  return (
    <div className="p-2 md:p-8 max-w-3xl mx-auto space-y-6 bg-[#FEFDF5] min-h-screen text-[#454235]">
      
      {/* ログインしていない場合 */}
      {!isLoggedIn ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-md max-w-sm mx-auto mt-20 border-2 border-[#F2EFD5]">
          <h2 className="text-2xl font-black mb-6 text-center text-[#5C8D46]">
            {isLoginView ? '部員ログイン' : '新規部員登録'}
          </h2>
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="メールアドレス" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl outline-none focus:border-[#A7C957]" 
            />
            <input 
              type="password" 
              placeholder="パスワード" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl outline-none focus:border-[#A7C957]" 
            />
            
            <button 
              onClick={isLoginView ? handleLogin : handleSignUp} 
              className="w-full bg-[#F4A261] text-white p-3 rounded-2xl font-black shadow-md hover:bg-[#e89250] transition-colors"
            >
              {isLoginView ? 'ログイン' : '登録する'}
            </button>
          </div>
          
          <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm mt-6 block mx-auto underline text-[#8C896B]">
            {isLoginView ? 'アカウント作成（初めての方）はこちら' : 'ログイン画面に戻る'}
          </button>
        </div>
      ) : (
        /* ログイン後の画面 */
        <>
          <div className="flex justify-between items-center px-2">
             <div className="text-xs text-[#8C896B] font-bold">ログイン中</div>
             <button onClick={handleLogout} className="text-xs text-[#FF9999] font-black underline">ログアウト</button>
          </div>

          <div className="flex bg-[#F2EFD5] p-1 rounded-2xl mb-6 shadow-inner">
            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-[#5C8D46]' : 'text-[#8C896B]'}`}>プロフィール</button>
            <button onClick={() => setActiveTab('board')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'board' ? 'bg-white shadow-sm text-[#F4A261]' : 'text-[#8C896B]'}`}>バンド募集掲示板</button>
          </div>

          {activeTab === 'profile' ? (
            <>
              {/* プロフィール編集フォーム */}
              <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border-2 border-[#F2EFD5] shadow-sm space-y-6">
                <h2 className="text-xl md:text-2xl font-black text-[#5C8D46] flex items-center"><span className="bg-[#A7C957] w-2 h-6 rounded-full mr-3"></span>プロフィール編集</h2>
                
                {/* 復元エリア */}
                {isMyProfileDeleted && (
                  <div className="bg-[#FFF5F5] border-2 border-[#FF9999] p-4 rounded-2xl text-center space-y-3 animate-pulse">
                    <p className="font-black text-[#FF5192] text-[15px]">プロフィールは現在削除（非表示）されています</p>
                    <button onClick={handleRestoreProfile} className="bg-[#FF5192] text-white px-6 py-2 rounded-xl font-black shadow-md hover:scale-105 transition-transform">
                      今すぐプロフィールを復元する
                    </button>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-3 py-6 bg-[#FAF9F0] rounded-[2rem] border-2 border-dashed border-[#E5E2C5]">
                  {avatarUrl ? <img src={avatarUrl} className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-sm" /> : <div className="w-24 h-24 bg-[#EAE8D5] rounded-full flex items-center justify-center text-[10px] text-[#9E9A85] font-bold">画像なし</div>}
                  <input type="file" accept="image/*" onChange={uploadAvatar} className="text-[10px]" disabled={uploading} />
                  {uploading && <p className="text-[10px] text-[#A7C957] font-bold">アップロード中...</p>}
                </div>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3"><label className="text-[15px] font-black text-[#8C896B] ml-2">名前</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl outline-none focus:border-[#A7C957]" /></div>
                    <div className="col-span-1"><label className="text-[15px] font-black text-[#8C896B] text-center block">期</label><input type="number" value={generation} onChange={(e) => setGeneration(e.target.value)} className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl text-center outline-none focus:border-[#A7C957]" /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F7E8] rounded-[2rem] border-2 border-[#EBE8D0]">
                    <div className="space-y-2"><p className="text-[16px] font-black text-[#8C896B] text-center uppercase tracking-wider">希望(正規/企画)</p><div className="flex gap-2"><input type="text" value={bandCount} onChange={(e) => setBandCount(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border focus:ring-2 ring-[#A7C957]" /><input type="text" value={kikakuCount} onChange={(e) => setKikakuCount(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border focus:ring-2 ring-[#A7C957]" /></div></div>
                    <div className="space-y-2"><p className="text-[16px] font-black text-[#8C896B] text-center uppercase tracking-wider">現在(正規/企画)</p><div className="flex gap-2"><input type="text" value={currentRegular} onChange={(e) => setCurrentRegular(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border focus:ring-2 ring-[#A7C957]" /><input type="text" value={currentKikaku} onChange={(e) => setCurrentKikaku(e.target.value)} className="w-full p-2 rounded-xl bg-white text-center border focus:ring-2 ring-[#A7C957]" /></div></div>
                  </div>

                  <div className="p-4 bg-[#FFFFCC] rounded-[2rem] border-2 border-[#EBE8D0] space-y-4">
                    <label className="text-[18px] font-black text-[#8C896B] block text-center uppercase tracking-widest">希望パート</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[ {v:part, s:setPart, l:"第1希望"}, {v:part2, s:setPart2, l:"第2希望"}, {v:part3, s:setPart3, l:"第3希望"}, {v:part4, s:setPart4, l:"第4希望"} ].map((p, i) => (
                        <div key={i} className="bg-white p-2 rounded-xl border border-[#DEDABA]">
                          <span className="text-[16px] font-black block text-[#B2AE91]">{p.l}</span>
                          <select value={p.v} onChange={(e) => p.s(e.target.value)} className="w-full text-[16px] font-bold bg-transparent outline-none text-sm cursor-pointer">{PART_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#cee4ae] rounded-[2rem] border-2 border-[#EBE8D0]">
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">音域</label><input type="text" value={vocalRange} onChange={(e) => setVocalRange(e.target.value)} placeholder="C3~G4など" className="w-full p-2 rounded-xl bg-white text-sm text-center focus:outline-none" /></div>
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">外部意欲</label><select value={gaibuIyoku} onChange={(e) => setGaibuIyoku(e.target.value)} className="w-full p-2 rounded-xl bg-white text-sm font-bold cursor-pointer"><option value="なし">なし</option><option value="あり">あり</option></select></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#f5f5f5] rounded-[2rem] border-2 border-[#EBE8D0]">
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">アレルギー(任意)</label><input type="text" value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="" className="w-full p-2 rounded-xl bg-white text-sm text-center focus:outline-none" /></div>
                  </div>

                  <div className="space-y-4">
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">学校 / 学部 / 学科</label><input type="text" value={schoolInfo} onChange={(e) => setSchoolInfo(e.target.value)} placeholder="" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl focus:border-[#A7C957] outline-none" /></div>
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">好きなアーティスト / 曲</label><input type="text" value={favoriteArtists} onChange={(e) => setFavoriteArtists(e.target.value)} placeholder="" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl focus:border-[#A7C957] outline-none" /></div>
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">組みたいバンドのイメージ</label><input type="text" value={bandImage} onChange={(e) => setBandImage(e.target.value)} placeholder="" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl focus:border-[#A7C957] outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[15px] font-black text-[#8C896B] ml-2">LINE名</label><input type="text" value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl focus:border-[#A7C957] outline-none" /></div>
                      <div><label className="text-[15px] font-black text-[#8C896B] ml-2">その他SNS</label><input type="text" value={otherSns} onChange={(e) => setOtherSns(e.target.value)} placeholder="" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl focus:border-[#A7C957] outline-none" /></div>
                    </div>
                    <div><label className="text-[15px] font-black text-[#8C896B] ml-2">その他備考</label><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="" className="w-full border-2 border-[#F2F0E4] p-3 rounded-2xl text-sm focus:border-[#A7C957] outline-none" /></div>
                  </div>

                  <button onClick={saveProfile} className="bg-[#F4A261] text-[25px] text-white p-4 rounded-[2rem] font-black w-full shadow-lg hover:bg-[#e89250] transition-colors">プロフィールを保存！</button>
                </div>
              </div>

              {/* 絞り込み検索エリア */}
              <div className="bg-[#F2EFD5] p-5 rounded-[2rem] border-2 border-[#E5E2C5] shadow-inner space-y-4">
                <h3 className="font-black text-[18px] text-[#8C896B] text-center text-sm uppercase tracking-widest">メンバー検索</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-2 rounded-2xl border border-[#DEDABA]">
                    <label className="text-[15px] font-black block text-[#B2AE91] ml-2">期で検索</label>
                    <input type="number" placeholder="半角数字" value={searchGen} onChange={(e) => setSearchGen(e.target.value)} className="w-full font-bold bg-transparent outline-none text-center" />
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-[#DEDABA]">
                    <label className="text-[14px] font-black block text-[#B2AE91] ml-2">パートで検索</label>
                    <select value={searchPart} onChange={(e) => setSearchPart(e.target.value)} className="w-full font-bold bg-transparent outline-none cursor-pointer">
                      <option value="全パート">全パート</option>
                      {PART_OPTIONS.filter(o => o !== "未設定").map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pb-24">
                {filteredProfiles.map((p) => (
                  <div key={p.id} className={`p-5 md:p-6 rounded-[2.5rem] border-2 bg-white shadow-md space-y-5 relative overflow-hidden transition-all ${p.id === myId ? 'border-[#F4A261] ring-4 ring-[#F4A261]/10' : 'border-[#F2EFD5]'}`}>
                    {p.id === myId && <div className="absolute top-0 right-0 bg-[#F4A261] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">マイプロフィール</div>}
                    
                    <div className="flex items-center space-x-4">
                      {p.avatar_url ? <img src={p.avatar_url} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-3xl border-2 border-[#F2EFD5]" /> : <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FAF9F0] rounded-3xl border-2 border-dashed border-[#E5E2C5] flex items-center justify-center text-[10px] text-[#B2AE91] font-bold">画像なし</div>}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                          <span className="bg-[#A7C957] text-white text-[18px] px-2 py-0.5 rounded-lg font-black shrink-0">{p.generation || '??'}期</span>
                          <h3 className="font-black text-xl md:text-2xl text-[#454235] truncate">{p.username}</h3>
                        </div>
                        <p className="text-[15px] md:text-sm text-[#8C896B] font-bold opacity-80">{p.school_info || '学校情報未設定'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[p.part, p.part2, p.part3, p.part4].map((pt, i) => pt && pt !== '未設定' && (
                        <div key={i} className={`text-center p-1.5 rounded-xl border-2 ${i === 0 ? 'bg-[#F4A261] border-[#F4A261] text-white' : 'bg-[#FFF] border-[#F2EFD5]'}`}>
                          <p className="text-[16px] font-black mb-0.5 opacity-80">第{i+1}希望</p>
                          <p className="text-[20px] font-black">{pt}</p>
                        </div>
                      ))}
                    </div>

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

                    <div className="flex gap-2 flex-wrap">
                      <div className="bg-[#E6E6FA] px-3 py-1 rounded-full text-[15px] font-black text-[#8C896B]">音域: {p.vocal_range || '未入力'}</div>
                      <div className={`px-3 py-1 rounded-full text-[15px] font-black ${p.gaibu_iyoku === 'あり' ? 'bg-[#FF9999]/20 text-[#FF6666]' : 'bg-[#F2F0E4] text-[#8C896B]'}`}>外部意欲: {p.gaibu_iyoku}</div>
                      <div className="bg-[#ffebcd] px-3 py-1 rounded-full text-[15px] font-black text-[#8C896B]">アレルギー: {p.allergy || '未入力'}</div>
                    </div>

                    <div className="space-y-3">
                      {p.favorite_artists && <div className="bg-[#FFF] p-3.5 rounded-2xl border-2 border-[#F2EFD5]"><span className="font-black text-[16px] text-[#B2AE91] block mb-1 tracking-widest uppercase">好きなアーティスト/曲</span><p className="text-[18px] font-bold text-[#5C5A40] whitespace-pre-wrap">{p.favorite_artists}</p></div>}
                      {p.band_image && <div className="bg-[#FFF] p-3.5 rounded-2xl border-2 border-[#F2EFD5]"><span className="font-black text-[16px] text-[#B2AE91] block mb-1 tracking-widest uppercase">組みたいイメージ</span><p className="text-[18px] font-bold text-[#5C5A40] whitespace-pre-wrap">{p.band_image}</p></div>}
                      {p.remarks && <div className="bg-[#FAF9F0] p-3.5 rounded-2xl border-2 border-[#EBE8D0]"><span className="font-black text-[16px] text-[#8C896B] block mb-1 tracking-widest uppercase">備考</span><p className="text-[18px] font-bold text-[#5C5A40] whitespace-pre-wrap">{p.remarks}</p></div>}
                    </div>

                    <div className="flex space-x-2">
                      {p.id === myId && <button onClick={() => startEditProfile(p)} className="flex-1 text-[20px] font-black py-3 rounded-xl shadow-md bg-[#A7C957] text-white hover:bg-[#96b54e] transition-colors">内容を編集する</button>}
                      {p.id === myId && <button onClick={() => handleDeleteProfile(p.id)} className="text-[13px] font-black text-[#FF5192] bg-[#FFFF66] px-4 py-3 rounded-xl hover:bg-[#f2f25a] transition-colors">削除</button>}
                    </div>
                  </div>
                ))}
                {filteredProfiles.length === 0 && <p className="text-center font-bold text-[#B2AE91] py-10">該当する部員が見つかりませんでした</p>}
              </div>
            </>
          ) : (
            /* --- 掲示板画面 --- */
            <div className="space-y-6 pb-24">
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[#F4A261] shadow-md space-y-4">
                <h2 className="text-xl font-black text-[#F4A261] flex items-center gap-2">📢 {editingPostId ? '募集を編集' : 'メンバー募集を投稿'}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[16px] font-black text-[#B2AE91] ml-2">募集の種類</label>
                    <div className="flex gap-2 mt-1">
                      {['正規', '企画', '考え中'].map((type) => (
                        <button key={type} onClick={() => setPostType(type as any)} className={`flex-1 py-2 rounded-xl font-black text-[20px] border-2 transition-all ${postType === type ? 'bg-[#F4A261] text-white border-[#F4A261]' : 'bg-white text-[#B2AE91] border-[#F2EFD5]'}`}>{type}</button>
                      ))}
                    </div>
                  </div>
                  <div><label className="text-[14px] font-black text-[#B2AE91] ml-2">テーマ (曲、方向性など)</label><input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full border-2 p-3 rounded-2xl font-bold outline-none bg-[#FFFFBB] focus:border-[#F4A261]" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[14px] font-black text-[#B2AE91] ml-2">確定メンバー</label><input type="text" value={members} onChange={(e) => setMembers(e.target.value)} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#F4A261]" /></div>
                    <div><label className="text-[14px] font-black text-[#B2AE91] ml-2">募集パート</label><input type="text" value={targetParts} onChange={(e) => setTargetParts(e.target.value)} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#F4A261]" /></div>
                  </div>
                  <div><label className="text-[14px] font-black text-[#B2AE91] ml-2">活動開始時期</label><input type="text" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#F4A261]" /></div>
                  <div><label className="text-[14px] font-black text-[#B2AE91] ml-2">その他備考</label><textarea value={extraRemarks} onChange={(e) => setExtraRemarks(e.target.value)} rows={3} className="w-full border-2 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#F4A261]" /></div>
                  <div className="flex gap-2">
                    <button onClick={savePost} className="text-[18px] flex-1 bg-[#F4A261] text-white p-4 rounded-[2rem] font-black shadow-lg hover:bg-[#e89250] transition-colors">{editingPostId ? '更新する' : '投稿する'}</button>
                    {editingPostId && <button onClick={() => {setEditingPostId(null); setTheme(''); setMembers(''); setTargetParts(''); setStartPeriod(''); setExtraRemarks('');}} className="bg-[#B2AE91] text-white px-6 rounded-[2rem] font-black">キャンセル</button>}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {posts.map((post) => {
                  // posts.map((post) => { ... のすぐ下
const hasLiked = post.post_likes?.some(
  (like: any) => String(like.profile_id) === String(myId)
) ?? false; 
                 post.post_likes.some(like => like.profile_id === myId);
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
                            <p className="text-[18px] font-bold text-[#B2AE91]">by {post.profiles?.username || '不明'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={() => handleLike(post.id, !!hasLiked)} className={`px-4 py-2 rounded-full text-[18px] font-black transition-all ${hasLiked ? 'bg-[#FF9999] text-white' : 'bg-[#FAF9F0] text-[#B2AE91] border hover:bg-white'}`}>❤ {post.post_likes?.length || 0}</button>
                            {isOwner && (
                                <div className="flex gap-1">
                                    <button onClick={() => startEditPost(post)} className="text-[18px] font-black bg-[#A7C957] text-[white] px-2 py-1 rounded-md border hover:bg-[#96b54e]">編集</button>
                                    <button onClick={() => deletePost(post.id)} className="text-[18px] font-black bg-[#FFFF66] text-[#FF5192] px-2 py-1 rounded-md border border-[#FF9999]/30 hover:bg-[#f2f25a]">削除</button>
                                </div>
                            )}
                        </div>
                      </div>
                      <div className="space-y-2 pl-4">
                         <div className="bg-[#FFFFBB] p-3 rounded-xl"><span className="text-xs font-black text-[#B2AE91] block">確定メンバー</span><p className="font-bold">{post.members || '未定'}</p></div>
                         <div className="bg-[#FFEDD5] p-3 rounded-xl border-2 border-[#F4A261]"><span className="text-xs font-black text-[#F4A261] block">募集パート</span><p className="font-black text-lg text-[#F4A261]">{post.target_parts}</p></div>
                         <p className="text-sm font-bold text-[#8C896B]">開始時期: {post.start_period}</p>
                         <p className="text-sm font-bold text-[#5C5A40] whitespace-pre-wrap">{post.extra_remarks}</p>
                      </div>

                      {/* コメント欄 */}
                      <div className="bg-[#FAF9F0] p-4 rounded-2xl border border-[#E5E2C5] mt-4">
                        <h4 className="font-black text-sm text-[#8C896B] mb-2">コメント ({post.post_comments?.length || 0})</h4>
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                          {post.post_comments?.map(c => (
                            <div key={c.id} className="bg-white p-2 rounded-lg text-sm">
                              <span className="font-black text-[#A7C957] mr-2">{c.profiles?.username}:</span>
                              <span className="font-bold text-[#5C5A40]">{c.content}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="コメントを書く..." 
                            value={commentInput[post.id] || ''} 
                            onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                            className="flex-1 p-2 rounded-lg border outline-none text-sm"
                          />
                          <button onClick={() => handleComment(post.id)} className="bg-[#B2AE91] text-white px-3 py-1 rounded-lg font-black text-xs">送信</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}