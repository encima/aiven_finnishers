
create schema api;

create table api.user (
    id serial primary key,
    username text not null,
    avatar_url text not null
);

create table api.repo (
    id serial primary key,
    name text not null,
    url text not null,
    descrip text,
    owned_by serial
);

create table api.release (
    id serial primary key,
    title text,
    descrip text,
    url text not null,
    part_of serial
);

ALTER TABLE ONLY api.repo ADD CONSTRAINT user_owns_fkey FOREIGN KEY (owned_by) REFERENCES api.user(id);
ALTER TABLE ONLY api.release ADD CONSTRAINT repo_part_of_fkey FOREIGN KEY (part_of) REFERENCES api.repo(id);

create view repo_releases as
select username, avatar_url, name as repo_name, repo.url as repo_url, repo.descrip as repo_desc, r.title as release_title, r.descrip as release_desc, r.url as release_url from api.user left join repo on repo.owned_by=api.user.id left join release r on repo.id = r.part_of order by api.user.id;

create role web_anon nologin;

grant usage on schema api to web_anon;
grant select on api.repo to web_anon;
grant select on api.user to web_anon;
grant select on api.release to web_anon;

grant select on api.repo_releases to web_anon;
ALTER ROLE web_anon SET search_path='api';

create role authenticator noinherit login password 'Hiatus2Workers';
grant web_anon to authenticator;

ALTER ROLE authenticator SET search_path='api';