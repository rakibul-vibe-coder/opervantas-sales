import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth/session'
import { getDb } from '@/lib/db/pg'

export async function createClient() {
  const session = await getSessionUser()
  const db = getDb()

  // Build a query adapter that runs on our real PostgreSQL database
  const pgAdapter: any = {
    auth: {
      async getUser() {
        if (!session) return { data: { user: null }, error: new Error('Not logged in') }
        return {
          data: {
            user: {
              id: session.userId,
              email: `${session.username}@salesmanager.internal`,
              user_metadata: {
                username: session.username,
                full_name: session.fullName,
              },
            },
          },
          error: null,
        }
      },
      async signOut() {
        return { error: null }
      },
    },

    from(table: string) {
      return {
        select(fields: string = '*', options?: { count?: string }) {
          const params: any[] = []
          const filters: string[] = []
          let orderByClause = ''
          let limitVal: number | null = null
          let offsetVal: number | null = null
          let isSingle = false

          const queryObj: any = {
            eq(col: string, val: any) {
              params.push(val)
              filters.push(`${col} = $${params.length}`)
              return queryObj
            },
            gte(col: string, val: any) {
              params.push(val)
              filters.push(`${col} >= $${params.length}`)
              return queryObj
            },
            lte(col: string, val: any) {
              params.push(val)
              filters.push(`${col} <= $${params.length}`)
              return queryObj
            },
            ilike(col: string, val: any) {
              params.push(val)
              filters.push(`${col} ILIKE $${params.length}`)
              return queryObj
            },
            or(clause: string) {
              return queryObj
            },
            order(col: string, opts?: { ascending?: boolean }) {
              orderByClause = `ORDER BY ${col} ${opts?.ascending ? 'ASC' : 'DESC'}`
              return queryObj
            },
            range(from: number, to: number) {
              offsetVal = from
              limitVal = to - from + 1
              return queryObj
            },
            limit(count: number) {
              limitVal = count
              return queryObj
            },
            single() {
              isSingle = true
              return queryObj
            },
            async then(resolve: any, reject: any) {
              try {
                let sql = `SELECT ${fields} FROM ${table}`
                if (filters.length > 0) {
                  sql += ` WHERE ${filters.join(' AND ')}`
                }
                if (orderByClause) sql += ` ${orderByClause}`
                if (limitVal !== null) sql += ` LIMIT ${limitVal}`
                if (offsetVal !== null) sql += ` OFFSET ${offsetVal}`

                const res = await db.query(sql, params)

                let count = null
                if (filters.length > 0) {
                  const countRes = await db.query(`SELECT count(*) FROM ${table} WHERE ${filters.join(' AND ')}`, params)
                  count = parseInt((countRes.rows[0] as any)?.count || '0')
                } else {
                  const countRes = await db.query(`SELECT count(*) FROM ${table}`)
                  count = parseInt((countRes.rows[0] as any)?.count || '0')
                }

                if (isSingle) {
                  return resolve({ data: res.rows[0] || null, error: null })
                }
                return resolve({ data: res.rows, count, error: null })
              } catch (err: any) {
                return resolve({ data: null, error: err })
              }
            }
          }
          return queryObj
        },

        insert(data: any) {
          const isInputArray = Array.isArray(data)
          const rowsToInsert = isInputArray ? [...data] : [{ ...data }]
          let isSingle = !isInputArray

          const insertObj: any = {
            select(fields: string = '*') {
              return insertObj
            },
            single() {
              isSingle = true
              return insertObj
            },
            async then(resolve: any, reject: any) {
              try {
                const inserted: any[] = []
                for (const row of rowsToInsert) {
                  const r = { ...row }
                  if (table === 'sales' && !r.sale_number) {
                    const countRes = await db.query(`SELECT count(*) FROM sales`)
                    const num = parseInt((countRes.rows[0] as any)?.count || '0') + 1
                    const d = (r.business_date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')
                    r.sale_number = `SL-${d}-${String(num).padStart(4, '0')}`
                  }
                  if (table === 'expenses' && !r.expense_number) {
                    const countRes = await db.query(`SELECT count(*) FROM expenses`)
                    const num = parseInt((countRes.rows[0] as any)?.count || '0') + 1
                    const d = (r.business_date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')
                    r.expense_number = `EX-${d}-${String(num).padStart(4, '0')}`
                  }

                  const cols = Object.keys(r)
                  const vals = cols.map(c => r[c])
                  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
                  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`
                  const res = await db.query(sql, vals)
                  inserted.push(res.rows[0])
                }
                return resolve({ data: isSingle ? inserted[0] : inserted, error: null })
              } catch (err: any) {
                return resolve({ data: null, error: err })
              }
            }
          }
          return insertObj
        },

        update(updateData: any) {
          const filters: string[] = []
          const params: any[] = []
          const cols = Object.keys(updateData)
          cols.forEach(c => params.push(updateData[c]))
          const setPairs = cols.map((c, i) => `${c} = $${i + 1}`).join(', ')
          let isSingle = false

          const updateObj: any = {
            eq(col: string, val: any) {
              params.push(val)
              filters.push(`${col} = $${params.length}`)
              return updateObj
            },
            select(fields: string = '*') {
              return updateObj
            },
            single() {
              isSingle = true
              return updateObj
            },
            async then(resolve: any, reject: any) {
              try {
                let sql = `UPDATE ${table} SET ${setPairs}`
                if (filters.length > 0) {
                  sql += ` WHERE ${filters.join(' AND ')}`
                }
                sql += ` RETURNING *`
                const res = await db.query(sql, params)
                return resolve({ data: isSingle ? res.rows[0] : res.rows, error: null })
              } catch (err: any) {
                return resolve({ data: null, error: err })
              }
            }
          }
          return updateObj
        },

        delete() {
          const filters: string[] = []
          const params: any[] = []

          const deleteObj: any = {
            eq(col: string, val: any) {
              params.push(val)
              filters.push(`${col} = $${params.length}`)
              return deleteObj
            },
            async then(resolve: any, reject: any) {
              try {
                let sql = `DELETE FROM ${table}`
                if (filters.length > 0) {
                  sql += ` WHERE ${filters.join(' AND ')}`
                }
                sql += ` RETURNING *`
                const res = await db.query(sql, params)
                return resolve({ data: res.rows, error: null })
              } catch (err: any) {
                return resolve({ data: null, error: err })
              }
            }
          }
          return deleteObj
        }
      }
    },

    async rpc(funcName: string, args?: any) {
      if (funcName === 'get_dashboard_summary') {
        const bDate = args?.p_business_date
        const salesRes = await db.query(
          `SELECT 
            SUM(total_selling_amount) as total_sales,
            SUM(total_purchase_cost) as total_purchase_cost,
            SUM(gross_profit) as total_gross_profit,
            SUM(quantity) as total_quantity,
            COUNT(*) as total_transactions,
            COUNT(DISTINCT salesman_id) as active_salespeople
           FROM sales WHERE business_date = $1 AND status = 'active'`,
          [bDate]
        )
        const expRes = await db.query(
          `SELECT SUM(amount) as total_expenses FROM expenses WHERE business_date = $1 AND status = 'active'`,
          [bDate]
        )
        const s = salesRes.rows[0] as any
        const e = expRes.rows[0] as any
        const gross = Number(s?.total_gross_profit || 0)
        const expenses = Number(e?.total_expenses || 0)

        return {
          data: [{
            total_sales: Number(s?.total_sales || 0),
            total_purchase_cost: Number(s?.total_purchase_cost || 0),
            total_gross_profit: gross,
            total_expenses: expenses,
            net_profit: gross - expenses,
            total_quantity: Number(s?.total_quantity || 0),
            total_transactions: Number(s?.total_transactions || 0),
            active_salespeople: Number(s?.active_salespeople || 0),
          }],
          error: null,
        }
      }

      if (funcName === 'get_salesman_performance') {
        const bDate = args?.p_business_date
        const res = await db.query(
          `SELECT 
            s.salesman_id,
            s.salesman_name,
            p.employee_id,
            COUNT(*)::bigint as transactions,
            SUM(s.quantity)::bigint as total_quantity,
            SUM(s.total_selling_amount) as total_sales,
            SUM(s.total_purchase_cost) as total_purchase_cost,
            SUM(s.gross_profit) as gross_profit,
            MAX(s.created_at) as last_sale_at
           FROM sales s
           JOIN profiles p ON p.id = s.salesman_id
           WHERE s.business_date = $1 AND s.status = 'active'
           GROUP BY s.salesman_id, s.salesman_name, p.employee_id
           ORDER BY gross_profit DESC`,
          [bDate]
        )
        return { data: res.rows, error: null }
      }

      return { data: null, error: null }
    },
  }

  return pgAdapter
}

export function createAdminClient() {
  const db = getDb()
  return {
    auth: {
      admin: {
        async createUser(params: any) {
          const id = crypto.randomUUID()
          const cryptoModule = require('crypto')
          const hash = cryptoModule.createHash('sha256').update(params.password).digest('hex')
          await db.query(
            `INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data) VALUES ($1, $2, $3, $4)`,
            [id, params.email, hash, JSON.stringify(params.user_metadata || {})]
          )
          return { data: { user: { id } }, error: null }
        },
        async deleteUser(userId: string) {
          await db.query(`DELETE FROM auth.users WHERE id = $1`, [userId])
          return { error: null }
        },
      },
    },
    from(table: string) {
      return (createClient as any)().from(table)
    },
    async rpc(funcName: string, args: any) {
      if (funcName === 'create_salesman_profile') {
        const empCountRes = await db.query(`SELECT count(*) FROM profiles`)
        const empId = `EMP-${1000 + parseInt((empCountRes.rows[0] as any)?.count || '0') + 1}`
        const res = await db.query(
          `INSERT INTO profiles (id, username, full_name, role, status, employee_id, created_by)
           VALUES ($1, $2, $3, $4, 'active', $5, $6) RETURNING *`,
          [args.p_id, args.p_username, args.p_full_name, args.p_role, empId, args.p_created_by]
        )
        return { data: res.rows[0], error: null }
      }
      return { data: null, error: null }
    },
  }
}
