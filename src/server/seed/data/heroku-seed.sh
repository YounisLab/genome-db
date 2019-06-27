#!/usr/bin/env bash

# CREATE TABLES

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF10A_vs_MCF7 (gene VARCHAR, mcf10a_fpkm FLOAT, mcf10a_log2 FLOAT, mcf7_fpkm FLOAT, mcf7_log2 FLOAT, log2_foldchange FLOAT, pvalue FLOAT);"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE RBP_RVALUES ( gene VARCHAR, rvalue JSONB );"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF_INTRON_PSI ( gene VARCHAR, intron_number INT CHECK (intron_number > 0), mcf10a_psi FLOAT, mcf7_psi FLOAT );"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE mcf_avg_psi ( gene VARCHAR, mcf10a_avg_psi FLOAT, mcf7_avg_psi FLOAT, mcf10a_avg_log2_psi FLOAT, mcf7_avg_log2_psi FLOAT );"

psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE U12_GENES ( gene VARCHAR );"

# UPLOAD DATA

cat mcf10a_vs_mcf7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A_vs_MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat RBP_rvalues.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY RBP_RVALUES FROM STDIN DELIMITER E'\t' CSV HEADER QUOTE '\"' ESCAPE '\';"

cat mcf_intron_psi.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF_INTRON_PSI FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat mcf_avg_psi.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF_AVG_PSI FROM STDIN DELIMITER E',' CSV HEADER;"

cat U12_genes.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY U12_GENES FROM STDIN DELIMITER E',' CSV HEADER;"
