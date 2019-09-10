## Consumer

A python script to ingest data from Kafka topic to a Postgres Database.

### Running

Use `config.sample.py` to set up your own `config.py` file.

```
virtalenv cons
source cons/bin/activate
pip install -r requirements.txt
make run OR make test
```