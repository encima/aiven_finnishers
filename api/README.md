## README

Nothing in this folder is self developed and simply exposes a very simple (read: unsecured) API against the Postgres DB

### Running

Run `scripts/init_db.sql` to create your database. Note: the user created (and used by the API) will have no modification rights to the db.
`docker-compose up`

#### Ports

* 8000 - API
* 8080 - Swagger UI