#!/usr/bin/env bash

cat MCF10A.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat MCF7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat MCF10A_vs_MCF7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A_vs_MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"
