#!/usr/bin/env bash

# CREATE TABLES

psql `heroku config:get DATABASE_URL` -c "DROP TABLE MCF10A_vs_MCF7;"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF10A_vs_MCF7 (gene VARCHAR, mcf10a_fpkm FLOAT, mcf10a_log2 FLOAT, mcf7_fpkm FLOAT, mcf7_log2 FLOAT, log2_foldchange FLOAT, pvalue FLOAT);"

psql `heroku config:get DATABASE_URL` -c "DROP TABLE RBP_RVALUES;"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE RBP_RVALUES ( gene VARCHAR, rvalue JSONB );"

# UPLOAD DATA

cat mcf10a_vs_mcf7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A_vs_MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat RBP_rvalues.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY RBP_RVALUES FROM STDIN DELIMITER E'\t' CSV HEADER QUOTE '\"' ESCAPE '\';"
