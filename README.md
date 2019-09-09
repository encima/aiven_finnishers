## Aiven Homework

* A Github Kafka Producer that finds Finnish users with Github repos containing >=1 releases.
* A Kafka Consumer that stores these findings in a Postgres DB
* An OpenAPI created by Postgrest
* A Web frontend to show these users in all their glory

#### Task

Utilise Aiven's offerings of Postgres and Kafka to produce data into a Kafka topic and consume into a Postgres database

---

#### Running

There are four folders:

1. Producer -  This is a Python script that searches Github for Finnish users that have empty repositories and pushes to a Kafka topic
2. Consumer - This is a Python script that consumes those messages and stores them in a Postgres database
3. Web - This is a Svelte application (because I have not used it yet and wanted to try it) that provides a web site to view the data in a list
4. API - Postgrest service that connects to the Managed Aiven Postgres database and exposes an OpenAPI based on the db schema. There is also a script in there that was used to create the database, of no security importance

----

#### Tools

1. Postgrest was used for the API
2. Pony was used for the ORM in Python
3. Svelte was used for the web frontend
4. Git Secret was used to hide `env` and `config` files

## TODOS

* [ ] Better exception handling for the producer and consumer
* [ ] Fewer hard coded env vars
* [ ] Check user exists before creating
* [ ] Thread producer/create system service
* [ ] Use more complex search query so less parsing needs to be done
* [ ] Containerise
* [ ] As always...tests
