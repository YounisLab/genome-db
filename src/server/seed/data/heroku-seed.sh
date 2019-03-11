#!/usr/bin/env bash

psql `heroku config:get DATABASE_URL` -c "DROP TABLE MCF10A;"
psql `heroku config:get DATABASE_URL` -c "DROP TABLE MCF7;"
psql `heroku config:get DATABASE_URL` -c "DROP TABLE MCF10A_vs_MCF7;"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF10A(gene VARCHAR,fpkm FLOAT,log2 FLOAT);"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF7(gene VARCHAR,fpkm FLOAT,log2 FLOAT);"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF10A_vs_MCF7(gene VARCHAR,log2_foldchange FLOAT,pvalue FLOAT);"

cat MCF10A.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat MCF7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat MCF10A_vs_MCF7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A_vs_MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"
