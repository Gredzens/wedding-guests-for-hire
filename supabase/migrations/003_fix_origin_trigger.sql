create or replace function protect_financial_origin()
returns trigger
language plpgsql
as $$
begin
  if old.reference is distinct from new.reference
    or old.origin_channel is distinct from new.origin_channel
    or old.origin_chat_id is distinct from new.origin_chat_id then
    raise exception 'Transaction identity and origin are immutable.';
  end if;

  if tg_table_name = 'sales' then
    if old.submitter is distinct from new.submitter then
      raise exception 'Transaction identity and origin are immutable.';
    end if;
  elsif tg_table_name = 'expenses' then
    if old.reporter is distinct from new.reporter then
      raise exception 'Transaction identity and origin are immutable.';
    end if;
  else
    raise exception 'Unexpected financial table: %.', tg_table_name;
  end if;

  return new;
end;
$$;
