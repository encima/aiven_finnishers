## Aiven Homework

#### Task

Utilise Aiven's offerings of Postgres and Kafka to produce data into a Kafka topic and consume into a Postgres database

---

#### Running

There are four folders:

1. Producer -  This is a Python script that searches Github for Finnish users that have empty repositories and pushes to a Kafka topic
2. Consumer - This is a Python script that consumes those messages and stores them in a Postgres database
3. Web - This is a Svelte application (because I have not used it yet and wanted to try it) that provides a web site to view the data in a list
4. API - This is a tool that uses a Work In Progress Go package of mine (openape) to generate a DB Schema and API endpoints based on an OpenAPI specification. The API is then consumed by the web frontend

----

## TODOS

* [ ] Better exception handling for the producer and consumer
* [ ] Fewer hard coded env vars
* [ ] Check user exists before creating
* [ ] Thread producer/create system service
* [ ] Do not assume all commits are on `master` branch
* [ ] Containerise
* [ ] As always...tests
