## Producer

A python Github crawler to find Finnish users with releases in their repository and publish to Kafka.

### Running

Use `config.sample.py` to set up your own `config.py` file.

Use the `init_db.sql` in the `scripts` folder to set up your database

```
virtalenv prod
source prod/bin/activate
pip install -r requirements.txt
make run OR make test
```

NB: For tests, you will need a locally running PG instance (or something other than your production database)