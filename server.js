// ─────────────────────────────────────────────
// GreenLight — Servidor local que conecta ao Snowflake
// ─────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const snowflake = require('snowflake-sdk');

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // serve o dashboard.html da mesma pasta

// ─── Conexão Snowflake ───
const connection = snowflake.createConnection({
  account:   process.env.SNOWFLAKE_ACCOUNT,
  username:  process.env.SNOWFLAKE_USER,
  password:  process.env.SNOWFLAKE_PASSWORD,
  role:      process.env.SNOWFLAKE_ROLE,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database:  process.env.SNOWFLAKE_DATABASE,
  schema:    process.env.SNOWFLAKE_SCHEMA,
});

connection.connect((err, conn) => {
  if (err) {
    console.error('❌ Erro ao conectar no Snowflake:', err.message);
    process.exit(1);
  }
  // Ativa o warehouse na sessão
  connection.execute({
    sqlText: `USE WAREHOUSE ${process.env.SNOWFLAKE_WAREHOUSE}`,
    complete: (err) => {
      if (err) {
        console.error('❌ Erro ao ativar warehouse:', err.message);
        process.exit(1);
      }
      console.log('✅ Conectado ao Snowflake e warehouse ativado!');
    }
  });
});

// ─── Helper para rodar queries ───
function runQuery(sql) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err, stmt, rows) => {
        if (err) return reject(err);
        resolve(rows);
      },
    });
  });
}

// ─── Endpoint: C1s últimos 7 dias ───
app.get('/api/c1', async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT 
        sub.clinic_id      AS "CLINIC_ID",
        sub.clinic_name    AS "CLINIC_NAME",
        onb.owner_email    AS "OWNER_EMAIL",
        COUNT(pa.pre_analysis_id) AS "C1S_ULTIMOS_7_DIAS"
      FROM CAPIM_DATA.CAPIM_ANALYTICS.clinic_subscriptions sub
      LEFT JOIN CAPIM_DATA.CAPIM_ANALYTICS.pre_analyses pa
        ON sub.clinic_id = pa.clinic_id
        AND pa.pre_analysis_created_at >= DATEADD(day, -7, CURRENT_DATE())
      INNER JOIN CAPIM_DATA.CAPIM_ANALYTICS.clinic_accreditations acc
        ON sub.clinic_id = acc.clinic_id
        AND acc.is_accreditation_approved = true
      LEFT JOIN CAPIM_DATA.CAPIM_ANALYTICS.cs_onboarding onb
        ON sub.clinic_id = onb.clinic_id
      WHERE sub.is_active_subscription = true
        AND sub.is_current_clinic_subscription = true
      GROUP BY sub.clinic_id, sub.clinic_name, onb.owner_email
      HAVING COUNT(pa.pre_analysis_id) < 5
      ORDER BY "C1S_ULTIMOS_7_DIAS" ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint: C2s do mês ───
app.get('/api/c2', async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT 
        acc.clinic_id                    AS "CLINIC_ID",
        acc.clinic_name                  AS "CLINIC_NAME",
        acc.accreditation_approved_at    AS "DATA_C2",
        onb.owner_email                  AS "OWNER_EMAIL",
        SUM(pa.requested_amount)         AS "VALOR_ORIGINADO"
      FROM CAPIM_DATA.CAPIM_ANALYTICS.clinic_accreditations acc
      LEFT JOIN CAPIM_DATA.CAPIM_ANALYTICS.pre_analyses pa
        ON acc.clinic_id = pa.clinic_id
        AND pa.pre_analysis_created_at >= DATE_TRUNC('month', CURRENT_DATE())
        AND pa.pre_analysis_created_at <  DATE_TRUNC('month', DATEADD(month, 1, CURRENT_DATE()))
      LEFT JOIN CAPIM_DATA.CAPIM_ANALYTICS.cs_onboarding onb
        ON acc.clinic_id = onb.clinic_id
      WHERE acc.is_accreditation_approved = true
        AND acc.accreditation_approved_at >= DATE_TRUNC('month', CURRENT_DATE())
        AND acc.accreditation_approved_at <  DATE_TRUNC('month', DATEADD(month, 1, CURRENT_DATE()))
        AND acc.is_most_recent_accreditation = true
      GROUP BY acc.clinic_id, acc.clinic_name, acc.accreditation_approved_at, onb.owner_email
      ORDER BY "VALOR_ORIGINADO" DESC NULLS LAST
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint: Base de clínicas (para ficha, score, status e WhatsApp) ───
app.get('/api/clinicas', async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT 
        c.clinic_id        AS "CLINIC_ID",
        c.clinic_name      AS "CLINIC_NAME",
        c.phone_number     AS "PHONE_NUMBER",
        onb.owner_email    AS "OWNER_EMAIL",
        onb.engagement_status                  AS "ENGAGEMENT_STATUS",
        acc.friendly_accreditation_status      AS "STATUS_CREDENCIAMENTO",
        score.clinic_credit_score              AS "SCORE"
      FROM CAPIM_DATA.CAPIM_ANALYTICS.clinics c
      INNER JOIN CAPIM_DATA.CAPIM_ANALYTICS.clinic_subscriptions sub
        ON c.clinic_id = sub.clinic_id
        AND sub.is_active_subscription = true
        AND sub.is_current_clinic_subscription = true
      LEFT JOIN CAPIM_DATA.CAPIM_ANALYTICS.clinic_accreditations acc
        ON c.clinic_id = acc.clinic_id
        AND acc.is_most_recent_accreditation = true
      LEFT JOIN CAPIM_DATA.CAPIM_ANALYTICS.cs_onboarding onb
        ON c.clinic_id = onb.clinic_id
      LEFT JOIN (
        SELECT clinic_id, clinic_credit_score 
        FROM CAPIM_DATA.CAPIM_ANALYTICS.clinic_score_logs 
        QUALIFY ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY clinic_score_changed_at DESC) = 1
      ) score ON c.clinic_id = score.clinic_id
      ORDER BY c.clinic_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Inicia o servidor ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 GreenLight rodando!\n`);
  console.log(`   Abra no navegador: http://localhost:${PORT}/dashboard_capim.html\n`);
});
