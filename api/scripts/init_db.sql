create schema api;

create table api.users (
    id serial primary key,
    user text not null,
    user_img text not null
)

create table api.repos (
    id serial primary key,
    repo text not null,
    repo_url text not null,
    repo_desc text not null,
    owned_by serial
)

ALTER TABLE ONLY api.repos ADD CONSTRAINT user_owns_fkey FOREIGN KEY (owned_by) REFERENCES api.users(id);

create role web_anon nologin;

grant usage on schema api to web_anon;
grant select on api.repos to web_anon;
grant select on api.users to web_anon;

create role authenticator noinherit login password 'Hiatus2Workers';
grant web_anon to authenticator;