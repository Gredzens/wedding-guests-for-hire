create table if not exists financial_references (
  reference text primary key,
  record_type text not null check (record_type in ('sale', 'expense'))
);

insert into financial_references(reference, record_type)
select reference, 'sale' from sales
on conflict (reference) do nothing;

insert into financial_references(reference, record_type)
select reference, 'expense' from expenses
on conflict (reference) do nothing;

create or replace function claim_financial_reference()
returns trigger
language plpgsql
as $$
begin
  insert into financial_references(reference, record_type)
  values (new.reference, case when tg_table_name = 'sales' then 'sale' else 'expense' end);
  return new;
exception
  when unique_violation then
    raise exception 'That reference already exists.' using errcode = '23505';
end;
$$;

drop trigger if exists sales_claim_reference on sales;
create trigger sales_claim_reference
before insert on sales
for each row execute function claim_financial_reference();

drop trigger if exists expenses_claim_reference on expenses;
create trigger expenses_claim_reference
before insert on expenses
for each row execute function claim_financial_reference();

create or replace function protect_financial_origin()
returns trigger
language plpgsql
as $$
begin
  if old.reference is distinct from new.reference
    or (tg_table_name = 'sales' and old.submitter is distinct from new.submitter)
    or (tg_table_name = 'expenses' and old.reporter is distinct from new.reporter)
    or old.origin_channel is distinct from new.origin_channel
    or old.origin_chat_id is distinct from new.origin_chat_id then
    raise exception 'Transaction identity and origin are immutable.';
  end if;
  return new;
end;
$$;

drop trigger if exists sales_protect_origin on sales;
create trigger sales_protect_origin
before update on sales
for each row execute function protect_financial_origin();

drop trigger if exists expenses_protect_origin on expenses;
create trigger expenses_protect_origin
before update on expenses
for each row execute function protect_financial_origin();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sales_decision_consistency'
  ) then
    alter table sales add constraint sales_decision_consistency check (
      (status = 'PENDING' and final_split is null and decided_at is null and decided_by is null)
      or
      (status = 'APPROVED' and final_split is not null and decided_at is not null and decided_by = 'svetlana'
       and commission_pool_cents is not null and commission_richard_cents is not null
       and commission_anastasia_cents is not null and commission_jean_claude_cents is not null)
    );
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'expenses_decision_consistency'
  ) then
    alter table expenses add constraint expenses_decision_consistency check (
      (status = 'AWAITING_ALLOCATION' and final_allocation is null and decided_at is null and decided_by is null)
      or
      (status = 'ALLOCATED' and final_allocation is not null
       and ((final_allocation = 'OVERHEAD' and decided_by is null)
         or (decided_at is not null and decided_by = 'svetlana')))
    );
  end if;
end;
$$;

alter table financial_references enable row level security;
