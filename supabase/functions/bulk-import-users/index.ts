import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  nama: string
  email: string
  password: string
  role: 'guru' | 'siswa'
  // Guru specific
  nip?: string
  // Siswa specific
  nis?: string
  kelas_id?: string
  tanggal_lahir?: string
  alamat?: string
}

interface ImportResult {
  success: boolean
  email: string
  error?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can bulk import users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { users } = await req.json() as { users: UserData[] }
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: 'No users provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (users.length > 50) {
      return new Response(JSON.stringify({ error: 'Maximum 50 users per batch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results: ImportResult[] = []

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.email || !userData.nama || !userData.password || !userData.role) {
          results.push({
            success: false,
            email: userData.email || 'unknown',
            error: 'Missing required fields (email, nama, password, role)'
          })
          continue
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { nama: userData.nama }
        })

        if (authError) {
          results.push({
            success: false,
            email: userData.email,
            error: authError.message
          })
          continue
        }

        const userId = authData.user.id

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: userData.role })

        if (roleError) {
          results.push({
            success: false,
            email: userData.email,
            error: `User created but role assignment failed: ${roleError.message}`
          })
          continue
        }

        // Create role-specific record
        if (userData.role === 'guru') {
          const { error: guruError } = await supabaseAdmin
            .from('guru')
            .insert({
              user_id: userId,
              nip: userData.nip || null
            })

          if (guruError) {
            results.push({
              success: false,
              email: userData.email,
              error: `User created but guru record failed: ${guruError.message}`
            })
            continue
          }
        } else if (userData.role === 'siswa') {
          const { error: siswaError } = await supabaseAdmin
            .from('siswa')
            .insert({
              user_id: userId,
              nis: userData.nis || `NIS-${Date.now()}`,
              kelas_id: userData.kelas_id || null,
              tanggal_lahir: userData.tanggal_lahir || null,
              alamat: userData.alamat || null
            })

          if (siswaError) {
            results.push({
              success: false,
              email: userData.email,
              error: `User created but siswa record failed: ${siswaError.message}`
            })
            continue
          }
        }

        results.push({
          success: true,
          email: userData.email
        })

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          email: userData.email || 'unknown',
          error: errorMessage
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(JSON.stringify({
      message: `Import completed: ${successCount} success, ${failCount} failed`,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
