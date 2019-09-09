FROM postgres

COPY scripts/entry.sh /docker-entrypoint.sh
COPY scripts/init_db.sql /init_db.sql

RUN chmod +x /docker-entrypoint.sh
RUN mkdir -p /var/lib/postgres
RUN chown -R postgres:postgres /var/lib/postgres
USER postgres

ENTRYPOINT ["/docker-entrypoint.sh"]
EXPOSE 5432
CMD ["postgres", "-D", "/var/lib/postgres/data"]

