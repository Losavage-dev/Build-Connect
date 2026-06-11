-- События просмотра и заказа материалов для рекомендаций
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_event_type_check;

ALTER TABLE public.user_events ADD CONSTRAINT user_events_event_type_check CHECK (
  event_type IN (
    'view_company',
    'view_tender',
    'contact_company',
    'bid_tender',
    'like_promo',
    'view_promo',
    'view_material',
    'order_material'
  )
);
