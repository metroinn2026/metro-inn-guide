/* Batch deletion: never trust client-side role checks. SQL RPC enforces permissions. */
async function secureBulkDelete(db, table, ids, description) {
  if (!['spots','foods','trips','coupons','news','travel_submissions'].includes(table)) throw Error('不支援的資料類型');
  if (!ids.length || ids.length > 100) throw Error('單次只能刪除 1～100 筆');
  const {data:{user},error:userError}=await db.auth.getUser();
  if(userError || !user?.email) throw Error('請重新登入');
  const {data:profile,error:roleError}=await db.from('admin_profiles').select('role').eq('id',user.id).maybeSingle();
  if(roleError || profile?.role!=='super_admin') throw Error('僅限超級管理員刪除');
  if(!confirm(`即將永久刪除 ${description} 共 ${ids.length} 筆資料。\n已發布內容也會被刪除，且無法復原。確定繼續？`)) return null;
  const password=prompt(`請輸入目前登入的超級管理員帳號（${user.email}）密碼，驗證後永久刪除：`);
  if(password===null) return null;
  if(!password) throw Error('未輸入密碼，已取消');
  // Use an isolated, non-persistent Auth client: reauthentication must not overwrite the CMS session.
  const verificationClient=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{'X-Client-Info':'metro-inn-reauth'}}
  });
  let verified=false;
  try{
    const {data:auth,error:authError}=await verificationClient.auth.signInWithPassword({email:user.email,password});
    verified=!authError && auth?.user?.id===user.id;
  }finally{await verificationClient.auth.signOut({scope:'local'}).catch(()=>{});}
  if(!verified) throw Error('密碼驗證失敗；請確認使用目前登入帳號的密碼，或先使用忘記密碼重設');
  const {data:current,error:sessionError}=await db.auth.getUser();
  if(sessionError || current?.user?.id!==user.id) throw Error('登入狀態已變更，請重新登入');
  const {data,error}=await db.rpc('admin_secure_bulk_delete',{p_table:table,p_ids:ids.map(String)});
  if(error) throw Error(error.message);
  if(!data || data.deleted!==ids.length) throw Error('資料庫回報筆數不一致，請重新讀取確認');
  return data;
}
