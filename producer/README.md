## Producer

A python Github crawler to find Finnish users with releases in their repository and publish to Kafka.

### Running

Use `config.sample.py` to set up your own `config.py` file.

```
virtalenv prod
pip install -r requirements.txt
python fin_search.py
```
