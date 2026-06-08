# Email-уведомления BuildConnect

In-app уведомления дублируются в **очередь email** (`email_outbox`) при каждой записи в `notifications`.

## Что уже работает без настройки

- Уведомления в приложении (колокольчик, Realtime)
- Запись в `email_outbox` со статусом `pending`

## Что нужно для отправки на почту

### 1. Применить миграцию

```bash
npx supabase db push
```

Миграция: `20260603120000_user_reviews_and_email_outbox.sql`

### 2. Resend (рекомендуется)

1. Аккаунт на [resend.com](https://resend.com)
2. API Key + верифицированный домен (или sandbox `onboarding@resend.dev` для тестов)

### 3. Edge Function

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set EMAIL_FROM="BuildConnect <noreply@yourdomain.com>"
npx supabase secrets set SITE_URL=https://build-connect-market.vercel.app
npx supabase functions deploy send-notification-email
```

### 4. Cron (каждые 5 мин)

В Supabase Dashboard → **Edge Functions → send-notification-email → Schedule**  
или pg_cron / внешний cron:

```bash
curl -X POST "https://YOUR_REF.supabase.co/functions/v1/send-notification-email" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Какие события попадают в email

| Тип | Источник |
|-----|----------|
| Новое сообщение | триггер `trg_notify_new_message` |
| Завершение заявки | триггер `trg_notify_request_completed` |
| Модерация, жалобы | staff insert в `notifications` |

## Проверка очереди

SQL Editor:

```sql
SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 10;
```

## Без Resend

Очередь копится в `email_outbox` — приложение работает, email просто не уходит до настройки.
