from kafka import KafkaConsumer
import config
import sys

class Consumer:

    def __init__(self):
        try:
            self.con = KafkaConsumer(config.TOPIC, auto_offset_reset='earliest', bootstrap_servers=config.SERVERS, enable_auto_commit=config.AUTO_COMMIT,
                          security_protocol='SSL',
                          ssl_check_hostname=True,
                          ssl_cafile=config.SSL['ca'],
                          ssl_certfile=config.SSL['cert'],
                          ssl_keyfile=config.SSL['key'])
        except Exception as e:
            print(e)
            sys.exit(1)

        # TODO init db
        print(self.con)
        try:
            for msg in self.con:
                print(msg)
        except Exception as e:
            print(str(e))

    def db_connect(self):
        try:
            self.conn = psycopg2.connect(config.PG_URL)
        except Exception as e:
            print(str(e))
            sys.exit(1)

if __name__ == '__main__':
    c = Consumer()

